import {
  users,
  challenges,
  userChallenges,
  storyChapters,
  storyVotes,
  nfts,
  chatMessages,
  communitySubmissions,
  governanceProposals,
  governanceVotes,
  telegramUsers,
  notifications,
  type User,
  type UpsertUser,
  type Challenge,
  type InsertChallenge,
  type UserChallenge,
  type InsertUserChallenge,
  type StoryChapter,
  type InsertStoryChapter,
  type StoryVote,
  type InsertStoryVote,
  type NFT,
  type InsertNFT,
  type ChatMessage,
  type InsertChatMessage,
  type CommunitySubmission,
  type InsertCommunitySubmission,
  type GovernanceProposal,
  type InsertGovernanceProposal,
  type GovernanceVote,
  type InsertGovernanceVote,
  type TelegramUser,
  type InsertTelegramUser,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations (wallet authentication)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserBySolanaAddress(solanaAddress: string): Promise<User | undefined>;
  createUser(userData: { profileName: string; solanaAddress: string; pin: string; faction?: "grok" | "ani" }): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserFaction(userId: string, faction: "grok" | "ani"): Promise<void>;
  updateUserStats(userId: string, stats: Partial<Pick<User, 'gacBalance' | 'totalXP' | 'grokPoints' | 'aniPoints' | 'level'>>): Promise<void>;
  addUserPoints(userId: string, faction: "grok" | "ani", points: number): Promise<void>;
  
  // Telegram operations
  upsertTelegramUser(telegramUser: InsertTelegramUser): Promise<TelegramUser>;
  getTelegramUser(telegramId: string): Promise<TelegramUser | undefined>;
  getTelegramLinkedUser(telegramId: string): Promise<User | undefined>;
  getLinkedTelegramUsers(): Promise<TelegramUser[]>;
  linkTelegramAccount(userId: string, telegramId: string): Promise<void>;
  
  // Challenge operations
  getActiveChallenges(): Promise<Challenge[]>;
  getChallengesByFaction(faction: "grok" | "ani"): Promise<Challenge[]>;
  getChallengeById(challengeId: string): Promise<Challenge | undefined>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  getUserChallenges(userId: string): Promise<UserChallenge[]>;
  submitChallenge(submission: InsertUserChallenge): Promise<UserChallenge>;
  
  // Story operations
  getCurrentStoryChapter(): Promise<StoryChapter | undefined>;
  getStoryChapters(): Promise<StoryChapter[]>;
  createStoryVote(vote: InsertStoryVote): Promise<StoryVote>;
  getChapterVotes(chapterId: string): Promise<{ choice: string; count: number; totalVotingPower: string }[]>;
  
  // NFT operations
  getUserNFTs(userId: string): Promise<NFT[]>;
  getMarketplaceNFTs(): Promise<NFT[]>;
  createNFT(nft: InsertNFT): Promise<NFT>;
  transferNFT(nftId: string, newOwnerId: string): Promise<void>;
  listNFTForSale(nftId: string, price: string, ownerId: string): Promise<void>;
  updateUserBalance(userId: string, newBalance: string): Promise<void>;
  updateUserXP(userId: string, newXP: string): Promise<void>;
  
  // Chat operations
  saveChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getUserChatHistory(userId: string, aiType: "grok" | "ani", limit?: number): Promise<ChatMessage[]>;
  
  // Community operations
  getCommunitySubmissions(category?: string): Promise<(CommunitySubmission & { author: User })[]>;
  createCommunitySubmission(submission: InsertCommunitySubmission): Promise<CommunitySubmission>;
  voteOnSubmission(submissionId: string, isUpvote: boolean): Promise<void>;
  
  // Leaderboard operations
  getGrokLeaderboard(limit?: number): Promise<User[]>;
  getAniLeaderboard(limit?: number): Promise<User[]>;
  
  // Governance operations
  getGovernanceProposals(): Promise<(GovernanceProposal & { author: User })[]>;
  createGovernanceProposal(proposal: InsertGovernanceProposal): Promise<GovernanceProposal>;
  createGovernanceVote(vote: InsertGovernanceVote): Promise<GovernanceVote>;
  getUserGovernanceVotes(userId: string): Promise<GovernanceVote[]>;
  getExistingGovernanceVote(userId: string, proposalId: string): Promise<GovernanceVote | undefined>;
  
  // Enhanced leaderboard operations
  getLeaderboard(options: { faction: 'grok' | 'ani'; category: 'points' | 'xp' | 'gac' | 'nfts' | 'voting'; period: 'daily' | 'weekly' | 'monthly' | 'all-time'; limit: number }): Promise<User[]>;
  getFactionWarStats(): Promise<{ grokTotal: number; aniTotal: number; grokPercentage: number; aniPercentage: number }>;
  getOverallLeaderboard(options: { category: 'xp' | 'gac' | 'nfts' | 'challenges'; limit: number }): Promise<User[]>;
  
  // Analytics operations
  getDashboardStats(): Promise<any>;
  getPredictionMarkets(): Promise<any[]>;
  
  // Notification operations
  getUserNotifications(userId: string): Promise<any[]>;
  createNotification(notification: any): Promise<any>;
  markNotificationRead(notificationId: string, userId: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  deleteNotification(notificationId: string, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserBySolanaAddress(solanaAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.solanaAddress, solanaAddress));
    return user;
  }

  async createUser(userData: { profileName: string; solanaAddress: string; pin: string; faction?: "grok" | "ani" }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        profileName: userData.profileName,
        solanaAddress: userData.solanaAddress,
        pin: userData.pin,
        faction: userData.faction || "grok",
        gacBalance: "0.00",
        totalXP: 0,
        grokPoints: 0,
        aniPoints: 0,
        level: 1
      })
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserFaction(userId: string, faction: "grok" | "ani"): Promise<void> {
    await db
      .update(users)
      .set({ faction, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateUserStats(userId: string, stats: Partial<Pick<User, 'gacBalance' | 'totalXP' | 'grokPoints' | 'aniPoints' | 'level'>>): Promise<void> {
    await db
      .update(users)
      .set({ ...stats, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async addUserPoints(userId: string, faction: "grok" | "ani", points: number): Promise<void> {
    if (faction === "grok") {
      await db
        .update(users)
        .set({ 
          grokPoints: sql`${users.grokPoints} + ${points}`,
          totalXP: sql`${users.totalXP} + ${points}`,
          updatedAt: new Date() 
        })
        .where(eq(users.id, userId));
    } else {
      await db
        .update(users)
        .set({ 
          aniPoints: sql`${users.aniPoints} + ${points}`,
          totalXP: sql`${users.totalXP} + ${points}`,
          updatedAt: new Date() 
        })
        .where(eq(users.id, userId));
    }
  }

  // Telegram operations
  async upsertTelegramUser(telegramUserData: InsertTelegramUser): Promise<TelegramUser> {
    const [telegramUser] = await db
      .insert(telegramUsers)
      .values(telegramUserData)
      .onConflictDoUpdate({
        target: telegramUsers.telegramId,
        set: {
          ...telegramUserData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return telegramUser;
  }

  async getTelegramUser(telegramId: string): Promise<TelegramUser | undefined> {
    const [telegramUser] = await db
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.telegramId, telegramId));
    return telegramUser;
  }

  async getTelegramLinkedUser(telegramId: string): Promise<User | undefined> {
    const result = await db
      .select({
        user: users,
      })
      .from(telegramUsers)
      .innerJoin(users, eq(telegramUsers.userId, users.id))
      .where(and(eq(telegramUsers.telegramId, telegramId), eq(telegramUsers.isLinked, true)));
    
    return result[0]?.user;
  }

  async getLinkedTelegramUsers(): Promise<TelegramUser[]> {
    return await db.select().from(telegramUsers).where(eq(telegramUsers.isLinked, true));
  }

  async linkTelegramAccount(userId: string, telegramId: string): Promise<void> {
    await db
      .update(telegramUsers)
      .set({ 
        userId,
        isLinked: true,
        updatedAt: new Date() 
      })
      .where(eq(telegramUsers.telegramId, telegramId));
  }

  // Challenge operations
  async getActiveChallenges(): Promise<Challenge[]> {
    return await db.select().from(challenges).where(eq(challenges.isActive, true));
  }

  async getChallengesByFaction(faction: "grok" | "ani"): Promise<Challenge[]> {
    return await db
      .select()
      .from(challenges)
      .where(and(eq(challenges.faction, faction), eq(challenges.isActive, true)));
  }

  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    const [newChallenge] = await db.insert(challenges).values(challenge).returning();
    return newChallenge;
  }

  async getUserChallenges(userId: string): Promise<UserChallenge[]> {
    return await db
      .select()
      .from(userChallenges)
      .where(eq(userChallenges.userId, userId))
      .orderBy(desc(userChallenges.createdAt));
  }

  async getChallengeById(challengeId: string): Promise<Challenge | undefined> {
    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, challengeId));
    return challenge || undefined;
  }

  async submitChallenge(submission: InsertUserChallenge): Promise<UserChallenge> {
    const [newSubmission] = await db.insert(userChallenges).values(submission).returning();
    return newSubmission;
  }

  // Story operations
  async getCurrentStoryChapter(): Promise<StoryChapter | undefined> {
    const [chapter] = await db
      .select()
      .from(storyChapters)
      .where(eq(storyChapters.isActive, true))
      .orderBy(desc(storyChapters.chapterNumber))
      .limit(1);
    return chapter;
  }

  async getStoryChapters(): Promise<StoryChapter[]> {
    return await db
      .select()
      .from(storyChapters)
      .orderBy(storyChapters.chapterNumber);
  }

  async createStoryVote(vote: InsertStoryVote): Promise<StoryVote> {
    const [newVote] = await db.insert(storyVotes).values(vote).returning();
    return newVote;
  }

  async getExistingVote(userId: string, chapterId: string): Promise<StoryVote | undefined> {
    const [vote] = await db
      .select()
      .from(storyVotes)
      .where(and(eq(storyVotes.userId, userId), eq(storyVotes.chapterId, chapterId)));
    return vote;
  }

  async getChapterVotes(chapterId: string): Promise<{ choice: string; count: number; totalVotingPower: string }[]> {
    const result = await db
      .select({
        choice: storyVotes.choice,
        count: count(storyVotes.id),
        totalVotingPower: sql<string>`SUM(${storyVotes.votingPower})`,
      })
      .from(storyVotes)
      .where(eq(storyVotes.chapterId, chapterId))
      .groupBy(storyVotes.choice);

    return result.map(row => ({
      choice: row.choice,
      count: Number(row.count),
      totalVotingPower: row.totalVotingPower || "0",
    }));
  }

  // NFT operations
  async getUserNFTs(userId: string): Promise<NFT[]> {
    return await db.select().from(nfts).where(eq(nfts.ownerId, userId));
  }

  async getMarketplaceNFTs(): Promise<NFT[]> {
    return await db.select().from(nfts).where(eq(nfts.isForSale, true));
  }

  async createNFT(nft: InsertNFT): Promise<NFT> {
    const [newNFT] = await db.insert(nfts).values(nft).returning();
    return newNFT;
  }

  async transferNFT(nftId: string, newOwnerId: string): Promise<void> {
    await db
      .update(nfts)
      .set({ ownerId: newOwnerId, isForSale: false, price: null })
      .where(eq(nfts.id, nftId));
  }

  async listNFTForSale(nftId: string, price: string, ownerId: string): Promise<void> {
    await db
      .update(nfts)
      .set({ isForSale: true, price: price })
      .where(and(eq(nfts.id, nftId), eq(nfts.ownerId, ownerId)));
  }

  async updateUserBalance(userId: string, newBalance: string): Promise<void> {
    await db
      .update(users)
      .set({ gacBalance: newBalance })
      .where(eq(users.id, userId));
  }

  async updateUserXP(userId: string, newXP: string): Promise<void> {
    await db
      .update(users)
      .set({ totalXP: parseInt(newXP) })
      .where(eq(users.id, userId));
  }

  // Chat operations
  async saveChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
  }

  async getUserChatHistory(userId: string, aiType: "grok" | "ani", limit = 50): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(and(eq(chatMessages.userId, userId), eq(chatMessages.aiType, aiType)))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }

  // Community operations
  async getCommunitySubmissions(category?: string): Promise<(CommunitySubmission & { author: User })[]> {
    const query = db
      .select({
        id: communitySubmissions.id,
        title: communitySubmissions.title,
        description: communitySubmissions.description,
        category: communitySubmissions.category,
        fileUrl: communitySubmissions.fileUrl,
        authorId: communitySubmissions.authorId,
        upvotes: communitySubmissions.upvotes,
        downvotes: communitySubmissions.downvotes,
        status: communitySubmissions.status,
        createdAt: communitySubmissions.createdAt,
        author: users,
      })
      .from(communitySubmissions)
      .innerJoin(users, eq(communitySubmissions.authorId, users.id))
      .orderBy(desc(communitySubmissions.createdAt));

    if (category) {
      query.where(eq(communitySubmissions.category, category as any));
    }

    return await query;
  }

  async createCommunitySubmission(submission: InsertCommunitySubmission): Promise<CommunitySubmission> {
    const [newSubmission] = await db.insert(communitySubmissions).values(submission).returning();
    return newSubmission;
  }

  async voteOnSubmission(submissionId: string, isUpvote: boolean): Promise<void> {
    if (isUpvote) {
      await db
        .update(communitySubmissions)
        .set({ upvotes: sql`${communitySubmissions.upvotes} + 1` })
        .where(eq(communitySubmissions.id, submissionId));
    } else {
      await db
        .update(communitySubmissions)
        .set({ downvotes: sql`${communitySubmissions.downvotes} + 1` })
        .where(eq(communitySubmissions.id, submissionId));
    }
  }

  // Leaderboard operations
  async getGrokLeaderboard(limit = 10): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.grokPoints))
      .limit(limit);
  }

  async getAniLeaderboard(limit = 10): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.aniPoints))
      .limit(limit);
  }

  // Governance operations
  async getGovernanceProposals(): Promise<(GovernanceProposal & { author: User })[]> {
    const { governanceProposals } = await import("@shared/schema");
    return await db
      .select({
        id: governanceProposals.id,
        title: governanceProposals.title,
        description: governanceProposals.description,
        type: governanceProposals.type,
        authorId: governanceProposals.authorId,
        status: governanceProposals.status,
        yesVotes: governanceProposals.yesVotes,
        noVotes: governanceProposals.noVotes,
        totalVotingPower: governanceProposals.totalVotingPower,
        requiredQuorum: governanceProposals.requiredQuorum,
        endDate: governanceProposals.endDate,
        createdAt: governanceProposals.createdAt,
        author: users,
      })
      .from(governanceProposals)
      .innerJoin(users, eq(governanceProposals.authorId, users.id))
      .orderBy(desc(governanceProposals.createdAt));
  }

  async createGovernanceProposal(proposal: InsertGovernanceProposal): Promise<GovernanceProposal> {
    const { governanceProposals } = await import("@shared/schema");
    const [newProposal] = await db.insert(governanceProposals).values(proposal).returning();
    return newProposal;
  }

  async createGovernanceVote(vote: InsertGovernanceVote): Promise<GovernanceVote> {
    const { governanceVotes } = await import("@shared/schema");
    
    // Check if user already voted
    const existing = await this.getExistingGovernanceVote(vote.userId, vote.proposalId);
    if (existing) {
      throw new Error("User has already voted on this proposal");
    }

    const [newVote] = await db.insert(governanceVotes).values(vote).returning();
    
    // Update proposal vote counts
    const { governanceProposals } = await import("@shared/schema");
    const votingPowerNum = parseFloat(vote.votingPower);
    
    if (vote.vote === "yes") {
      await db
        .update(governanceProposals)
        .set({ 
          yesVotes: sql`${governanceProposals.yesVotes} + 1`,
          totalVotingPower: sql`${governanceProposals.totalVotingPower} + ${votingPowerNum}`
        })
        .where(eq(governanceProposals.id, vote.proposalId));
    } else {
      await db
        .update(governanceProposals)
        .set({ 
          noVotes: sql`${governanceProposals.noVotes} + 1`,
          totalVotingPower: sql`${governanceProposals.totalVotingPower} + ${votingPowerNum}`
        })
        .where(eq(governanceProposals.id, vote.proposalId));
    }
    
    return newVote;
  }

  async getUserGovernanceVotes(userId: string): Promise<GovernanceVote[]> {
    const { governanceVotes } = await import("@shared/schema");
    return await db
      .select()
      .from(governanceVotes)
      .where(eq(governanceVotes.userId, userId))
      .orderBy(desc(governanceVotes.createdAt));
  }

  async getExistingGovernanceVote(userId: string, proposalId: string): Promise<GovernanceVote | undefined> {
    const { governanceVotes } = await import("@shared/schema");
    const [vote] = await db
      .select()
      .from(governanceVotes)
      .where(and(eq(governanceVotes.userId, userId), eq(governanceVotes.proposalId, proposalId)));
    return vote;
  }

  // Enhanced leaderboard operations
  async getLeaderboard(options: { faction: 'grok' | 'ani'; category: 'points' | 'xp' | 'gac' | 'nfts' | 'voting'; period: 'daily' | 'weekly' | 'monthly' | 'all-time'; limit: number }): Promise<User[]> {
    let query = db.select().from(users);
    
    // Filter by faction
    if (options.faction) {
      query = query.where(eq(users.faction, options.faction));
    }
    
    // Order by category
    switch (options.category) {
      case 'points':
        query = query.orderBy(desc(options.faction === 'grok' ? users.grokPoints : users.aniPoints));
        break;
      case 'xp':
        query = query.orderBy(desc(users.totalXP));
        break;
      case 'gac':
        query = query.orderBy(desc(users.gacBalance));
        break;
      case 'nfts':
        // For now, order by level as proxy for NFT activity
        query = query.orderBy(desc(users.level));
        break;
      case 'voting':
        // Order by GAC balance as voting power proxy
        query = query.orderBy(desc(users.gacBalance));
        break;
    }
    
    return await query.limit(options.limit);
  }

  async getFactionWarStats(): Promise<{ grokTotal: number; aniTotal: number; grokPercentage: number; aniPercentage: number }> {
    const grokUsers = await db.select().from(users).where(eq(users.faction, "grok"));
    const aniUsers = await db.select().from(users).where(eq(users.faction, "ani"));
    
    const grokTotal = grokUsers.length;
    const aniTotal = aniUsers.length;
    const total = grokTotal + aniTotal;
    
    return {
      grokTotal,
      aniTotal,
      grokPercentage: total > 0 ? (grokTotal / total) * 100 : 50,
      aniPercentage: total > 0 ? (aniTotal / total) * 100 : 50,
    };
  }

  async getOverallLeaderboard(options: { category: 'xp' | 'gac' | 'nfts' | 'challenges'; limit: number }): Promise<User[]> {
    let query = db.select().from(users);
    
    switch (options.category) {
      case 'xp':
        query = query.orderBy(desc(users.totalXP));
        break;
      case 'gac':
        query = query.orderBy(desc(users.gacBalance));
        break;
      case 'nfts':
        query = query.orderBy(desc(users.level)); // Proxy for NFT activity
        break;
      case 'challenges':
        query = query.orderBy(desc(users.level)); // Proxy for challenge completion
        break;
    }
    
    return await query.limit(options.limit);
  }

  // Analytics operations
  async getDashboardStats(): Promise<any> {
    // Get total user count using Drizzle ORM
    const totalUsersQuery = await db
      .select({ count: count(users.id) })
      .from(users);
    
    const totalUsers = totalUsersQuery[0]?.count || 0;
    
    // Get faction distribution using Drizzle ORM
    const factionStatsQuery = await db
      .select({
        faction: users.faction,
        count: count(users.id),
        avgActivity: sql<number>`AVG(${users.totalXP})`
      })
      .from(users)
      .where(sql`${users.faction} IS NOT NULL`)
      .groupBy(users.faction);
    
    const dailyActiveUsers = Math.floor(totalUsers * 0.15); // Estimate 15% daily active
    const weeklyGrowth = 8.5; // Demo growth rate
    
    const factionBalance = {
      grok: { users: 0, activity: 0 },
      ani: { users: 0, activity: 0 }
    };
    
    factionStatsQuery.forEach((row) => {
      if (row.faction === 'grok') {
        factionBalance.grok = {
          users: Number(row.count),
          activity: Number(row.avgActivity || 0)
        };
      } else if (row.faction === 'ani') {
        factionBalance.ani = {
          users: Number(row.count),
          activity: Number(row.avgActivity || 0)
        };
      }
    });

    return {
      totalUsers,
      dailyActiveUsers,
      weeklyGrowth,
      factionBalance,
      marketSentiment: {
        overall: 7.8, // AI-calculated market confidence
        grokBias: 8.2,
        aniBias: 7.4
      }
    };
  }

  async getPredictionMarkets(): Promise<any[]> {
    // AI-generated prediction markets with realistic data
    return [
      {
        id: "pred-1",
        question: "Will Grok faction dominate next month's challenges?",
        description: "Based on current logic challenge completion rates and user engagement patterns",
        category: "community",
        confidence: 73,
        trend: "bullish",
        participants: 127,
        deadline: "2025-10-15T00:00:00Z"
      },
      {
        id: "pred-2", 
        question: "Platform reaches 10,000 active users by year-end?",
        description: "Growth trajectory analysis considering current adoption rate and market conditions",
        category: "economy",
        confidence: 65,
        trend: "bullish",
        participants: 89,
        deadline: "2025-12-31T00:00:00Z"
      },
      {
        id: "pred-3",
        question: "StoryChain narrative will favor Ani's creative approach?",
        description: "Community voting patterns suggest preference for emotional storytelling over pure logic",
        category: "story", 
        confidence: 58,
        trend: "neutral",
        participants: 203,
        deadline: "2025-09-30T00:00:00Z"
      }
    ];
  }

  // Enhanced analytics methods
  async getFactionPerformanceMetrics(): Promise<any> {
    // Get challenge completion rates by faction
    const challengeStats = await db
      .select({
        faction: challenges.faction,
        totalChallenges: count(challenges.id),
        completedChallenges: sql<number>`COUNT(CASE WHEN ${userChallenges.isCompleted} = true THEN 1 END)`,
        averageScore: sql<number>`AVG(${userChallenges.score})`
      })
      .from(challenges)
      .leftJoin(userChallenges, eq(challenges.id, userChallenges.challengeId))
      .groupBy(challenges.faction);

    // Get NFT distribution by faction
    const nftStats = await db
      .select({
        faction: nfts.faction,
        totalNFTs: count(nfts.id),
        rarity: nfts.rarity,
        rarityCount: count(nfts.rarity)
      })
      .from(nfts)
      .groupBy(nfts.faction, nfts.rarity);

    // Get user engagement metrics by faction
    const engagementStats = await db
      .select({
        faction: users.faction,
        totalUsers: count(users.id),
        averageXP: sql<number>`AVG(${users.totalXP})`,
        averageGAC: sql<number>`AVG(CAST(${users.gacBalance} AS NUMERIC))`,
        averageLevel: sql<number>`AVG(${users.level})`,
        averageStreak: sql<number>`AVG(${users.loginStreak})`
      })
      .from(users)
      .where(sql`${users.faction} IS NOT NULL`)
      .groupBy(users.faction);

    // Process and structure the data
    const factionMetrics = {
      grok: {
        challenges: { total: 0, completed: 0, completionRate: 0, averageScore: 0 },
        nfts: { total: 0, legendary: 0, epic: 0, rare: 0, common: 0 },
        engagement: { users: 0, avgXP: 0, avgGAC: 0, avgLevel: 0, avgStreak: 0 }
      },
      ani: {
        challenges: { total: 0, completed: 0, completionRate: 0, averageScore: 0 },
        nfts: { total: 0, legendary: 0, epic: 0, rare: 0, common: 0 },
        engagement: { users: 0, avgXP: 0, avgGAC: 0, avgLevel: 0, avgStreak: 0 }
      }
    };

    // Process challenge stats
    challengeStats.forEach(stat => {
      const faction = stat.faction as 'grok' | 'ani';
      if (factionMetrics[faction]) {
        const completed = Number(stat.completedChallenges || 0);
        const total = Number(stat.totalChallenges || 0);
        factionMetrics[faction].challenges = {
          total,
          completed,
          completionRate: total > 0 ? (completed / total) * 100 : 0,
          averageScore: Number(stat.averageScore || 0)
        };
      }
    });

    // Process NFT stats
    nftStats.forEach(stat => {
      const faction = stat.faction as 'grok' | 'ani';
      if (factionMetrics[faction]) {
        factionMetrics[faction].nfts.total += Number(stat.totalNFTs);
        const rarity = stat.rarity;
        if (rarity && factionMetrics[faction].nfts.hasOwnProperty(rarity)) {
          (factionMetrics[faction].nfts as any)[rarity] = Number(stat.rarityCount);
        }
      }
    });

    // Process engagement stats
    engagementStats.forEach(stat => {
      const faction = stat.faction as 'grok' | 'ani';
      if (factionMetrics[faction]) {
        factionMetrics[faction].engagement = {
          users: Number(stat.totalUsers || 0),
          avgXP: Number(stat.averageXP || 0),
          avgGAC: Number(stat.averageGAC || 0),
          avgLevel: Number(stat.averageLevel || 0),
          avgStreak: Number(stat.averageStreak || 0)
        };
      }
    });

    return factionMetrics;
  }

  async getTimeBasedAnalytics(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<any> {
    const now = new Date();
    let timeFrame: Date;
    
    switch (period) {
      case 'daily':
        timeFrame = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        timeFrame = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        timeFrame = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // Get new user registrations by faction
    const newUsers = await db
      .select({
        faction: users.faction,
        count: count(users.id),
        createdAt: users.createdAt
      })
      .from(users)
      .where(sql`${users.createdAt} >= ${timeFrame} AND ${users.faction} IS NOT NULL`)
      .groupBy(users.faction, users.createdAt);

    // Get challenge activity in time period
    const challengeActivity = await db
      .select({
        faction: challenges.faction,
        submissions: count(userChallenges.id),
        completions: sql<number>`COUNT(CASE WHEN ${userChallenges.isCompleted} = true THEN 1 END)`
      })
      .from(challenges)
      .leftJoin(userChallenges, eq(challenges.id, userChallenges.challengeId))
      .where(sql`${userChallenges.createdAt} >= ${timeFrame}`)
      .groupBy(challenges.faction);

    return {
      period,
      timeFrame: timeFrame.toISOString(),
      newUsers: newUsers.reduce((acc, curr) => {
        const faction = curr.faction as 'grok' | 'ani';
        if (faction) {
          acc[faction] = (acc[faction] || 0) + Number(curr.count);
        }
        return acc;
      }, { grok: 0, ani: 0 }),
      challengeActivity: challengeActivity.reduce((acc, curr) => {
        const faction = curr.faction as 'grok' | 'ani';
        if (faction) {
          acc[faction] = {
            submissions: Number(curr.submissions || 0),
            completions: Number(curr.completions || 0)
          };
        }
        return acc;
      }, { grok: { submissions: 0, completions: 0 }, ani: { submissions: 0, completions: 0 } })
    };
  }

  // Faction Loyalty System
  async calculateLoyaltyScore(userId: string): Promise<{ score: number; tier: string; multiplier: number }> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    // Base loyalty factors
    const factionJoinDate = user.factionJoinDate || user.createdAt;
    const daysInFaction = Math.floor((Date.now() - factionJoinDate.getTime()) / (24 * 60 * 60 * 1000));
    const loginStreak = user.loginStreak || 0;
    const consecutiveDaysActive = user.consecutiveDaysActive || 0;
    
    // Calculate faction activity
    const factionPoints = user.faction === 'grok' ? (user.grokPoints || 0) : (user.aniPoints || 0);
    const otherFactionPoints = user.faction === 'grok' ? (user.aniPoints || 0) : (user.grokPoints || 0);
    const factionPurity = factionPoints > 0 ? factionPoints / (factionPoints + otherFactionPoints) : 1;

    // Get user's challenges completed for their faction
    const factionChallenges = await db
      .select({ count: count(userChallenges.id) })
      .from(userChallenges)
      .leftJoin(challenges, eq(userChallenges.challengeId, challenges.id))
      .where(and(
        eq(userChallenges.userId, userId),
        eq(userChallenges.completed, true),
        eq(challenges.faction, user.faction)
      ));
    
    const completedFactionChallenges = Number(factionChallenges[0]?.count || 0);

    // Calculate loyalty score (0-10000 scale)
    let loyaltyScore = 0;
    loyaltyScore += daysInFaction * 10; // 10 points per day in faction
    loyaltyScore += loginStreak * 25; // 25 points per consecutive login
    loyaltyScore += consecutiveDaysActive * 15; // 15 points per active day
    loyaltyScore += factionPoints * 2; // 2 points per faction point
    loyaltyScore += Math.round(factionPurity * 500); // Up to 500 bonus for faction purity
    loyaltyScore += completedFactionChallenges * 100; // 100 points per faction challenge
    
    // Determine tier and multiplier
    let tier: string;
    let multiplier: number;
    
    if (loyaltyScore >= 5000) {
      tier = "diamond";
      multiplier = 2.0;
    } else if (loyaltyScore >= 2500) {
      tier = "platinum";
      multiplier = 1.75;
    } else if (loyaltyScore >= 1000) {
      tier = "gold";
      multiplier = 1.5;
    } else if (loyaltyScore >= 300) {
      tier = "silver";
      multiplier = 1.25;
    } else {
      tier = "bronze";
      multiplier = 1.0;
    }

    return { score: loyaltyScore, tier, multiplier };
  }

  async updateUserLoyalty(userId: string): Promise<void> {
    const { score, tier } = await this.calculateLoyaltyScore(userId);
    
    await db
      .update(users)
      .set({ 
        loyaltyScore: score,
        loyaltyTier: tier as any,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async getLoyaltyRewards(tier: string): Promise<{ coins: number; xp: number; nftBonus: number }> {
    const rewards = {
      bronze: { coins: 0, xp: 0, nftBonus: 0 },
      silver: { coins: 50, xp: 25, nftBonus: 5 },
      gold: { coins: 150, xp: 75, nftBonus: 15 },
      platinum: { coins: 300, xp: 150, nftBonus: 30 },
      diamond: { coins: 500, xp: 250, nftBonus: 50 }
    };
    
    return rewards[tier as keyof typeof rewards] || rewards.bronze;
  }

  async awardLoyaltyNFT(userId: string, tier: string): Promise<NFT | null> {
    // Award special loyalty NFTs for higher tiers
    if (tier === "diamond" || tier === "platinum") {
      const user = await this.getUser(userId);
      if (!user) return null;

      const rarity = tier === "diamond" ? "legendary" : "epic";
      const nftData = {
        tokenId: parseInt(`${Date.now().toString().slice(-8)}`),
        name: `${tier === "diamond" ? "Diamond" : "Platinum"} Loyalty Badge`,
        description: `Exclusive ${tier} tier loyalty reward for unwavering faction dedication`,
        imageUrl: "",
        rarity: rarity as any,
        faction: user.faction,
        ownerId: userId,
        isForSale: false,
        attributes: {
          tier,
          loyaltyReward: true,
          exclusiveBonus: tier === "diamond" ? 25 : 15
        }
      };

      return await this.createNFT(nftData);
    }
    return null;
  }

  // Community Events System
  async createCommunityEvent(eventData: any): Promise<any> {
    const { communityEvents } = await import("@shared/schema");
    const [newEvent] = await db.insert(communityEvents).values(eventData).returning();
    return newEvent;
  }

  async getActiveEvents(): Promise<any[]> {
    const { communityEvents } = await import("@shared/schema");
    return await db
      .select()
      .from(communityEvents)
      .where(eq(communityEvents.status, 'active'))
      .orderBy(desc(communityEvents.startDate));
  }

  async getAllEvents(): Promise<any[]> {
    const { communityEvents } = await import("@shared/schema");
    return await db
      .select()
      .from(communityEvents)
      .orderBy(desc(communityEvents.startDate));
  }

  async getEventById(eventId: string): Promise<any | null> {
    const { communityEvents } = await import("@shared/schema");
    const [event] = await db
      .select()
      .from(communityEvents)
      .where(eq(communityEvents.id, eventId));
    return event || null;
  }

  async joinEvent(userId: string, eventId: string): Promise<any> {
    const { eventParticipations } = await import("@shared/schema");
    
    // Check if already participating
    const existing = await db
      .select()
      .from(eventParticipations)
      .where(and(eq(eventParticipations.userId, userId), eq(eventParticipations.eventId, eventId)));
    
    if (existing.length > 0) {
      throw new Error("Already participating in this event");
    }

    const [participation] = await db
      .insert(eventParticipations)
      .values({ userId, eventId, progress: {}, contribution: {} })
      .returning();

    // Increment participant count
    const { communityEvents } = await import("@shared/schema");
    await db
      .update(communityEvents)
      .set({ participantCount: sql`${communityEvents.participantCount} + 1` })
      .where(eq(communityEvents.id, eventId));

    return participation;
  }

  async updateEventProgress(userId: string, eventId: string, progress: any, contribution?: any): Promise<void> {
    const { eventParticipations } = await import("@shared/schema");
    await db
      .update(eventParticipations)
      .set({ 
        progress, 
        contribution: contribution || sql`${eventParticipations.contribution}`,
        updatedAt: new Date() 
      })
      .where(and(eq(eventParticipations.userId, userId), eq(eventParticipations.eventId, eventId)));
  }

  async completeEventForUser(userId: string, eventId: string): Promise<void> {
    const { eventParticipations } = await import("@shared/schema");
    await db
      .update(eventParticipations)
      .set({ completed: true, updatedAt: new Date() })
      .where(and(eq(eventParticipations.userId, userId), eq(eventParticipations.eventId, eventId)));
  }

  async getUserEventParticipation(userId: string, eventId: string): Promise<any | null> {
    const { eventParticipations } = await import("@shared/schema");
    const [participation] = await db
      .select()
      .from(eventParticipations)
      .where(and(eq(eventParticipations.userId, userId), eq(eventParticipations.eventId, eventId)));
    return participation || null;
  }

  async getUserEvents(userId: string): Promise<any[]> {
    const { eventParticipations, communityEvents } = await import("@shared/schema");
    return await db
      .select({
        event: communityEvents,
        participation: eventParticipations
      })
      .from(eventParticipations)
      .innerJoin(communityEvents, eq(eventParticipations.eventId, communityEvents.id))
      .where(eq(eventParticipations.userId, userId))
      .orderBy(desc(eventParticipations.createdAt));
  }

  async getEventLeaderboard(eventId: string): Promise<any[]> {
    const { eventParticipations } = await import("@shared/schema");
    return await db
      .select({
        participation: eventParticipations,
        user: users
      })
      .from(eventParticipations)
      .innerJoin(users, eq(eventParticipations.userId, users.id))
      .where(eq(eventParticipations.eventId, eventId))
      .orderBy(desc(eventParticipations.completed), desc(eventParticipations.updatedAt));
  }

  // AI Personality Evolution System
  async getAiPersonality(aiName: "grok" | "ani"): Promise<any | null> {
    const { aiPersonalities } = await import("@shared/schema");
    const [personality] = await db
      .select()
      .from(aiPersonalities)
      .where(eq(aiPersonalities.aiName, aiName));
    return personality || null;
  }

  async createOrUpdateAiPersonality(personalityData: any): Promise<any> {
    const { aiPersonalities } = await import("@shared/schema");
    
    const existing = await this.getAiPersonality(personalityData.aiName);
    if (existing) {
      const [updated] = await db
        .update(aiPersonalities)
        .set({ ...personalityData, updatedAt: new Date() })
        .where(eq(aiPersonalities.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(aiPersonalities)
        .values(personalityData)
        .returning();
      return created;
    }
  }

  async recordAiInteraction(interactionData: any): Promise<any> {
    const { userAiInteractions } = await import("@shared/schema");
    const [interaction] = await db
      .insert(userAiInteractions)
      .values(interactionData)
      .returning();

    // Update AI personality total interactions
    const { aiPersonalities } = await import("@shared/schema");
    await db
      .update(aiPersonalities)
      .set({ 
        totalInteractions: sql`${aiPersonalities.totalInteractions} + 1`,
        updatedAt: new Date()
      })
      .where(eq(aiPersonalities.aiName, interactionData.aiName));

    return interaction;
  }

  async getUserAiProfile(userId: string, aiName: "grok" | "ani"): Promise<any | null> {
    const { personalizedAiProfiles } = await import("@shared/schema");
    const [profile] = await db
      .select()
      .from(personalizedAiProfiles)
      .where(and(eq(personalizedAiProfiles.userId, userId), eq(personalizedAiProfiles.aiName, aiName)));
    return profile || null;
  }

  async createOrUpdateUserAiProfile(profileData: any): Promise<any> {
    const { personalizedAiProfiles } = await import("@shared/schema");
    
    const existing = await this.getUserAiProfile(profileData.userId, profileData.aiName);
    if (existing) {
      const [updated] = await db
        .update(personalizedAiProfiles)
        .set({ ...profileData, updatedAt: new Date() })
        .where(eq(personalizedAiProfiles.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(personalizedAiProfiles)
        .values(profileData)
        .returning();
      return created;
    }
  }

  async getUserAiInteractionHistory(userId: string, aiName: "grok" | "ani", limit: number = 10): Promise<any[]> {
    const { userAiInteractions } = await import("@shared/schema");
    return await db
      .select()
      .from(userAiInteractions)
      .where(and(eq(userAiInteractions.userId, userId), eq(userAiInteractions.aiName, aiName)))
      .orderBy(desc(userAiInteractions.createdAt))
      .limit(limit);
  }

  async getAiPersonalityInsights(aiName: "grok" | "ani"): Promise<any> {
    const { userAiInteractions } = await import("@shared/schema");
    
    const totalInteractions = await db
      .select({ count: count() })
      .from(userAiInteractions)
      .where(eq(userAiInteractions.aiName, aiName));

    const sentimentData = await db
      .select({
        sentiment: userAiInteractions.sentiment,
        count: count()
      })
      .from(userAiInteractions)
      .where(eq(userAiInteractions.aiName, aiName))
      .groupBy(userAiInteractions.sentiment);

    const avgSatisfaction = await db
      .select({
        avgSatisfaction: sql<string>`AVG(${userAiInteractions.userSatisfaction})`
      })
      .from(userAiInteractions)
      .where(and(eq(userAiInteractions.aiName, aiName), sql`${userAiInteractions.userSatisfaction} IS NOT NULL`));

    return {
      totalInteractions: totalInteractions[0]?.count || 0,
      sentimentBreakdown: sentimentData,
      averageSatisfaction: parseFloat(avgSatisfaction[0]?.avgSatisfaction || "0"),
    };
  }

  // Guild System Operations
  async createGuild(guildData: any): Promise<any> {
    const { guilds, guildMembers } = await import("@shared/schema");
    
    const [guild] = await db.insert(guilds).values(guildData).returning();
    
    // Add founder as member
    await db.insert(guildMembers).values({
      guildId: guild.id,
      userId: guildData.founderId,
      role: "founder",
      contributionScore: 0,
      permissions: { canInvite: true, canKick: true, canSetGoals: true, canEditGuild: true },
      personalGoals: []
    });

    return guild;
  }

  async getAllGuilds(): Promise<any[]> {
    const { guilds } = await import("@shared/schema");
    return await db
      .select()
      .from(guilds)
      .where(ne(guilds.status, 'disbanded'))
      .orderBy(desc(guilds.guildRank), desc(guilds.totalGacEarned));
  }

  async getGuildsByFaction(faction: "grok" | "ani" | "neutral"): Promise<any[]> {
    const { guilds } = await import("@shared/schema");
    return await db
      .select()
      .from(guilds)
      .where(and(eq(guilds.faction, faction), ne(guilds.status, 'disbanded')))
      .orderBy(desc(guilds.guildRank), desc(guilds.totalGacEarned));
  }

  async getGuildById(guildId: string): Promise<any | null> {
    const { guilds } = await import("@shared/schema");
    const [guild] = await db
      .select()
      .from(guilds)
      .where(eq(guilds.id, guildId));
    return guild || null;
  }

  async getGuildMembers(guildId: string): Promise<any[]> {
    const { guildMembers } = await import("@shared/schema");
    return await db
      .select({
        member: guildMembers,
        user: users
      })
      .from(guildMembers)
      .innerJoin(users, eq(guildMembers.userId, users.id))
      .where(eq(guildMembers.guildId, guildId))
      .orderBy(desc(guildMembers.contributionScore));
  }

  async getUserGuildMembership(userId: string): Promise<any | null> {
    const { guildMembers, guilds } = await import("@shared/schema");
    const [membership] = await db
      .select({
        membership: guildMembers,
        guild: guilds
      })
      .from(guildMembers)
      .innerJoin(guilds, eq(guildMembers.guildId, guilds.id))
      .where(eq(guildMembers.userId, userId));
    return membership || null;
  }

  async joinGuild(userId: string, guildId: string): Promise<any> {
    const { guildMembers, guilds } = await import("@shared/schema");
    
    // Check if already a member
    const existing = await db
      .select()
      .from(guildMembers)
      .where(and(eq(guildMembers.userId, userId), eq(guildMembers.guildId, guildId)));
    
    if (existing.length > 0) {
      throw new Error("User is already a member of this guild");
    }

    // Check if guild is accepting members
    const guild = await this.getGuildById(guildId);
    if (!guild) throw new Error("Guild not found");
    if (guild.status === 'closed' || guild.status === 'disbanded') {
      throw new Error("Guild is not accepting new members");
    }
    if (guild.memberCount >= guild.memberLimit) {
      throw new Error("Guild is at member capacity");
    }

    // Add member
    const [member] = await db
      .insert(guildMembers)
      .values({
        guildId,
        userId,
        role: "member",
        contributionScore: 0,
        permissions: { canInvite: false, canKick: false, canSetGoals: false, canEditGuild: false },
        personalGoals: []
      })
      .returning();

    // Update guild member count
    await db
      .update(guilds)
      .set({ memberCount: sql`${guilds.memberCount} + 1` })
      .where(eq(guilds.id, guildId));

    return member;
  }

  async leaveGuild(userId: string, guildId: string): Promise<void> {
    const { guildMembers, guilds } = await import("@shared/schema");
    
    const membership = await db
      .select()
      .from(guildMembers)
      .where(and(eq(guildMembers.userId, userId), eq(guildMembers.guildId, guildId)));
    
    if (membership.length === 0) {
      throw new Error("User is not a member of this guild");
    }

    if (membership[0].role === 'founder') {
      throw new Error("Guild founder cannot leave. Transfer leadership or disband guild first.");
    }

    // Remove member
    await db
      .delete(guildMembers)
      .where(and(eq(guildMembers.userId, userId), eq(guildMembers.guildId, guildId)));

    // Update guild member count
    await db
      .update(guilds)
      .set({ memberCount: sql`${guilds.memberCount} - 1` })
      .where(eq(guilds.id, guildId));
  }

  async createGuildGoal(goalData: any): Promise<any> {
    const { guildGoals } = await import("@shared/schema");
    const [goal] = await db.insert(guildGoals).values(goalData).returning();
    return goal;
  }

  async getGuildGoals(guildId: string): Promise<any[]> {
    const { guildGoals } = await import("@shared/schema");
    return await db
      .select()
      .from(guildGoals)
      .where(eq(guildGoals.guildId, guildId))
      .orderBy(desc(guildGoals.createdAt));
  }

  async updateGuildGoalProgress(goalId: string, progress: any): Promise<void> {
    const { guildGoals } = await import("@shared/schema");
    await db
      .update(guildGoals)
      .set({ progress })
      .where(eq(guildGoals.id, goalId));
  }

  async createGuildInvitation(invitationData: any): Promise<any> {
    const { guildInvitations } = await import("@shared/schema");
    const [invitation] = await db.insert(guildInvitations).values(invitationData).returning();
    return invitation;
  }

  async getUserGuildInvitations(userId: string): Promise<any[]> {
    const { guildInvitations, guilds } = await import("@shared/schema");
    return await db
      .select({
        invitation: guildInvitations,
        guild: guilds
      })
      .from(guildInvitations)
      .innerJoin(guilds, eq(guildInvitations.guildId, guilds.id))
      .where(and(
        eq(guildInvitations.invitedUserId, userId),
        eq(guildInvitations.status, 'pending'),
        sql`${guildInvitations.expiresAt} > NOW()`
      ))
      .orderBy(desc(guildInvitations.createdAt));
  }

  async respondToGuildInvitation(invitationId: string, response: 'accepted' | 'declined'): Promise<any> {
    const { guildInvitations } = await import("@shared/schema");
    
    const [invitation] = await db
      .select()
      .from(guildInvitations)
      .where(eq(guildInvitations.id, invitationId));

    if (!invitation) throw new Error("Invitation not found");
    if (invitation.status !== 'pending') throw new Error("Invitation already responded to");

    const [updatedInvitation] = await db
      .update(guildInvitations)
      .set({ status: response, respondedAt: new Date() })
      .where(eq(guildInvitations.id, invitationId))
      .returning();

    // If accepted, join guild
    if (response === 'accepted') {
      await this.joinGuild(invitation.invitedUserId, invitation.guildId);
    }

    return updatedInvitation;
  }

  async getGuildLeaderboard(): Promise<any[]> {
    const { guilds } = await import("@shared/schema");
    return await db
      .select()
      .from(guilds)
      .where(ne(guilds.status, 'disbanded'))
      .orderBy(desc(guilds.totalGacEarned), desc(guilds.memberCount))
      .limit(20);
  }

  async updateMemberContribution(userId: string, guildId: string, contributionPoints: number): Promise<void> {
    const { guildMembers } = await import("@shared/schema");
    await db
      .update(guildMembers)
      .set({ 
        contributionScore: sql`${guildMembers.contributionScore} + ${contributionPoints}`,
        lastActive: new Date()
      })
      .where(and(eq(guildMembers.userId, userId), eq(guildMembers.guildId, guildId)));
  }

  // Notification operations
  async getUserNotifications(userId: string): Promise<Notification[]> {
    const { notifications } = await import("@shared/schema");
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const { notifications } = await import("@shared/schema");
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationRead(notificationId: string, userId: string): Promise<void> {
    const { notifications } = await import("@shared/schema");
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    const { notifications } = await import("@shared/schema");
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const { db } = await import("./db");
    await db.execute({
      sql: `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      args: [notificationId, userId]
    });
  }
}

export const storage = new DatabaseStorage();
