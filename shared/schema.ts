import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  integer,
  text,
  boolean,
  decimal,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (wallet-based authentication)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileName: varchar("profile_name").notNull(),
  solanaAddress: varchar("solana_address").unique().notNull(),
  pin: varchar("pin").notNull(), // Hashed 4-digit PIN
  email: varchar("email"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  faction: varchar("faction", { enum: ["grok", "ani"] }).default("grok"),
  gacBalance: decimal("gac_balance", { precision: 10, scale: 2 }).default("0"),
  totalXP: integer("total_xp").default(0),
  grokPoints: integer("grok_points").default(0),
  aniPoints: integer("ani_points").default(0),
  level: integer("level").default(1),
  loyaltyTier: varchar("loyalty_tier", { enum: ["bronze", "silver", "gold", "platinum", "diamond"] }).default("bronze"),
  loyaltyScore: integer("loyalty_score").default(0),
  factionJoinDate: timestamp("faction_join_date").defaultNow(),
  consecutiveDaysActive: integer("consecutive_days_active").default(0),
  lastLoginDate: timestamp("last_login_date"),
  loginStreak: integer("login_streak").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Telegram users table for bot integration
export const telegramUsers = pgTable("telegram_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  telegramId: varchar("telegram_id").unique().notNull(),
  userId: varchar("user_id").references(() => users.id),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  username: varchar("username"),
  isLinked: boolean("is_linked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const challenges = pgTable("challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: varchar("type", { enum: ["logic", "creative"] }).notNull(),
  faction: varchar("faction", { enum: ["grok", "ani"] }).notNull(),
  reward: integer("reward").notNull(),
  timeLimit: integer("time_limit"), // in hours
  challengeData: jsonb("challenge_data").notNull(), // Interactive challenge content
  solutionData: jsonb("solution_data"), // Expected solution for validation
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userChallenges = pgTable("user_challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  challengeId: varchar("challenge_id").notNull().references(() => challenges.id),
  completed: boolean("completed").default(false),
  submission: text("submission"),
  score: integer("score"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const storyChapters = pgTable("story_chapters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chapterNumber: integer("chapter_number").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(false),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const storyVotes = pgTable("story_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chapterId: varchar("chapter_id").notNull().references(() => storyChapters.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  choice: varchar("choice", { enum: ["grok", "ani"] }).notNull(),
  votingPower: decimal("voting_power", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const nfts = pgTable("nfts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenId: integer("token_id").unique().notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  faction: varchar("faction", { enum: ["grok", "ani", "neutral"] }).notNull(),
  rarity: varchar("rarity", { enum: ["common", "rare", "epic", "legendary"] }).notNull(),
  attributes: jsonb("attributes"),
  ownerId: varchar("owner_id").references(() => users.id),
  isForSale: boolean("is_for_sale").default(false),
  price: decimal("price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  aiType: varchar("ai_type", { enum: ["grok", "ani"] }).notNull(),
  userMessage: text("user_message").notNull(),
  aiResponse: text("ai_response").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communitySubmissions = pgTable("community_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: varchar("category", { enum: ["art", "code", "lore", "game"] }).notNull(),
  fileUrl: text("file_url"),
  authorId: varchar("author_id").notNull().references(() => users.id),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  status: varchar("status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const governanceProposals = pgTable("governance_proposals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: varchar("type", { enum: ["feature", "economic", "governance", "story"] }).notNull(),
  authorId: varchar("author_id").notNull().references(() => users.id),
  status: varchar("status", { enum: ["active", "passed", "rejected", "pending"] }).default("active"),
  yesVotes: integer("yes_votes").default(0),
  noVotes: integer("no_votes").default(0),
  totalVotingPower: decimal("total_voting_power", { precision: 15, scale: 2 }).default("0"),
  requiredQuorum: decimal("required_quorum", { precision: 15, scale: 2 }).default("1000"),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const governanceVotes = pgTable("governance_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proposalId: varchar("proposal_id").notNull().references(() => governanceProposals.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  vote: varchar("vote", { enum: ["yes", "no"] }).notNull(),
  votingPower: decimal("voting_power", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // 'reward', 'achievement', 'challenge', 'story', etc.
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // Additional data as JSON
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityEvents = pgTable("community_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: varchar("type", { enum: ["challenge_blitz", "cross_faction_collab", "story_event", "nft_hunt", "loyalty_boost"] }).notNull(),
  status: varchar("status", { enum: ["upcoming", "active", "completed"] }).default("upcoming"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  rewards: jsonb("rewards").notNull(), // Reward structure
  requirements: jsonb("requirements"), // Participation requirements
  progress: jsonb("progress").default({}), // Event progress tracking
  participantCount: integer("participant_count").default(0),
  maxParticipants: integer("max_participants"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventParticipations = pgTable("event_participations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => communityEvents.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  progress: jsonb("progress").default({}), // User's progress in the event
  completed: boolean("completed").default(false),
  reward_claimed: boolean("reward_claimed").default(false),
  contribution: jsonb("contribution"), // What the user contributed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Personality Evolution System
export const aiPersonalities = pgTable("ai_personalities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  aiName: varchar("ai_name", { enum: ["grok", "ani"] }).notNull(),
  personalityTraits: jsonb("personality_traits").notNull(), // Evolving personality data
  conversationStyle: jsonb("conversation_style").notNull(), // Speaking patterns, preferences
  memoryBank: jsonb("memory_bank").default({}), // Important memories and user patterns
  evolutionLevel: integer("evolution_level").default(1), // How much the AI has evolved
  totalInteractions: integer("total_interactions").default(0),
  lastEvolution: timestamp("last_evolution").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userAiInteractions = pgTable("user_ai_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  aiName: varchar("ai_name", { enum: ["grok", "ani"] }).notNull(),
  message: text("message").notNull(),
  response: text("response").notNull(),
  sentiment: varchar("sentiment", { enum: ["positive", "neutral", "negative"] }),
  topics: jsonb("topics").default([]), // Extracted topics from conversation
  userSatisfaction: integer("user_satisfaction"), // 1-5 rating if provided
  conversationContext: jsonb("conversation_context").default({}),
  responseTime: integer("response_time"), // AI response time in ms
  createdAt: timestamp("created_at").defaultNow(),
});

export const personalizedAiProfiles = pgTable("personalized_ai_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  aiName: varchar("ai_name", { enum: ["grok", "ani"] }).notNull(),
  personalityPreferences: jsonb("personality_preferences").notNull(), // User's preferred AI traits
  conversationHistory: jsonb("conversation_history").default([]), // Recent conversation summaries
  topicInterests: jsonb("topic_interests").default({}), // Topics user discusses most
  communicationStyle: varchar("communication_style", { 
    enum: ["formal", "casual", "technical", "creative", "supportive"] 
  }).default("casual"),
  relationshipLevel: varchar("relationship_level", { 
    enum: ["stranger", "acquaintance", "friend", "trusted_companion"] 
  }).default("stranger"),
  lastInteraction: timestamp("last_interaction").defaultNow(),
  totalConversations: integer("total_conversations").default(0),
  averageSatisfaction: decimal("average_satisfaction", { precision: 3, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Guild System
export const guilds = pgTable("guilds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  faction: varchar("faction", { enum: ["grok", "ani", "neutral"] }).notNull(),
  founderId: varchar("founder_id").notNull().references(() => users.id),
  memberLimit: integer("member_limit").default(50),
  memberCount: integer("member_count").default(1),
  guildType: varchar("guild_type", { 
    enum: ["competitive", "collaborative", "educational", "social", "research"] 
  }).notNull(),
  status: varchar("status", { enum: ["active", "recruiting", "closed", "disbanded"] }).default("recruiting"),
  requirements: jsonb("requirements").default({}), // Level, XP, NFT requirements
  perks: jsonb("perks").default({}), // Guild bonuses and benefits
  achievements: jsonb("achievements").default([]), // Guild collective achievements
  totalGacEarned: decimal("total_gac_earned", { precision: 15, scale: 2 }).default("0"),
  guildRank: integer("guild_rank").default(0), // Leaderboard position
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const guildMembers = pgTable("guild_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guildId: varchar("guild_id").notNull().references(() => guilds.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: varchar("role", { 
    enum: ["founder", "officer", "member", "recruit"] 
  }).default("member"),
  joinedAt: timestamp("joined_at").defaultNow(),
  contributionScore: integer("contribution_score").default(0),
  lastActive: timestamp("last_active").defaultNow(),
  permissions: jsonb("permissions").default({}), // What member can do
  personalGoals: jsonb("personal_goals").default([]), // Member's goals in guild
}, (table) => ({
  uniqueGuildUser: unique().on(table.guildId, table.userId),
}));

export const guildGoals = pgTable("guild_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guildId: varchar("guild_id").notNull().references(() => guilds.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  goalType: varchar("goal_type", { 
    enum: ["challenges", "nft_collection", "leaderboard", "community_event", "xp_milestone"] 
  }).notNull(),
  target: jsonb("target").notNull(), // Target metrics to achieve
  progress: jsonb("progress").default({}), // Current progress
  reward: jsonb("reward").notNull(), // Guild rewards for completion
  deadline: timestamp("deadline"),
  status: varchar("status", { enum: ["active", "completed", "failed", "paused"] }).default("active"),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const guildInvitations = pgTable("guild_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guildId: varchar("guild_id").notNull().references(() => guilds.id),
  invitedUserId: varchar("invited_user_id").notNull().references(() => users.id),
  invitedByUserId: varchar("invited_by_user_id").notNull().references(() => users.id),
  status: varchar("status", { enum: ["pending", "accepted", "declined", "expired"] }).default("pending"),
  message: text("message"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
});

// Personal AI Assistant System
export const aiAssistantProfiles = pgTable("ai_assistant_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  assistantName: varchar("assistant_name").notNull(), // Personalized name for their assistant
  assistantPersonality: varchar("assistant_personality", { 
    enum: ["analytical_mentor", "creative_guide", "balanced_advisor", "strategic_coach", "empathetic_supporter"] 
  }).default("balanced_advisor"),
  preferences: jsonb("preferences").default({}), // Notification preferences, briefing style, etc.
  learningProfile: jsonb("learning_profile").default({}), // User's strengths, weaknesses, interests
  dailyGoals: jsonb("daily_goals").default([]), // AI-suggested daily objectives
  longTermGoals: jsonb("long_term_goals").default([]), // Weekly/monthly objectives
  achievementHistory: jsonb("achievement_history").default([]), // Past accomplishments
  lastBriefing: timestamp("last_briefing").defaultNow(),
  briefingFrequency: varchar("briefing_frequency", { 
    enum: ["daily", "every_2_days", "weekly", "on_demand"] 
  }).default("daily"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiRecommendations = pgTable("ai_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type", { 
    enum: ["challenge", "guild", "event", "nft_opportunity", "faction_activity", "social"] 
  }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  actionData: jsonb("action_data").notNull(), // What action to take
  priority: varchar("priority", { enum: ["low", "medium", "high", "urgent"] }).default("medium"),
  reasoning: text("reasoning").notNull(), // Why AI recommended this
  predictedOutcome: text("predicted_outcome"), // Expected benefits
  status: varchar("status", { enum: ["pending", "viewed", "acted_on", "dismissed", "expired"] }).default("pending"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  actedAt: timestamp("acted_at"),
});

export const dailyBriefings = pgTable("daily_briefings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  briefingDate: timestamp("briefing_date").notNull(),
  factionSummary: jsonb("faction_summary").notNull(), // Faction performance and trends
  personalProgress: jsonb("personal_progress").notNull(), // User's recent achievements and changes
  guildUpdates: jsonb("guild_updates").default({}), // Guild activity summary
  marketInsights: jsonb("market_insights").notNull(), // NFT market, GAC trends
  recommendedActions: jsonb("recommended_actions").default([]), // Top 3-5 AI suggestions
  motivationalMessage: text("motivational_message").notNull(), // Personalized encouragement
  weeklyGoalProgress: jsonb("weekly_goal_progress").default({}), // Progress toward goals
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  challenges: many(userChallenges),
  votes: many(storyVotes),
  nfts: many(nfts),
  chatMessages: many(chatMessages),
  submissions: many(communitySubmissions),
  governanceProposals: many(governanceProposals),
  governanceVotes: many(governanceVotes),
  telegramUser: one(telegramUsers),
}));

export const telegramUsersRelations = relations(telegramUsers, ({ one }) => ({
  user: one(users, {
    fields: [telegramUsers.userId],
    references: [users.id],
  }),
}));

export const challengesRelations = relations(challenges, ({ many }) => ({
  userChallenges: many(userChallenges),
}));

export const userChallengesRelations = relations(userChallenges, ({ one }) => ({
  user: one(users, {
    fields: [userChallenges.userId],
    references: [users.id],
  }),
  challenge: one(challenges, {
    fields: [userChallenges.challengeId],
    references: [challenges.id],
  }),
}));

export const storyChaptersRelations = relations(storyChapters, ({ many }) => ({
  votes: many(storyVotes),
}));

export const storyVotesRelations = relations(storyVotes, ({ one }) => ({
  chapter: one(storyChapters, {
    fields: [storyVotes.chapterId],
    references: [storyChapters.id],
  }),
  user: one(users, {
    fields: [storyVotes.userId],
    references: [users.id],
  }),
}));

export const nftsRelations = relations(nfts, ({ one }) => ({
  owner: one(users, {
    fields: [nfts.ownerId],
    references: [users.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

export const communitySubmissionsRelations = relations(communitySubmissions, ({ one }) => ({
  author: one(users, {
    fields: [communitySubmissions.authorId],
    references: [users.id],
  }),
}));

export const governanceProposalsRelations = relations(governanceProposals, ({ one, many }) => ({
  author: one(users, {
    fields: [governanceProposals.authorId],
    references: [users.id],
  }),
  votes: many(governanceVotes),
}));

export const governanceVotesRelations = relations(governanceVotes, ({ one }) => ({
  proposal: one(governanceProposals, {
    fields: [governanceVotes.proposalId],
    references: [governanceProposals.id],
  }),
  user: one(users, {
    fields: [governanceVotes.userId],
    references: [users.id],
  }),
}));

// Insert schemas for wallet authentication
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Registration schema (for new wallet users)
export const registerUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
}).extend({
  pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
});

// Login schema (for wallet authentication)
export const loginUserSchema = z.object({
  solanaAddress: z.string().min(1, "Solana address is required"),
  pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
});

export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
  createdAt: true,
});

export const insertUserChallengeSchema = createInsertSchema(userChallenges).omit({
  id: true,
  createdAt: true,
});

export const insertStoryChapterSchema = createInsertSchema(storyChapters).omit({
  id: true,
  createdAt: true,
});

export const insertStoryVoteSchema = createInsertSchema(storyVotes).omit({
  id: true,
  createdAt: true,
});

export const insertNFTSchema = createInsertSchema(nfts).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertCommunitySubmissionSchema = createInsertSchema(communitySubmissions).omit({
  id: true,
  createdAt: true,
});

export const insertGovernanceProposalSchema = createInsertSchema(governanceProposals).omit({
  id: true,
  createdAt: true,
  yesVotes: true,
  noVotes: true,
  totalVotingPower: true,
});

export const insertGovernanceVoteSchema = createInsertSchema(governanceVotes).omit({
  id: true,
  createdAt: true,
});

export const insertTelegramUserSchema = createInsertSchema(telegramUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertCommunityEventSchema = createInsertSchema(communityEvents).omit({
  id: true,
  createdAt: true,
  participantCount: true,
});

export const insertEventParticipationSchema = createInsertSchema(eventParticipations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiPersonalitySchema = createInsertSchema(aiPersonalities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserAiInteractionSchema = createInsertSchema(userAiInteractions).omit({
  id: true,
  createdAt: true,
});

export const insertPersonalizedAiProfileSchema = createInsertSchema(personalizedAiProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGuildSchema = createInsertSchema(guilds).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  memberCount: true,
  guildRank: true,
});

export const insertGuildMemberSchema = createInsertSchema(guildMembers).omit({
  id: true,
  joinedAt: true,
  lastActive: true,
});

export const insertGuildGoalSchema = createInsertSchema(guildGoals).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertGuildInvitationSchema = createInsertSchema(guildInvitations).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
});

export const insertAiAssistantProfileSchema = createInsertSchema(aiAssistantProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastBriefing: true,
});

export const insertAiRecommendationSchema = createInsertSchema(aiRecommendations).omit({
  id: true,
  createdAt: true,
  actedAt: true,
});

export const insertDailyBriefingSchema = createInsertSchema(dailyBriefings).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type UserChallenge = typeof userChallenges.$inferSelect;
export type InsertUserChallenge = z.infer<typeof insertUserChallengeSchema>;
export type StoryChapter = typeof storyChapters.$inferSelect;
export type InsertStoryChapter = z.infer<typeof insertStoryChapterSchema>;
export type StoryVote = typeof storyVotes.$inferSelect;
export type InsertStoryVote = z.infer<typeof insertStoryVoteSchema>;
export type NFT = typeof nfts.$inferSelect;
export type InsertNFT = z.infer<typeof insertNFTSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type CommunitySubmission = typeof communitySubmissions.$inferSelect;
export type InsertCommunitySubmission = z.infer<typeof insertCommunitySubmissionSchema>;
export type GovernanceProposal = typeof governanceProposals.$inferSelect;
export type InsertGovernanceProposal = z.infer<typeof insertGovernanceProposalSchema>;
export type GovernanceVote = typeof governanceVotes.$inferSelect;
export type InsertGovernanceVote = z.infer<typeof insertGovernanceVoteSchema>;
export type TelegramUser = typeof telegramUsers.$inferSelect;
export type InsertTelegramUser = z.infer<typeof insertTelegramUserSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type CommunityEvent = typeof communityEvents.$inferSelect;
export type InsertCommunityEvent = z.infer<typeof insertCommunityEventSchema>;
export type EventParticipation = typeof eventParticipations.$inferSelect;
export type InsertEventParticipation = z.infer<typeof insertEventParticipationSchema>;

// AI Evolution System types
export type AiPersonality = typeof aiPersonalities.$inferSelect;
export type InsertAiPersonality = z.infer<typeof insertAiPersonalitySchema>;
export type UserAiInteraction = typeof userAiInteractions.$inferSelect;
export type InsertUserAiInteraction = z.infer<typeof insertUserAiInteractionSchema>;
export type PersonalizedAiProfile = typeof personalizedAiProfiles.$inferSelect;
export type InsertPersonalizedAiProfile = z.infer<typeof insertPersonalizedAiProfileSchema>;

// Guild System types
export type Guild = typeof guilds.$inferSelect;
export type InsertGuild = z.infer<typeof insertGuildSchema>;
export type GuildMember = typeof guildMembers.$inferSelect;
export type InsertGuildMember = z.infer<typeof insertGuildMemberSchema>;
export type GuildGoal = typeof guildGoals.$inferSelect;
export type InsertGuildGoal = z.infer<typeof insertGuildGoalSchema>;
export type GuildInvitation = typeof guildInvitations.$inferSelect;
export type InsertGuildInvitation = z.infer<typeof insertGuildInvitationSchema>;

// AI Assistant types
export type AiAssistantProfile = typeof aiAssistantProfiles.$inferSelect;
export type InsertAiAssistantProfile = z.infer<typeof insertAiAssistantProfileSchema>;
export type AiRecommendation = typeof aiRecommendations.$inferSelect;
export type InsertAiRecommendation = z.infer<typeof insertAiRecommendationSchema>;
export type DailyBriefing = typeof dailyBriefings.$inferSelect;
export type InsertDailyBriefing = z.infer<typeof insertDailyBriefingSchema>;
