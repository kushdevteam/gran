import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
// Removed authentication imports
import { getChatResponse, generateChallengeContent, analyzeMarketSentiment } from "./openai";
import { solanaService } from "./solana-service";
import { telegramBot } from "./telegram-bot";
import { 
  insertChatMessageSchema, 
  insertUserChallengeSchema, 
  insertStoryVoteSchema,
  insertCommunitySubmissionSchema,
  registerUserSchema,
  loginUserSchema,
  type User,
  type RegisterUser,
  type LoginUser
} from "@shared/schema";
import { getDailyRewardStatus, claimDailyReward, formatStreakDisplay, getMotivationalMessage } from "./daily-rewards";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Simplified session configuration for maximum compatibility
  app.use(session({
    secret: 'gac-session-secret-dev',
    resave: true,
    saveUninitialized: true,
    cookie: {
      secure: false,
      httpOnly: false, // Allow client-side access for debugging
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  // Removed authentication middleware and routes

  // Wallet validation and authentication routes
  app.post('/api/wallet/validate', async (req, res) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ message: "Wallet address is required" });
      }

      const isValid = await solanaService.validateSolanaAddress(address);
      
      if (!isValid) {
        return res.json({
          isValid: false,
          message: "Invalid Solana address format"
        });
      }

      const accountInfo = await solanaService.getAccountInfo(address);
      
      if (!accountInfo) {
        // Still consider the address valid if format is correct, even if RPC fails
        return res.json({
          isValid: true,
          balance: 0,
          exists: false,
          address,
          message: "Address format is valid. Network verification unavailable."
        });
      }

      return res.json({
        isValid: true,
        balance: accountInfo.balance,
        exists: accountInfo.exists,
        address
      });
    } catch (error) {
      console.error("Error validating wallet:", error);
      res.status(500).json({ message: "Failed to validate wallet" });
    }
  });

  // Wallet Registration Route
  app.post('/api/wallet/register', async (req, res) => {
    try {
      const validation = registerUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid registration data",
          errors: validation.error.issues
        });
      }

      const { profileName, solanaAddress, pin, faction } = validation.data;

      // Validate Solana address format
      const isValidAddress = await solanaService.validateSolanaAddress(solanaAddress);
      if (!isValidAddress) {
        return res.status(400).json({ message: "Invalid Solana address format" });
      }

      // Check if address is already registered
      const existingUser = await storage.getUserBySolanaAddress(solanaAddress);
      if (existingUser) {
        return res.status(400).json({ message: "This Solana address is already registered" });
      }

      // Hash the PIN
      const saltRounds = 10;
      const hashedPin = await bcrypt.hash(pin, saltRounds);

      // Create new user
      const newUser = await storage.createUser({
        profileName,
        solanaAddress,
        pin: hashedPin,
        faction: faction || "grok"
      });

      res.json({ 
        success: true, 
        message: "Registration successful!",
        user: {
          id: newUser.id,
          profileName: newUser.profileName,
          solanaAddress: newUser.solanaAddress,
          faction: newUser.faction
        }
      });
    } catch (error) {
      console.error("Error during wallet registration:", error);
      res.status(500).json({ message: "Failed to register wallet" });
    }
  });

  // Wallet Login Route
  app.post('/api/wallet/login', async (req, res) => {
    try {
      const validation = loginUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid login data",
          errors: validation.error.issues
        });
      }

      const { solanaAddress, pin } = validation.data;

      // Find user by Solana address
      const user = await storage.getUserBySolanaAddress(solanaAddress);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify PIN
      const isPinValid = await bcrypt.compare(pin, user.pin);
      if (!isPinValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set up session for wallet authentication
      console.log("Before setting session - ID:", (req as any).session.id);
      (req as any).session.userId = user.id;
      (req as any).session.walletAuth = true;
      console.log("After setting session vars - userId:", (req as any).session.userId, "walletAuth:", (req as any).session.walletAuth);

      // Save session explicitly before responding
      (req as any).session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Session save failed" });
        }
        
        console.log("Session saved successfully for user:", user.id, "with session ID:", (req as any).session.id);
        res.json({ 
          success: true, 
          message: "Login successful!",
          user: {
            id: user.id,
            profileName: user.profileName,
            solanaAddress: user.solanaAddress,
            faction: user.faction,
            gacBalance: user.gacBalance,
            totalXP: user.totalXP,
            level: user.level
          }
        });
      });
    } catch (error) {
      console.error("Error during wallet login:", error);
      res.status(500).json({ message: "Failed to login with wallet" });
    }
  });

  // Authentication middleware for wallet-based auth
  const requireWalletAuth = (req: any, res: any, next: any) => {
    console.log("Auth check - session:", req.session?.id, "userId:", req.session?.userId, "walletAuth:", req.session?.walletAuth);
    
    if (!req.session?.userId || !req.session?.walletAuth) {
      console.log("Auth failed - no valid session");
      return res.status(401).json({ message: "Authentication required" });
    }
    
    console.log("Auth successful for user:", req.session.userId);
    req.userId = req.session.userId;
    next();
  };

  // Generate Telegram web app token
  app.post('/api/telegram/generate-webapp-token', async (req, res) => {
    try {
      const { telegramId } = req.body;
      
      if (!telegramId) {
        return res.status(400).json({ message: "Telegram ID required" });
      }

      // Find linked user
      const user = await storage.getTelegramLinkedUser(telegramId);
      if (!user) {
        return res.status(404).json({ message: "User not linked to Telegram" });
      }

      // Generate temporary JWT token for web app access
      const token = jwt.sign(
        { userId: user.id, telegramId, type: 'webapp' },
        process.env.SESSION_SECRET || 'dev-secret-12345',
        { expiresIn: '1h' }
      );

      res.json({ 
        token,
        webAppUrl: `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/telegram-webapp?token=${token}`
      });
    } catch (error) {
      console.error("Error generating webapp token:", error);
      res.status(500).json({ message: "Failed to generate token" });
    }
  });

  // Telegram web app entry point
  app.get('/telegram-webapp', async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token) {
        return res.redirect('/?error=no-token');
      }

      // Verify JWT token
      const decoded = jwt.verify(
        token as string, 
        process.env.SESSION_SECRET || 'dev-secret-12345'
      ) as any;

      if (decoded.type !== 'webapp') {
        return res.redirect('/?error=invalid-token');
      }

      // Set up session for this user
      (req as any).session.userId = decoded.userId;
      (req as any).session.walletAuth = true;
      (req as any).session.telegramAuth = true;

      // Save session and redirect
      (req as any).session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.redirect('/?error=session-failed');
        }
        
        console.log("Telegram webapp session created for user:", decoded.userId);
        res.redirect('/');
      });
    } catch (error) {
      console.error("Error in Telegram webapp auth:", error);
      res.redirect('/?error=auth-failed');
    }
  });

  // User session route to verify authentication
  app.get('/api/auth/user', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        profileName: user.profileName,
        solanaAddress: user.solanaAddress,
        faction: user.faction,
        gacBalance: user.gacBalance,
        totalXP: user.totalXP,
        level: user.level,
        createdAt: user.createdAt
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes
  app.patch('/api/user/faction', requireWalletAuth, async (req: any, res) => {
    try {
      const { faction } = req.body;
      
      if (!["grok", "ani"].includes(faction)) {
        return res.status(400).json({ message: "Invalid faction" });
      }

      await storage.updateUserFaction(req.userId, faction);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating faction:", error);
      res.status(500).json({ message: "Failed to update faction" });
    }
  });

  app.get('/api/user/stats', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        gacBalance: user.gacBalance,
        totalXP: user.totalXP,
        grokPoints: user.grokPoints,
        aniPoints: user.aniPoints,
        level: user.level,
        faction: user.faction
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Daily Rewards routes
  app.get('/api/user/daily-reward/status', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const status = await getDailyRewardStatus(userId);
      
      res.json({
        ...status,
        streakDisplay: formatStreakDisplay(status.currentStreak)
      });
    } catch (error) {
      console.error("Error fetching daily reward status:", error);
      res.status(500).json({ message: "Failed to fetch daily reward status" });
    }
  });

  app.post('/api/user/daily-reward/claim', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      
      // Get loyalty data for multiplier
      const loyaltyData = await storage.calculateLoyaltyScore(userId);
      
      const result = await claimDailyReward(userId);
      
      // Apply loyalty multiplier to daily rewards
      if (loyaltyData.multiplier > 1.0) {
        const originalCoins = result.reward.coins || 0;
        const originalXp = result.reward.xp || 0;
        
        result.reward.coins = Math.round(originalCoins * loyaltyData.multiplier);
        result.reward.xp = Math.round(originalXp * loyaltyData.multiplier);
        
        // Update user balance with loyalty bonus
        const bonusCoins = result.reward.coins - originalCoins;
        const bonusXp = result.reward.xp - originalXp;
        
        if (bonusCoins > 0 || bonusXp > 0) {
          const currentUser = await storage.getUser(userId);
          const newBalance = parseFloat(currentUser?.gacBalance || "0") + bonusCoins;
          
          await storage.updateUserStats(userId, {
            gacBalance: newBalance.toFixed(2),
            totalXP: bonusXp
          });
          
          // Send loyalty bonus notification
          await storage.createNotification({
            userId,
            type: "loyalty_bonus",
            title: "Daily Loyalty Bonus!",
            message: `Your ${loyaltyData.tier} tier granted you ${bonusCoins} extra coins and ${bonusXp} extra XP!`,
            data: { tier: loyaltyData.tier, bonusCoins, bonusXp }
          });
        }
      }
      
      const motivationalMessage = getMotivationalMessage(result.newStreak, result.reward);
      
      res.json({
        success: true,
        reward: result.reward,
        newStreak: result.newStreak,
        streakDisplay: formatStreakDisplay(result.newStreak),
        message: motivationalMessage,
        loyaltyBonus: loyaltyData.multiplier > 1.0 ? {
          tier: loyaltyData.tier,
          multiplier: loyaltyData.multiplier,
          applied: true
        } : null
      });
    } catch (error) {
      console.error("Error claiming daily reward:", error);
      
      if (error instanceof Error) {
        if (error.message === "Daily reward already claimed today") {
          return res.status(400).json({ message: error.message });
        }
        if (error.message === "User not found") {
          return res.status(404).json({ message: error.message });
        }
      }
      
      res.status(500).json({ message: "Failed to claim daily reward" });
    }
  });

  // AI Chat routes
  app.post('/api/chat/:aiType', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { aiType } = req.params;
      const { message } = req.body;

      if (!["grok", "ani"].includes(aiType)) {
        return res.status(400).json({ message: "Invalid AI type" });
      }

      if (!message || typeof message !== "string") {
        return res.status(400).json({ message: "Message is required" });
      }

      // Get recent conversation history
      const history = await storage.getUserChatHistory(userId, aiType as "grok" | "ani", 6);
      const conversationHistory = history.reverse().flatMap(msg => [
        { role: "user" as const, content: msg.userMessage },
        { role: "assistant" as const, content: msg.aiResponse }
      ]);

      // Get AI response with evolution
      const { response: aiResponse, responseTime } = await getChatResponse(
        message, 
        aiType as "grok" | "ani", 
        conversationHistory,
        userId
      );

      // Save chat message
      const chatMessage = await storage.saveChatMessage({
        userId,
        aiType: aiType as "grok" | "ani",
        userMessage: message,
        aiResponse
      });

      // Award XP for AI interactions (with potential loyalty multiplier)
      const user = await storage.getUser(userId);
      const loyaltyData = await storage.calculateLoyaltyScore(userId);
      const baseXP = 5;
      const multipliedXP = Math.round(baseXP * loyaltyData.multiplier);
      
      const currentXP = parseInt(user?.xp || "0");
      await storage.updateUserXP(userId, (currentXP + multipliedXP).toString());

      res.json({ 
        message: aiResponse,
        messageId: chatMessage.id,
        timestamp: chatMessage.createdAt,
        xpEarned: multipliedXP,
        responseTime,
        evolutionInfo: {
          personalityLevel: `${aiType} has evolved through ${loyaltyData.tier} interactions`,
          learningActive: true
        }
      });
    } catch (error) {
      console.error("Error handling chat:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  app.get('/api/chat/:aiType/history', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { aiType } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!["grok", "ani"].includes(aiType)) {
        return res.status(400).json({ message: "Invalid AI type" });
      }

      const history = await storage.getUserChatHistory(userId, aiType as "grok" | "ani", limit);
      res.json(history);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  // Challenge routes
  app.get('/api/challenges', async (req, res) => {
    try {
      const challenges = await storage.getActiveChallenges();
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      res.status(500).json({ message: "Failed to fetch challenges" });
    }
  });

  app.get('/api/challenges/:faction', async (req, res) => {
    try {
      const { faction } = req.params;
      
      if (!["grok", "ani"].includes(faction)) {
        return res.status(400).json({ message: "Invalid faction" });
      }

      const challenges = await storage.getChallengesByFaction(faction as "grok" | "ani");
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching faction challenges:", error);
      res.status(500).json({ message: "Failed to fetch challenges" });
    }
  });

  app.post('/api/challenges/submit', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { challengeId, submission: userSubmission } = req.body;
      
      if (!challengeId || !userSubmission) {
        return res.status(400).json({ message: "Challenge ID and submission are required" });
      }

      // Get challenge details
      const challenge = await storage.getChallengeById(challengeId);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }

      // Validate submission using OpenAI
      const { challengeValidator } = await import("./challenge-validator");
      const validationResult = await challengeValidator.validateSubmission(
        challenge.challengeData,
        challenge.solutionData,
        userSubmission
      );

      // Save submission with score and completion status
      const submissionData = insertUserChallengeSchema.parse({
        userId,
        challengeId,
        submission: userSubmission,
        completed: validationResult.passed,
        score: validationResult.score,
        completedAt: validationResult.passed ? new Date() : null
      });

      const savedSubmission = await storage.submitChallenge(submissionData);
      
      // Award points and NFT if passed (with loyalty multiplier)
      if (validationResult.passed) {
        // Calculate loyalty multiplier
        const loyaltyData = await storage.calculateLoyaltyScore(userId);
        const multiplier = loyaltyData.multiplier;
        
        // Apply loyalty multiplier to rewards
        const baseReward = challenge.reward;
        const multipliedReward = Math.round(baseReward * multiplier);
        
        const pointsToAdd = challenge.faction === "grok" 
          ? { grokPoints: multipliedReward }
          : { aniPoints: multipliedReward };
        
        await storage.updateUserStats(userId, {
          ...pointsToAdd,
          totalXP: multipliedReward
        });

        // Update user's loyalty after completing faction challenge
        await storage.updateUserLoyalty(userId);

        // Award NFT for exceptional performance (score >= 90)
        if (validationResult.score >= 90) {
          const nftRarity = validationResult.score >= 95 ? "epic" : "rare";
          const nftName = `${challenge.faction === "grok" ? "Logic Master" : "Creative Genius"} Badge`;
          const nftDescription = `Awarded for exceptional performance in ${challenge.title} (Score: ${validationResult.score})`;
          
          await storage.createNFT({
            tokenId: parseInt(`${Date.now().toString().slice(-8)}`),
            name: nftName,
            description: nftDescription,
            imageUrl: "",
            rarity: nftRarity,
            faction: challenge.faction,
            ownerId: userId,
            attributes: { challengeId, score: validationResult.score }
          });

          // Award special loyalty NFT if tier is high enough
          if (loyaltyData.tier === "diamond" || loyaltyData.tier === "platinum") {
            await storage.awardLoyaltyNFT(userId, loyaltyData.tier);
          }
        }

        // Send reward notification with loyalty bonus info
        if (multiplier > 1.0) {
          await storage.createNotification({
            userId,
            type: "loyalty_bonus",
            title: "Loyalty Bonus Applied!",
            message: `Your ${loyaltyData.tier} loyalty tier earned you ${multipliedReward - baseReward} extra reward points!`,
            data: { 
              tier: loyaltyData.tier, 
              multiplier, 
              baseReward, 
              bonusReward: multipliedReward - baseReward 
            }
          });
        }
      }

      res.json({
        ...savedSubmission,
        validation: validationResult
      });
    } catch (error) {
      console.error("Error submitting challenge:", error);
      res.status(500).json({ message: "Failed to submit challenge" });
    }
  });

  // Get individual challenge details
  app.get('/api/challenges/:id/details', async (req, res) => {
    try {
      const { id } = req.params;
      const challenge = await storage.getChallengeById(id);
      
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }

      res.json(challenge);
    } catch (error) {
      console.error("Error fetching challenge details:", error);
      res.status(500).json({ message: "Failed to fetch challenge details" });
    }
  });

  // Story routes
  app.get('/api/story/current', async (req, res) => {
    try {
      const currentChapter = await storage.getCurrentStoryChapter();
      res.json(currentChapter);
    } catch (error) {
      console.error("Error fetching current story:", error);
      res.status(500).json({ message: "Failed to fetch current story" });
    }
  });

  app.get('/api/story/chapters', async (req, res) => {
    try {
      const chapters = await storage.getStoryChapters();
      res.json(chapters);
    } catch (error) {
      console.error("Error fetching story chapters:", error);
      res.status(500).json({ message: "Failed to fetch story chapters" });
    }
  });

  app.post('/api/story/vote', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Calculate weighted voting power with faction bonus and NFT multipliers
      const baseVotingPower = parseFloat(user.gacBalance || "0");
      const userNFTs = await storage.getUserNFTs(userId);
      
      // NFT voting power bonus (epic +5, rare +3, common +1)
      const nftBonus = userNFTs.reduce((total, nft) => {
        switch (nft.rarity) {
          case "epic": return total + 5;
          case "rare": return total + 3;
          case "legendary": return total + 10;
          default: return total + 1;
        }
      }, 0);
      
      // Faction alignment bonus (20% more for aligned votes)
      const factionBonus = user.faction === req.body.choice ? 1.2 : 1.0;
      const totalVotingPower = Math.floor((baseVotingPower + nftBonus) * factionBonus);

      // Check for duplicate votes
      const existingVote = await storage.getExistingVote(userId, req.body.chapterId);
      if (existingVote) {
        return res.status(400).json({ message: "You have already voted on this chapter" });
      }

      const validatedData = insertStoryVoteSchema.parse({
        ...req.body,
        userId,
        votingPower: totalVotingPower.toString()
      });

      const vote = await storage.createStoryVote(validatedData);
      
      // Award participation rewards
      await storage.updateUserXP(userId, (parseInt(user.totalXP?.toString() || "0") + 3).toString());
      
      res.json({ 
        ...vote, 
        votingPower: totalVotingPower,
        breakdown: { baseVotingPower, nftBonus, factionBonus }
      });
    } catch (error) {
      console.error("Error submitting vote:", error);
      res.status(500).json({ message: "Failed to submit vote" });
    }
  });

  app.get('/api/story/votes/:chapterId', async (req, res) => {
    try {
      const { chapterId } = req.params;
      const votes = await storage.getChapterVotes(chapterId);
      res.json(votes);
    } catch (error) {
      console.error("Error fetching votes:", error);
      res.status(500).json({ message: "Failed to fetch votes" });
    }
  });

  // NFT routes
  app.get('/api/nfts/user', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const nfts = await storage.getUserNFTs(userId);
      res.json(nfts);
    } catch (error) {
      console.error("Error fetching user NFTs:", error);
      res.status(500).json({ message: "Failed to fetch NFTs" });
    }
  });

  app.get('/api/nfts/marketplace', async (req, res) => {
    try {
      const nfts = await storage.getMarketplaceNFTs();
      res.json(nfts);
    } catch (error) {
      console.error("Error fetching marketplace NFTs:", error);
      res.status(500).json({ message: "Failed to fetch marketplace NFTs" });
    }
  });

  // NFT buy endpoint
  app.post('/api/nfts/buy', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { nftId, price } = req.body;
      
      const user = await storage.getUser(userId);
      const currentBalance = parseFloat(user?.gacBalance || "0");
      const nftPrice = parseFloat(price);
      
      if (currentBalance < nftPrice) {
        return res.status(400).json({ message: "Insufficient GAC balance" });
      }
      
      // Transfer NFT and update balance
      await storage.transferNFT(nftId, userId);
      await storage.updateUserBalance(userId, (currentBalance - nftPrice).toString());
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error buying NFT:", error);
      res.status(500).json({ message: "Failed to purchase NFT" });
    }
  });

  // NFT list for sale endpoint
  app.post('/api/nfts/list', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { nftId, price } = req.body;
      
      await storage.listNFTForSale(nftId, price, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error listing NFT:", error);
      res.status(500).json({ message: "Failed to list NFT for sale" });
    }
  });

  // Community routes
  app.get('/api/community/submissions', async (req, res) => {
    try {
      const { category } = req.query;
      const submissions = await storage.getCommunitySubmissions(category as string);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.post('/api/community/submit', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const validatedData = insertCommunitySubmissionSchema.parse({
        ...req.body,
        authorId: userId
      });

      const submission = await storage.createCommunitySubmission(validatedData);
      res.json(submission);
    } catch (error) {
      console.error("Error creating submission:", error);
      res.status(500).json({ message: "Failed to create submission" });
    }
  });

  app.post('/api/community/vote/:submissionId', async (req, res) => {
    try {
      const { submissionId } = req.params;
      const { isUpvote } = req.body;
      
      await storage.voteOnSubmission(submissionId, Boolean(isUpvote));
      res.json({ success: true });
    } catch (error) {
      console.error("Error voting on submission:", error);
      res.status(500).json({ message: "Failed to vote on submission" });
    }
  });

  // Leaderboard routes
  // Enhanced leaderboard with multiple categories
  app.get('/api/leaderboard/:faction', async (req, res) => {
    try {
      const { faction } = req.params;
      const { category = 'points', period = 'all-time', limit = 10 } = req.query;
      
      const leaderboard = await storage.getLeaderboard({
        faction: faction as 'grok' | 'ani',
        category: category as 'points' | 'xp' | 'gac' | 'nfts' | 'voting',
        period: period as 'daily' | 'weekly' | 'monthly' | 'all-time',
        limit: parseInt(limit as string)
      });
      
      res.json(leaderboard);
    } catch (error) {
      console.error(`Error fetching ${faction} leaderboard:`, error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Faction war statistics
  app.get('/api/leaderboard/faction-war', async (req, res) => {
    try {
      const stats = await storage.getFactionWarStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching faction war stats:", error);
      res.status(500).json({ message: "Failed to fetch faction war stats" });
    }
  });

  // Overall platform leaderboard
  app.get('/api/leaderboard/overall', async (req, res) => {
    try {
      const { category = 'xp', limit = 50 } = req.query;
      const leaderboard = await storage.getOverallLeaderboard({
        category: category as 'xp' | 'gac' | 'nfts' | 'challenges',
        limit: parseInt(limit as string)
      });
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching overall leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch overall leaderboard" });
    }
  });

  // Oracle/Analytics routes
  app.get('/api/oracle/predictions', async (req, res) => {
    try {
      // Get community data for analysis
      const grokLeaderboard = await storage.getGrokLeaderboard(100);
      const aniLeaderboard = await storage.getAniLeaderboard(100);
      
      const analysis = await analyzeMarketSentiment({
        totalUsers: grokLeaderboard.length + aniLeaderboard.length,
        grokFactionSize: grokLeaderboard.length,
        aniFactionSize: aniLeaderboard.length,
        recentActivity: Math.floor(Math.random() * 100) // Mock activity score
      });

      res.json(analysis);
    } catch (error) {
      console.error("Error generating predictions:", error);
      res.status(500).json({ message: "Failed to generate predictions" });
    }
  });

  // Governance API routes
  app.get('/api/governance/proposals', async (req, res) => {
    try {
      const proposals = await storage.getGovernanceProposals();
      res.json(proposals);
    } catch (error) {
      console.error("Error fetching governance proposals:", error);
      res.status(500).json({ message: "Failed to fetch proposals" });
    }
  });

  app.post('/api/governance/proposals', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { insertGovernanceProposalSchema } = await import("@shared/schema");
      
      const proposalData = insertGovernanceProposalSchema.parse({
        ...req.body,
        authorId: userId,
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      });

      const proposal = await storage.createGovernanceProposal(proposalData);
      res.json(proposal);
    } catch (error) {
      console.error("Error creating governance proposal:", error);
      res.status(500).json({ message: "Failed to create proposal" });
    }
  });

  app.post('/api/governance/vote', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { proposalId, vote } = req.body;
      
      // Calculate voting power (same as story voting)
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const baseVotingPower = parseFloat(user.gacBalance || "0");
      const userNFTs = await storage.getUserNFTs(userId);
      
      const nftBonus = userNFTs.reduce((total, nft) => {
        switch (nft.rarity) {
          case "epic": return total + 5;
          case "rare": return total + 3;
          case "legendary": return total + 10;
          default: return total + 1;
        }
      }, 0);
      
      const totalVotingPower = baseVotingPower + nftBonus;

      const { insertGovernanceVoteSchema } = await import("@shared/schema");
      const voteData = insertGovernanceVoteSchema.parse({
        proposalId,
        userId,
        vote,
        votingPower: totalVotingPower.toString()
      });

      const governanceVote = await storage.createGovernanceVote(voteData);
      await storage.updateUserXP(userId, (parseInt(user.totalXP || "0") + 2).toString());
      
      res.json(governanceVote);
    } catch (error) {
      console.error("Error submitting governance vote:", error);
      res.status(500).json({ message: "Failed to submit vote" });
    }
  });

  app.get('/api/governance/my-votes', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const votes = await storage.getUserGovernanceVotes(userId);
      res.json(votes);
    } catch (error) {
      console.error("Error fetching user votes:", error);
      res.status(500).json({ message: "Failed to fetch user votes" });
    }
  });

  // Analytics API routes
  app.get('/api/oracle/dashboard-stats', requireWalletAuth, async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/oracle/predictions', requireWalletAuth, async (req: any, res) => {
    try {
      const predictions = await storage.getPredictionMarkets();
      res.json(predictions);
    } catch (error) {
      console.error("Error fetching predictions:", error);
      res.status(500).json({ message: "Failed to fetch predictions" });
    }
  });

  // Enhanced analytics routes
  app.get('/api/analytics/faction-performance', requireWalletAuth, async (req: any, res) => {
    try {
      const metrics = await storage.getFactionPerformanceMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching faction performance metrics:", error);
      res.status(500).json({ message: "Failed to fetch faction performance metrics" });
    }
  });

  app.get('/api/analytics/time-based/:period?', requireWalletAuth, async (req: any, res) => {
    try {
      const period = req.params.period as 'daily' | 'weekly' | 'monthly' || 'daily';
      const analytics = await storage.getTimeBasedAnalytics(period);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching time-based analytics:", error);
      res.status(500).json({ message: "Failed to fetch time-based analytics" });
    }
  });

  // Loyalty system routes
  app.get('/api/loyalty/status', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const loyaltyData = await storage.calculateLoyaltyScore(userId);
      const rewards = await storage.getLoyaltyRewards(loyaltyData.tier);
      
      res.json({
        ...loyaltyData,
        rewards,
        nextTierThreshold: getNextTierThreshold(loyaltyData.tier),
        benefits: getLoyaltyBenefits(loyaltyData.tier)
      });
    } catch (error) {
      console.error("Error fetching loyalty status:", error);
      res.status(500).json({ message: "Failed to fetch loyalty status" });
    }
  });

  app.post('/api/loyalty/update', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      await storage.updateUserLoyalty(userId);
      const loyaltyData = await storage.calculateLoyaltyScore(userId);
      
      res.json({ success: true, loyalty: loyaltyData });
    } catch (error) {
      console.error("Error updating loyalty:", error);
      res.status(500).json({ message: "Failed to update loyalty" });
    }
  });

  function getNextTierThreshold(currentTier: string): number {
    const thresholds = {
      bronze: 300,
      silver: 1000,
      gold: 2500,
      platinum: 5000,
      diamond: 10000 // Max tier
    };
    return thresholds[currentTier as keyof typeof thresholds] || 10000;
  }

  function getLoyaltyBenefits(tier: string): string[] {
    const benefits = {
      bronze: ["Basic faction rewards", "Standard challenge XP"],
      silver: ["25% reward bonus", "Access to silver challenges", "5% GAC bonus on trades"],
      gold: ["50% reward bonus", "Access to gold challenges", "15% GAC bonus on trades", "Weekly loyalty coins"],
      platinum: ["75% reward bonus", "Exclusive platinum NFTs", "30% GAC bonus on trades", "Priority support"],
      diamond: ["100% reward bonus", "Legendary loyalty NFTs", "50% GAC bonus on trades", "VIP status", "Early access to features"]
    };
    return benefits[tier as keyof typeof benefits] || benefits.bronze;
  }

  // Community Events API routes
  app.get('/api/events/active', async (req, res) => {
    try {
      const activeEvents = await storage.getActiveEvents();
      res.json(activeEvents);
    } catch (error) {
      console.error("Error fetching active events:", error);
      res.status(500).json({ message: "Failed to fetch active events" });
    }
  });

  app.get('/api/events/all', requireWalletAuth, async (req: any, res) => {
    try {
      const allEvents = await storage.getAllEvents();
      res.json(allEvents);
    } catch (error) {
      console.error("Error fetching all events:", error);
      res.status(500).json({ message: "Failed to fetch all events" });
    }
  });

  app.get('/api/events/:eventId', async (req, res) => {
    try {
      const { eventId } = req.params;
      const event = await storage.getEventById(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post('/api/events/:eventId/join', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { eventId } = req.params;
      
      const participation = await storage.joinEvent(userId, eventId);
      
      // Send notification
      await storage.createNotification({
        userId,
        type: "event_joined",
        title: "Event Joined!",
        message: "You've successfully joined the community event. Let's make some impact together!",
        data: { eventId }
      });

      res.json({ success: true, participation });
    } catch (error) {
      console.error("Error joining event:", error);
      if (error instanceof Error && error.message === "Already participating in this event") {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to join event" });
    }
  });

  app.get('/api/events/:eventId/participation', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { eventId } = req.params;
      
      const participation = await storage.getUserEventParticipation(userId, eventId);
      res.json(participation);
    } catch (error) {
      console.error("Error fetching participation:", error);
      res.status(500).json({ message: "Failed to fetch participation status" });
    }
  });

  app.post('/api/events/:eventId/progress', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { eventId } = req.params;
      const { progress, contribution } = req.body;
      
      await storage.updateEventProgress(userId, eventId, progress, contribution);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating event progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  app.get('/api/events/:eventId/leaderboard', async (req, res) => {
    try {
      const { eventId } = req.params;
      const leaderboard = await storage.getEventLeaderboard(eventId);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching event leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  app.get('/api/user/events', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const userEvents = await storage.getUserEvents(userId);
      res.json(userEvents);
    } catch (error) {
      console.error("Error fetching user events:", error);
      res.status(500).json({ message: "Failed to fetch user events" });
    }
  });

  // AI Personality Evolution API routes
  app.get('/api/ai/personality/:aiName', async (req, res) => {
    try {
      const { aiName } = req.params;
      
      if (!["grok", "ani"].includes(aiName)) {
        return res.status(400).json({ message: "Invalid AI name" });
      }
      
      const personality = await storage.getAiPersonality(aiName as "grok" | "ani");
      const insights = await storage.getAiPersonalityInsights(aiName as "grok" | "ani");
      
      res.json({
        personality,
        insights,
        evolutionStatus: personality ? `Level ${personality.evolutionLevel} - ${insights.totalInteractions} total interactions` : "Not evolved yet"
      });
    } catch (error) {
      console.error("Error fetching AI personality:", error);
      res.status(500).json({ message: "Failed to fetch AI personality data" });
    }
  });

  app.get('/api/ai/profile/:aiName', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { aiName } = req.params;
      
      if (!["grok", "ani"].includes(aiName)) {
        return res.status(400).json({ message: "Invalid AI name" });
      }
      
      const profile = await storage.getUserAiProfile(userId, aiName as "grok" | "ani");
      const interactionHistory = await storage.getUserAiInteractionHistory(userId, aiName as "grok" | "ani", 5);
      
      res.json({
        profile,
        recentInteractions: interactionHistory,
        relationshipStatus: profile?.relationshipLevel || "stranger",
        personalizedFeatures: {
          adaptedCommunication: profile?.communicationStyle || "casual",
          topTopics: Object.keys(profile?.topicInterests || {}).slice(0, 3),
          satisfaction: profile?.averageSatisfaction || 0
        }
      });
    } catch (error) {
      console.error("Error fetching user AI profile:", error);
      res.status(500).json({ message: "Failed to fetch AI relationship profile" });
    }
  });

  app.post('/api/ai/feedback', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { aiName, messageId, satisfaction } = req.body;
      
      if (!["grok", "ani"].includes(aiName) || !satisfaction || satisfaction < 1 || satisfaction > 5) {
        return res.status(400).json({ message: "Invalid feedback data" });
      }

      // Update the interaction with user satisfaction
      const { userAiInteractions } = await import("@shared/schema");
      await db
        .update(userAiInteractions)
        .set({ userSatisfaction: satisfaction })
        .where(eq(userAiInteractions.id, messageId));

      // Update user profile average satisfaction
      const profile = await storage.getUserAiProfile(userId, aiName);
      if (profile) {
        const newAverage = ((profile.averageSatisfaction * (profile.totalConversations - 1)) + satisfaction) / profile.totalConversations;
        await storage.createOrUpdateUserAiProfile({
          ...profile,
          averageSatisfaction: newAverage
        });
      }

      res.json({ success: true, message: "Feedback recorded! This helps me learn and improve." });
    } catch (error) {
      console.error("Error processing AI feedback:", error);
      res.status(500).json({ message: "Failed to record feedback" });
    }
  });

  // Guild System API routes
  app.get('/api/guilds', async (req, res) => {
    try {
      const { faction } = req.query;
      let guilds;
      
      if (faction && ["grok", "ani", "neutral"].includes(faction as string)) {
        guilds = await storage.getGuildsByFaction(faction as "grok" | "ani" | "neutral");
      } else {
        guilds = await storage.getAllGuilds();
      }
      
      res.json(guilds);
    } catch (error) {
      console.error("Error fetching guilds:", error);
      res.status(500).json({ message: "Failed to fetch guilds" });
    }
  });

  app.post('/api/guilds/create', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user is already in a guild
      const existingMembership = await storage.getUserGuildMembership(userId);
      if (existingMembership) {
        return res.status(400).json({ message: "You are already a member of a guild" });
      }

      const guildData = {
        ...req.body,
        founderId: userId,
        faction: user.faction, // Guild inherits user's faction by default
      };

      const guild = await storage.createGuild(guildData);

      // Send notification
      await storage.createNotification({
        userId,
        type: "guild_created",
        title: "Guild Founded!",
        message: `You've successfully founded "${guild.name}". Start recruiting members and setting goals!`,
        data: { guildId: guild.id }
      });

      res.json(guild);
    } catch (error) {
      console.error("Error creating guild:", error);
      res.status(500).json({ message: "Failed to create guild" });
    }
  });

  app.get('/api/guilds/:guildId', async (req, res) => {
    try {
      const { guildId } = req.params;
      const guild = await storage.getGuildById(guildId);
      
      if (!guild) {
        return res.status(404).json({ message: "Guild not found" });
      }

      const members = await storage.getGuildMembers(guildId);
      const goals = await storage.getGuildGoals(guildId);

      res.json({
        ...guild,
        members,
        goals,
        memberList: members.map(m => ({
          id: m.user.id,
          profileName: m.user.profileName,
          role: m.member.role,
          contributionScore: m.member.contributionScore,
          joinedAt: m.member.joinedAt
        }))
      });
    } catch (error) {
      console.error("Error fetching guild details:", error);
      res.status(500).json({ message: "Failed to fetch guild details" });
    }
  });

  app.post('/api/guilds/:guildId/join', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { guildId } = req.params;

      await storage.joinGuild(userId, guildId);

      // Send notification to guild founder
      const guild = await storage.getGuildById(guildId);
      const user = await storage.getUser(userId);
      
      if (guild && user) {
        await storage.createNotification({
          userId: guild.founderId,
          type: "guild_member_joined",
          title: "New Guild Member!",
          message: `${user.profileName} has joined "${guild.name}"!`,
          data: { guildId, newMemberId: userId }
        });
      }

      res.json({ success: true, message: "Successfully joined guild!" });
    } catch (error) {
      console.error("Error joining guild:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to join guild" });
    }
  });

  app.post('/api/guilds/:guildId/leave', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { guildId } = req.params;

      await storage.leaveGuild(userId, guildId);
      res.json({ success: true, message: "Successfully left guild" });
    } catch (error) {
      console.error("Error leaving guild:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to leave guild" });
    }
  });

  app.get('/api/user/guild', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const membership = await storage.getUserGuildMembership(userId);
      
      if (!membership) {
        return res.json(null);
      }

      const goals = await storage.getGuildGoals(membership.guild.id);
      const invitations = await storage.getUserGuildInvitations(userId);

      res.json({
        ...membership,
        goals,
        pendingInvitations: invitations
      });
    } catch (error) {
      console.error("Error fetching user guild membership:", error);
      res.status(500).json({ message: "Failed to fetch guild membership" });
    }
  });

  app.post('/api/guilds/:guildId/goals', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { guildId } = req.params;

      // Verify user is a member with goal-setting permissions
      const membership = await storage.getUserGuildMembership(userId);
      if (!membership || membership.guild.id !== guildId) {
        return res.status(403).json({ message: "Not a member of this guild" });
      }

      if (!["founder", "officer"].includes(membership.membership.role)) {
        return res.status(403).json({ message: "Insufficient permissions to create goals" });
      }

      const goalData = {
        ...req.body,
        guildId,
        createdById: userId
      };

      const goal = await storage.createGuildGoal(goalData);
      res.json(goal);
    } catch (error) {
      console.error("Error creating guild goal:", error);
      res.status(500).json({ message: "Failed to create guild goal" });
    }
  });

  app.get('/api/guilds/leaderboard', async (req, res) => {
    try {
      const leaderboard = await storage.getGuildLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching guild leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch guild leaderboard" });
    }
  });

  // Notification API routes
  app.get('/api/notifications', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post('/api/notifications', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const notification = await storage.createNotification({
        ...req.body,
        userId,
      });
      res.json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.patch('/api/notifications/:id/read', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { id } = req.params;
      await storage.markNotificationRead(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch('/api/notifications/mark-all-read', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      await storage.markAllNotificationsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete('/api/notifications/:id', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { id } = req.params;
      await storage.deleteNotification(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Telegram webhook endpoint
  app.post('/api/telegram/webhook', async (req, res) => {
    try {
      await telegramBot.handleWebhook(req.body);
      res.status(200).send('OK');
    } catch (error) {
      console.error('Telegram webhook error:', error);
      res.status(500).send('Error');
    }
  });

  // Initialize Telegram bot
  try {
    await telegramBot.initialize();
  } catch (error) {
    console.error('Failed to initialize Telegram bot:', error);
  }

  const httpServer = createServer(app);
  return httpServer;
}
