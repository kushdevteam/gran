import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface DailyReward {
  day: number;
  coins: number;
  xp: number;
  badge?: string;
  title?: string;
}

export interface DailyRewardStatus {
  canClaim: boolean;
  currentStreak: number;
  nextReward?: DailyReward;
  missedDays: number;
  lastLoginDate?: Date | null;
}

// Daily reward structure (escalating rewards without NFTs)
export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, coins: 10, xp: 5 },
  { day: 2, coins: 15, xp: 8 },
  { day: 3, coins: 20, xp: 10 },
  { day: 4, coins: 25, xp: 15 },
  { day: 5, coins: 30, xp: 20 },
  { day: 6, coins: 40, xp: 25 },
  { day: 7, coins: 50, xp: 30, badge: "Week Warrior", title: "Completed 7-day streak!" },
  { day: 14, coins: 75, xp: 50, badge: "Fortnight Fighter", title: "Completed 14-day streak!" },
  { day: 30, coins: 150, xp: 100, badge: "Monthly Master", title: "Completed 30-day streak!" },
  { day: 100, coins: 500, xp: 300, badge: "Century Champion", title: "Completed 100-day streak!" },
];

export function calculateDailyReward(streak: number): DailyReward {
  // Find the exact reward for the streak day
  const exactReward = DAILY_REWARDS.find(reward => reward.day === streak);
  if (exactReward) {
    return exactReward;
  }

  // For days beyond our defined rewards, use a formula
  if (streak <= 7) {
    const baseReward = DAILY_REWARDS.find(r => r.day === streak) || DAILY_REWARDS[streak - 1];
    return baseReward || { day: streak, coins: 10 + (streak * 5), xp: 5 + (streak * 3) };
  }

  // For longer streaks, give bonus rewards
  const weekMultiplier = Math.floor(streak / 7);
  const baseCoins = 50;
  const baseXP = 30;
  
  return {
    day: streak,
    coins: baseCoins + (weekMultiplier * 25),
    xp: baseXP + (weekMultiplier * 15),
    ...(streak % 7 === 0 ? { badge: `${streak}-Day Hero`, title: `Amazing ${streak}-day streak!` } : {})
  };
}

export function isNewDay(lastLogin?: Date | null): boolean {
  if (!lastLogin) return true;
  
  const now = new Date();
  const lastLoginDate = new Date(lastLogin);
  
  // Set both dates to start of day for comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastLoginDay = new Date(lastLoginDate.getFullYear(), lastLoginDate.getMonth(), lastLoginDate.getDate());
  
  return today.getTime() > lastLoginDay.getTime();
}

export function calculateMissedDays(lastLogin?: Date | null): number {
  if (!lastLogin) return 0;
  
  const now = new Date();
  const lastLoginDate = new Date(lastLogin);
  const diffTime = now.getTime() - lastLoginDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays - 1); // -1 because same day = 0 missed days
}

export async function getDailyRewardStatus(userId: string): Promise<DailyRewardStatus> {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (!user.length) {
    throw new Error("User not found");
  }

  const userData = user[0];
  const currentStreak = userData.loginStreak || 0;
  const lastLogin = userData.lastLoginDate;
  const missedDays = calculateMissedDays(lastLogin);
  
  // Can claim if it's a new day since last login
  const canClaim = isNewDay(lastLogin);
  
  // Calculate what the next reward would be
  let nextStreakDay = currentStreak + 1;
  
  // If missed more than 1 day, reset streak
  if (missedDays > 1) {
    nextStreakDay = 1;
  }
  
  const nextReward = calculateDailyReward(nextStreakDay);

  return {
    canClaim,
    currentStreak,
    nextReward,
    missedDays,
    lastLoginDate: lastLogin
  };
}

export async function claimDailyReward(userId: string): Promise<{ reward: DailyReward; newStreak: number }> {
  const status = await getDailyRewardStatus(userId);
  
  if (!status.canClaim) {
    throw new Error("Daily reward already claimed today");
  }

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user.length) {
    throw new Error("User not found");
  }

  const userData = user[0];
  let newStreak = (userData.loginStreak || 0);
  
  // If missed more than 1 day, reset streak
  if (status.missedDays > 1) {
    newStreak = 1;
  } else {
    newStreak += 1;
  }

  const reward = calculateDailyReward(newStreak);
  
  // Update user data
  await db.update(users)
    .set({
      lastLoginDate: new Date(),
      loginStreak: newStreak,
      gacBalance: (parseFloat(userData.gacBalance || "0") + reward.coins).toString(),
      totalXP: (userData.totalXP || 0) + reward.xp,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId));

  return { reward, newStreak };
}

// Helper function to format streak display
export function formatStreakDisplay(streak: number): string {
  if (streak === 0) return "Start your streak!";
  if (streak === 1) return "1 day streak";
  return `${streak} day streak`;
}

// Helper function to get motivational message
export function getMotivationalMessage(streak: number, reward: DailyReward): string {
  const messages = [
    `Amazing! ${streak} days strong! 🔥`,
    `You're on fire! Day ${streak} complete! ⚡`,
    `Incredible dedication! ${streak} days in a row! 🌟`,
    `Streak master! ${streak} consecutive days! 🏆`,
    `Unstoppable! Day ${streak} conquered! 🚀`
  ];
  
  if (reward.badge) {
    return `🎉 ${reward.title} You've earned the "${reward.badge}" badge! 🎉`;
  }
  
  return messages[Math.floor(Math.random() * messages.length)];
}