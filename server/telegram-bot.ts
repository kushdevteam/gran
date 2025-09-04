import TelegramBot from 'node-telegram-bot-api';
import { storage } from './storage';
import { getChatResponse } from './openai';
import { getDailyRewardStatus } from './daily-rewards';

interface TelegramUserData {
  telegramId: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  isLinked: boolean;
}

class GrokAniTelegramBot {
  private bot: TelegramBot | null = null;
  private isInitialized = false;

  async initialize() {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.log('Telegram bot token not found. Bot features disabled.');
      return;
    }

    try {
      this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
      await this.setupCommands();
      await this.setupWebhook();
      this.isInitialized = true;
      console.log('✅ Telegram bot initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Telegram bot:', error);
    }
  }

  private async setupCommands() {
    if (!this.bot) return;

    // Set bot commands for Telegram UI
    await this.bot.setMyCommands([
      { command: 'start', description: 'Start using the bot and link your account' },
      { command: 'link', description: 'Link your Telegram to platform account' },
      { command: 'grok', description: 'Chat with Grok (logic AI)' },
      { command: 'ani', description: 'Chat with Ani (emotion AI)' },
      { command: 'stats', description: 'View your platform stats' },
      { command: 'challenges', description: 'See available challenges' },
      { command: 'leaderboard', description: 'View faction rankings' },
      { command: 'help', description: 'Show all available commands' },
    ]);
  }

  private async setupWebhook() {
    if (!this.bot || !process.env.REPLIT_DOMAINS) return;

    const domain = process.env.REPLIT_DOMAINS.split(',')[0];
    const webhookUrl = `https://${domain}/api/telegram/webhook`;
    
    try {
      await this.bot.setWebHook(webhookUrl);
      console.log(`📡 Telegram webhook set to: ${webhookUrl}`);
    } catch (error) {
      console.error('Failed to set webhook:', error);
    }
  }

  async handleWebhook(body: any) {
    if (!this.bot || !this.isInitialized) return;

    try {
      await this.processUpdate(body);
    } catch (error) {
      console.error('Error processing Telegram update:', error);
    }
  }

  private async processUpdate(update: any) {
    if (!this.bot) return;

    // Handle callback queries (button presses)
    if (update.callback_query) {
      await this.handleCallbackQuery(update.callback_query);
      return;
    }

    const message = update.message;
    if (!message) return;

    const chatId = message.chat.id;
    const text = message.text;
    const user = message.from;

    // Store or update telegram user data
    await this.saveTelegramUser({
      telegramId: user.id.toString(),
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      isLinked: false
    });

    // Handle commands
    if (text?.startsWith('/')) {
      await this.handleCommand(chatId, text, user);
    } else {
      // Check if user is waiting for PIN input during registration
      if (this.waitingForPin?.has(chatId)) {
        const registrationData = this.waitingForPin.get(chatId);
        await this.handlePinInput(chatId, text, registrationData);
      } 
      // Check if user is waiting for username input during registration
      else if (this.waitingForUsername?.has(chatId)) {
        const registrationData = this.waitingForUsername.get(chatId);
        await this.handleUsernameInput(chatId, text, registrationData);
      } else {
        // Handle regular messages as AI chat
        await this.handleAIChat(chatId, text, user);
      }
    }
  }

  private async handleCommand(chatId: number, command: string, user: any) {
    if (!this.bot) return;

    const cmd = command.split(' ')[0].toLowerCase();
    const args = command.split(' ').slice(1).join(' ');

    switch (cmd) {
      case '/start':
        await this.handleStartCommand(chatId, user);
        break;
      case '/link':
        await this.handleLinkCommand(chatId, args, user);
        break;
      case '/grok':
        await this.handleGrokCommand(chatId, args, user);
        break;
      case '/ani':
        await this.handleAniCommand(chatId, args, user);
        break;
      case '/stats':
        await this.handleStatsCommand(chatId, user);
        break;
      case '/challenges':
        await this.handleChallengesCommand(chatId, user);
        break;
      case '/leaderboard':
        await this.handleLeaderboardCommand(chatId, user);
        break;
      case '/help':
        await this.handleHelpCommand(chatId);
        break;
      default:
        await this.sendMessage(chatId, 'Unknown command. Type /help to see available commands.');
    }
  }

  private async handleStartCommand(chatId: number, user: any) {
    const welcomeMessage = `🌟 *Welcome to Grok & Ani Bot!* 🌟

🤖 *Your Gateway to the Conscious Coin Ecosystem*

━━━━━━━━━━━━━━━━━━━━━

✨ *What You Can Do Here:*

🧠 *Chat with Grok* - Logic & Analysis AI
❤️ *Chat with Ani* - Emotion & Creativity AI
📊 *View Your Stats* - Track your progress
🎯 *Take Challenges* - Earn rewards
🏆 *Check Leaderboards* - See faction rankings

━━━━━━━━━━━━━━━━━━━━━

🚀 *Get started by linking your account!*

Use the buttons below for quick actions:`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔗 Link Account', callback_data: 'show_link_instructions' },
          { text: '📊 My Stats', callback_data: 'check_stats' }
        ],
        [
          { text: '🧠 Chat with Grok', callback_data: 'start_grok_chat' },
          { text: '❤️ Chat with Ani', callback_data: 'start_ani_chat' }
        ],
        [
          { text: '🎯 Challenges', callback_data: 'view_challenges' },
          { text: '🏆 Leaderboard', callback_data: 'view_leaderboard' }
        ],
        [
          { text: '🌐 Open Web App', callback_data: 'open_web_app' },
          { text: '❓ Help & Commands', callback_data: 'show_help' }
        ]
      ]
    };

    await this.sendMessageWithKeyboard(chatId, welcomeMessage, keyboard);
  }

  private async handleLinkCommand(chatId: number, solanaAddress: string, user: any) {
    if (!solanaAddress) {
      await this.sendMessage(chatId, 'Please provide your Solana address: /link [your-solana-address]');
      return;
    }

    try {
      // Find user by Solana address
      const platformUser = await storage.getUserBySolanaAddress(solanaAddress.trim());
      if (!platformUser) {
        // No account found - offer registration
        const registerKeyboard = {
          inline_keyboard: [
            [
              { text: '📝 Register New Account', callback_data: `register_start:${solanaAddress.trim()}` }
            ],
            [
              { text: '❌ Cancel', callback_data: 'cancel_registration' }
            ]
          ]
        };

        await this.sendMessageWithKeyboard(chatId, 
          `❌ No account found with Solana address: ${solanaAddress}

Would you like to create a new account? Registration requires:
• Your Solana address
• A 4-digit PIN for security
• Choosing your faction (Grok or Ani)

Click below to start registration:`, registerKeyboard);
        return;
      }

      // Link telegram account
      await storage.linkTelegramAccount(platformUser.id, user.id.toString());
      
      await this.sendMessage(chatId, `✅ Account linked successfully!
      
👤 Welcome ${platformUser.firstName || 'User'}!
🎯 Faction: ${platformUser.faction || 'Not selected'}
⭐ Level: ${platformUser.level || 1}
💰 GAC Balance: ${platformUser.gacBalance || 0}

You can now use all bot features!`);

    } catch (error) {
      console.error('Link error:', error);
      await this.sendMessage(chatId, '❌ Failed to link account. Please try again later.');
    }
  }

  private async handleGrokCommand(chatId: number, message: string, user: any) {
    if (!message) {
      await this.sendMessage(chatId, '🧠 Ask Grok something: /grok What is the meaning of logic?');
      return;
    }

    try {
      await this.sendMessage(chatId, '🧠 Grok is thinking...');
      
      const response = await getChatResponse(message, 'grok');
      await this.sendMessage(chatId, `🧠 **Grok:** ${response}`);
      
      // Award points for AI interaction
      await this.awardInteractionPoints(user.id.toString(), 'grok');
      
    } catch (error) {
      console.error('Grok chat error:', error);
      await this.sendMessage(chatId, '❌ Sorry, Grok is currently unavailable. Please try again later.');
    }
  }

  private async handleAniCommand(chatId: number, message: string, user: any) {
    if (!message) {
      await this.sendMessage(chatId, '❤️ Share something with Ani: /ani How do you feel about creativity?');
      return;
    }

    try {
      await this.sendMessage(chatId, '❤️ Ani is feeling...');
      
      const response = await getChatResponse(message, 'ani');
      await this.sendMessage(chatId, `❤️ **Ani:** ${response}`);
      
      // Award points for AI interaction
      await this.awardInteractionPoints(user.id.toString(), 'ani');
      
    } catch (error) {
      console.error('Ani chat error:', error);
      await this.sendMessage(chatId, '❌ Sorry, Ani is currently unavailable. Please try again later.');
    }
  }

  private async handleStatsCommand(chatId: number, user: any) {
    try {
      const linkedUser = await storage.getTelegramLinkedUser(user.id.toString());
      if (!linkedUser) {
        await this.sendMessage(chatId, '❌ Please link your account first with /link [solana-address]');
        return;
      }

      const stats = `📊 **Your Stats**

👤 Name: ${linkedUser.firstName || 'User'}
🎯 Faction: ${linkedUser.faction || 'Not selected'}
⭐ Level: ${linkedUser.level || 1}
💰 GAC Balance: ${linkedUser.gacBalance || 0}
🧠 Grok Points: ${linkedUser.grokPoints || 0}
❤️ Ani Points: ${linkedUser.aniPoints || 0}
🏆 Total XP: ${linkedUser.totalXP || 0}`;

      await this.sendMessage(chatId, stats);
      
    } catch (error) {
      console.error('Stats error:', error);
      await this.sendMessage(chatId, '❌ Failed to fetch stats. Please try again later.');
    }
  }

  private async handleChallengesCommand(chatId: number, user: any) {
    try {
      const challenges = await storage.getActiveChallenges();
      
      if (challenges.length === 0) {
        await this.sendMessage(chatId, '🎯 No active challenges at the moment. Check back later!');
        return;
      }

      let message = '🎯 **Active Challenges**\n\n';
      challenges.slice(0, 5).forEach((challenge: any, index: number) => {
        message += `${index + 1}. **${challenge.title}**\n`;
        message += `   ${challenge.faction === 'grok' ? '🧠' : '❤️'} ${challenge.faction.toUpperCase()} faction\n`;
        message += `   🏆 Reward: ${challenge.rewardAmount} ${challenge.rewardType}\n\n`;
      });

      message += '💻 Visit the platform to participate in challenges!';
      await this.sendMessage(chatId, message);
      
    } catch (error) {
      console.error('Challenges error:', error);
      await this.sendMessage(chatId, '❌ Failed to fetch challenges. Please try again later.');
    }
  }

  private async handleLeaderboardCommand(chatId: number, user: any) {
    try {
      const grokLeaders = await storage.getLeaderboard({ 
        faction: 'grok', 
        category: 'points', 
        period: 'all-time', 
        limit: 3 
      });
      
      const aniLeaders = await storage.getLeaderboard({ 
        faction: 'ani', 
        category: 'points', 
        period: 'all-time', 
        limit: 3 
      });

      let message = '🏆 **Faction Leaderboards**\n\n';
      
      message += '🧠 **Grok Leaders:**\n';
      grokLeaders.forEach((user: any, index: number) => {
        message += `${index + 1}. ${user.firstName || 'Unknown'} - ${user.grokPoints || 0} pts\n`;
      });
      
      message += '\n❤️ **Ani Leaders:**\n';
      aniLeaders.forEach((user: any, index: number) => {
        message += `${index + 1}. ${user.firstName || 'Unknown'} - ${user.aniPoints || 0} pts\n`;
      });

      await this.sendMessage(chatId, message);
      
    } catch (error) {
      console.error('Leaderboard error:', error);
      await this.sendMessage(chatId, '❌ Failed to fetch leaderboard. Please try again later.');
    }
  }

  private async handleHelpCommand(chatId: number) {
    const helpMessage = `❓ *Bot Commands & Help*

━━━━━━━━━━━━━━━━━━━━━

🔧 *Account Commands:*
• \`/start\` - Welcome & main menu
• \`/link [address]\` - Link your wallet

🤖 *AI Chat Commands:*
• \`/grok [message]\` - Chat with Grok (Logic AI)
• \`/ani [message]\` - Chat with Ani (Emotion AI)

📊 *Platform Commands:*
• \`/stats\` - View your account stats
• \`/challenges\` - See active challenges
• \`/leaderboard\` - View faction rankings
• \`/help\` - Show this help message

━━━━━━━━━━━━━━━━━━━━━

💡 *Pro Tips:*
✅ Link your account to unlock all features
🎯 Chat with AIs to earn faction points
🏆 Complete challenges for bigger rewards
💎 Visit the platform for full functionality

━━━━━━━━━━━━━━━━━━━━━

🚀 *Ready to start your journey?*`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔗 Link Account', callback_data: 'show_link_instructions' },
          { text: '📊 My Stats', callback_data: 'check_stats' }
        ],
        [
          { text: '🧠 Chat Grok', callback_data: 'start_grok_chat' },
          { text: '❤️ Chat Ani', callback_data: 'start_ani_chat' }
        ],
        [
          { text: '🌐 Open Web App', callback_data: 'open_web_app' }
        ]
      ]
    };

    await this.sendMessageWithKeyboard(chatId, helpMessage, keyboard);
  }

  private async handleAIChat(chatId: number, message: string, user: any) {
    if (!message || message.length < 3) return;

    // Default to last used AI or Grok
    await this.sendMessage(chatId, `💭 Chatting with Grok... (Use /grok or /ani for specific AIs)`);
    
    try {
      const response = await getChatResponse(message, 'grok');
      await this.sendMessage(chatId, `🧠 **Grok:** ${response}`);
      await this.awardInteractionPoints(user.id.toString(), 'grok');
    } catch (error) {
      await this.sendMessage(chatId, '❌ Sorry, I couldn\'t process that. Try using /grok [message] or /ani [message]');
    }
  }

  private async awardInteractionPoints(telegramId: string, aiType: 'grok' | 'ani') {
    try {
      const linkedUser = await storage.getTelegramLinkedUser(telegramId);
      if (linkedUser) {
        await storage.addUserPoints(linkedUser.id, aiType, 5); // 5 points per interaction
      }
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  }

  private async saveTelegramUser(userData: TelegramUserData) {
    try {
      await storage.upsertTelegramUser(userData);
    } catch (error) {
      console.error('Error saving telegram user:', error);
    }
  }

  async sendMessage(chatId: number, text: string) {
    if (!this.bot) return;
    
    try {
      await this.bot.sendMessage(chatId, text, { 
        parse_mode: 'Markdown',
        disable_web_page_preview: true 
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  async sendMessageWithKeyboard(chatId: number, text: string, keyboard: any) {
    if (!this.bot) return;
    
    try {
      await this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
        disable_web_page_preview: true
      });
    } catch (error) {
      console.error('Error sending telegram message with keyboard:', error);
    }
  }

  private async handleCallbackQuery(callbackQuery: any) {
    if (!this.bot) return;

    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    const user = callbackQuery.from;

    // Answer the callback query to remove loading state
    await this.bot.answerCallbackQuery(callbackQuery.id);

    switch (data) {
      case 'show_link_instructions':
        await this.showLinkInstructions(chatId);
        break;
      case 'check_stats':
        await this.handleStatsCommand(chatId, user);
        break;
      case 'start_grok_chat':
        await this.startGrokChat(chatId);
        break;
      case 'start_ani_chat':
        await this.startAniChat(chatId);
        break;
      case 'view_challenges':
        await this.handleChallengesCommand(chatId, user);
        break;
      case 'view_leaderboard':
        await this.handleLeaderboardCommand(chatId, user);
        break;
      case 'show_help':
        await this.handleHelpCommand(chatId);
        break;
      case 'open_web_app':
        await this.showWebAppAccess(chatId);
        break;
      case 'back_to_start':
        await this.handleStartCommand(chatId, user);
        break;
      case 'cancel_registration':
        // Clean up all registration states
        this.waitingForPin.delete(chatId);
        this.waitingForUsername.delete(chatId);
        this.pendingRegistrations.delete(chatId);
        await this.sendMessage(chatId, '❌ Registration cancelled. Use /link [your-solana-address] to try again.');
        break;
      default:
        // Handle registration callbacks
        if (data.startsWith('register_start:')) {
          const solanaAddress = data.split(':')[1];
          await this.startRegistration(chatId, solanaAddress, user);
        } else if (data.startsWith('register_faction:')) {
          const [, faction, registrationChatId] = data.split(':');
          await this.completeRegistration(parseInt(registrationChatId), faction as 'grok' | 'ani', user);
        } else {
          await this.sendMessage(chatId, '❓ Unknown action. Please try again.');
        }
    }
  }

  private async showLinkInstructions(chatId: number) {
    const message = `🔗 *Link Your Account*

━━━━━━━━━━━━━━━━━━━━━

💰 *To link your Telegram to your platform account:*

1️⃣ Copy your Solana wallet address
2️⃣ Send this command:

\`/link [your-solana-address]\`

📝 *Example:*
\`/link 7xKF4W8gZHXkqH5PQQTw5k8N9YjVfN3mH6LpR2wGjKtN\`

━━━━━━━━━━━━━━━━━━━━━

✅ Once linked, you'll have access to all bot features!`;

    await this.sendMessage(chatId, message);
  }

  private async startGrokChat(chatId: number) {
    const message = `🧠 *Grok Chat Mode Activated*

━━━━━━━━━━━━━━━━━━━━━

🤖 *Ready for logical analysis and strategic thinking!*

💭 *Just send me a message or use:*
\`/grok [your question]\`

📊 *Example questions:*
• "What's the best strategy for...?"
• "Analyze this problem..."
• "How does X work technically?"

━━━━━━━━━━━━━━━━━━━━━

🎯 *Each interaction earns you Grok faction points!*`;

    await this.sendMessage(chatId, message);
  }

  private async startAniChat(chatId: number) {
    const message = `❤️ *Ani Chat Mode Activated*

━━━━━━━━━━━━━━━━━━━━━

💖 *Ready for creative inspiration and emotional connection!*

💭 *Just send me a message or use:*
\`/ani [your thoughts]\`

🎨 *Example topics:*
• "I'm feeling..."
• "Help me be creative with..."
• "What inspires you about...?"

━━━━━━━━━━━━━━━━━━━━━

✨ *Each interaction earns you Ani faction points!*`;

    await this.sendMessage(chatId, message);
  }

  private async showWebAppAccess(chatId: number) {
    const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'your-platform-url.com';
    const webAppUrl = `https://${domain}`;
    
    const message = `🌐 *Access Full Web Platform*

━━━━━━━━━━━━━━━━━━━━━

🚀 *Experience the complete Grok & Ani ecosystem on the web!*

✨ *Web Platform Features:*
• 🎯 Complete challenges with full interface
• 🎨 Advanced AI chat with conversation history
• 🏆 Detailed leaderboards and analytics
• 💰 Manage your GAC tokens and NFTs
• 📊 View comprehensive stats dashboard
• 🗳️ Participate in story voting
• 👥 Join community discussions

━━━━━━━━━━━━━━━━━━━━━

🔗 *Platform URL:*
${webAppUrl}

💡 *Tip:* Link your account first for seamless access!`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🌐 Open Web Platform', web_app: { url: webAppUrl } }
        ],
        [
          { text: '🔗 Link Account First', callback_data: 'show_link_instructions' },
          { text: '🏠 Back to Menu', callback_data: 'back_to_start' }
        ]
      ]
    };

    await this.sendMessageWithKeyboard(chatId, message, keyboard);
  }

  private waitingForPin: Map<number, any> = new Map();
  private waitingForUsername: Map<number, any> = new Map();
  private pendingRegistrations: Map<number, any> = new Map();

  private async startRegistration(chatId: number, solanaAddress: string, user: any) {
    await this.sendMessage(chatId, `📝 **Starting Registration**

🔐 Please reply with a 4-digit PIN for your account security.

📱 **Example:** 1234

This PIN will be used to secure your account and verify transactions.

📝 Reply with your PIN now:`);

    // Store registration state
    this.waitingForPin.set(chatId, { solanaAddress, telegramUser: user });
  }

  private async handlePinInput(chatId: number, pin: string, registrationData: any) {
    if (!/^\d{4}$/.test(pin)) {
      await this.sendMessage(chatId, '❌ Invalid PIN format. Please enter exactly 4 digits (e.g., 1234):');
      return;
    }

    // Store PIN and ask for username
    this.waitingForUsername.set(chatId, {
      ...registrationData,
      pin: pin
    });

    await this.sendMessage(chatId, `✅ PIN set successfully!

👤 **Choose Your Username**

Please reply with your desired username for the platform.

📝 **Requirements:**
• 3-20 characters
• Letters, numbers, and underscores only
• Must be unique

💡 **Example:** CryptoMaster_2024

📱 Reply with your username now:`);

    // Clear PIN waiting state
    this.waitingForPin.delete(chatId);
  }

  private async handleUsernameInput(chatId: number, username: string, registrationData: any) {
    // Validate username format
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      await this.sendMessage(chatId, '❌ Invalid username format. Please use 3-20 characters (letters, numbers, and underscores only):');
      return;
    }

    // TODO: Check if username already exists once storage method is implemented
    // For now, we'll allow any valid username

    // Store username and show faction selection
    this.pendingRegistrations.set(chatId, {
      ...registrationData,
      username: username
    });

    const factionKeyboard = {
      inline_keyboard: [
        [
          { text: '🧠 Join Grok (Logic)', callback_data: `register_faction:grok:${chatId}` }
        ],
        [
          { text: '❤️ Join Ani (Emotion)', callback_data: `register_faction:ani:${chatId}` }
        ],
        [
          { text: '❌ Cancel', callback_data: 'cancel_registration' }
        ]
      ]
    };

    await this.sendMessageWithKeyboard(chatId, `✅ Username "${username}" is available!

🎯 **Choose Your Faction**

🧠 **Grok (Logic AI):**
• Analytical thinking and problem-solving
• Strategic planning and optimization
• Technical analysis and data insights

❤️ **Ani (Emotion AI):**
• Creative expression and intuition
• Emotional intelligence and empathy
• Artistic inspiration and storytelling

🤔 **Which faction resonates with you?**`, factionKeyboard);

    // Clear username waiting state
    this.waitingForUsername.delete(chatId);
  }

  private async completeRegistration(chatId: number, faction: 'grok' | 'ani', user: any) {
    try {
      const regData = this.pendingRegistrations.get(chatId);
      if (!regData) {
        await this.sendMessage(chatId, '❌ Registration session expired. Please start over with /link command.');
        return;
      }

      // Create new user account
      const userData = {
        profileName: regData.username || user.first_name || 'Telegram User',
        solanaAddress: regData.solanaAddress.trim(),
        pin: regData.pin,
        faction: faction
      };

      const newUser = await storage.createUser(userData);
      
      // Link telegram account
      await storage.linkTelegramAccount(newUser.id, user.id.toString());

      const factionEmoji = faction === 'grok' ? '🧠' : '❤️';
      const factionName = faction === 'grok' ? 'Grok (Logic)' : 'Ani (Emotion)';

      await this.sendMessage(chatId, `🎉 **Registration Complete!**

✅ Account created successfully!
👤 Name: ${userData.profileName}
🎯 Faction: ${factionEmoji} ${factionName}
💰 Starting Balance: 100 GAC
⭐ Level: 1

🚀 **You can now:**
• Chat with ${faction === 'grok' ? 'Grok' : 'Ani'} using /${faction} [message]
• View your stats with /stats
• Check challenges with /challenges
• Access the full platform features

Welcome to the Conscious Coin Project! 🌟`);

      // Clean up registration state
      this.pendingRegistrations.delete(chatId);
      this.waitingForPin.delete(chatId);

    } catch (error) {
      console.error('Registration error:', error);
      await this.sendMessage(chatId, '❌ Registration failed. Please try again later or contact support.');
    }
  }

  async sendNotification(telegramId: string, message: string) {
    if (!this.bot) return;
    
    try {
      await this.bot.sendMessage(parseInt(telegramId), message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  async sendDailyRewardReminder(telegramId: string, userId: string) {
    if (!this.bot) return;
    
    try {
      const rewardStatus = await getDailyRewardStatus(userId);
      
      if (rewardStatus.canClaim && rewardStatus.nextReward) {
        const { coins, xp, badge } = rewardStatus.nextReward;
        const streakEmoji = rewardStatus.currentStreak >= 7 ? "🔥" : "📅";
        const badgeText = badge ? `\n🏆 **Special Reward**: ${badge}` : "";
        
        const message = `${streakEmoji} **Daily Reward Available!**

💰 **Today's Reward:**
• ${coins} GAC Coins
• ${xp} XP Points${badgeText}

⚡ **Current Streak:** ${rewardStatus.currentStreak} days

Don't lose your streak! Claim your reward now! 🎯`;

        // Generate authentication token for web app
        const webAppUrl = await this.generateWebAppUrl(telegramId);

        await this.sendMessageWithKeyboard(parseInt(telegramId), message, {
          inline_keyboard: [[{
            text: "🎁 Claim Reward",
            web_app: { url: webAppUrl }
          }]]
        });
      }
    } catch (error) {
      console.error('Error sending daily reward reminder:', error);
    }
  }

  async sendStreakWarning(telegramId: string, userId: string) {
    if (!this.bot) return;
    
    try {
      const rewardStatus = await getDailyRewardStatus(userId);
      
      if (rewardStatus.currentStreak > 0 && rewardStatus.missedDays > 0) {
        const message = `⚠️ **Streak Warning!**

🔥 Your ${rewardStatus.currentStreak}-day streak is at risk!

You have ${24 - new Date().getHours()} hours left to claim today's reward and keep your streak alive!

💰 Don't miss out on ${rewardStatus.nextReward?.coins} coins and ${rewardStatus.nextReward?.xp} XP!`;

        // Generate authentication token for web app
        const webAppUrl = await this.generateWebAppUrl(telegramId);

        await this.sendMessageWithKeyboard(parseInt(telegramId), message, {
          inline_keyboard: [[{
            text: "🚀 Save My Streak",
            web_app: { url: webAppUrl }
          }]]
        });
      }
    } catch (error) {
      console.error('Error sending streak warning:', error);
    }
  }

  private async generateWebAppUrl(telegramId: string): Promise<string> {
    try {
      // Call internal API to generate webapp token
      const response = await fetch(`http://localhost:5000/api/telegram/generate-webapp-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telegramId })
      });

      if (response.ok) {
        const { webAppUrl } = await response.json();
        return webAppUrl;
      } else {
        console.error('Failed to generate webapp token:', await response.text());
        return `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      }
    } catch (error) {
      console.error('Error generating webapp URL:', error);
      return `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    }
  }

  async sendDailyRewardReminders() {
    if (!this.bot) return;
    
    try {
      // Get all linked Telegram users
      const telegramUsers = await storage.getLinkedTelegramUsers();
      
      console.log(`🔔 Sending daily reward reminders to ${telegramUsers.length} users...`);
      
      for (const telegramUser of telegramUsers) {
        if (telegramUser.userId) {
          // Send reminder with a small delay between messages
          setTimeout(() => {
            this.sendDailyRewardReminder(telegramUser.telegramId, telegramUser.userId!);
          }, Math.random() * 10000); // Random delay up to 10 seconds
        }
      }
      
      console.log('✅ Daily reward reminders sent');
    } catch (error) {
      console.error('Error sending daily reward reminders:', error);
    }
  }
}

export const telegramBot = new GrokAniTelegramBot();