import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { UserStats } from "@/components/user-stats";
import { QuickActions } from "@/components/quick-actions";
import { ActivityFeed } from "@/components/activity-feed";
import { DailyRewards } from "@/components/daily-rewards";
import type { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Heart, Sparkles } from "lucide-react";

export default function Home() {
  const { user } = useAuth() as { user: User | null; isLoading: boolean; isAuthenticated: boolean };
  // No authentication checks needed

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-6 sm:space-y-8 pb-20 sm:pb-8">
      
      {/* Welcome Section */}
      <section className="text-center space-y-4">
        <h1 className="font-orbitron text-2xl sm:text-4xl font-bold" data-testid="text-welcome">
          Welcome back, {user?.profileName || user?.solanaAddress}!
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto px-2">
          Your consciousness expansion journey continues. Ready to explore the digital frontier with Grok & Ani?
        </p>
        <div className="flex items-center justify-center gap-2 text-accent">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-medium">Connected to the GAC Ecosystem</span>
          <Sparkles className="h-5 w-5" />
        </div>
      </section>

      {/* Main Dashboard */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
        <div className="lg:col-span-2 space-y-4 sm:space-y-8">
          <QuickActions />
          <ActivityFeed />
        </div>
        <div className="space-y-4 sm:space-y-8">
          <DailyRewards />
          <UserStats />
          
          {/* AI Highlights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex">
                  <Brain className="h-5 w-5 text-blue-500" />
                  <Heart className="h-5 w-5 text-pink-500 -ml-1" />
                </div>
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                <div className="font-semibold text-blue-700 dark:text-blue-300 text-sm">Grok says:</div>
                <div className="text-sm mt-1 text-gray-700 dark:text-gray-200">
                  "Your logical reasoning has improved 23% this week. Consider tackling the Advanced Algorithm challenge next!"
                </div>
              </div>
              <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border-l-4 border-pink-500">
                <div className="font-semibold text-pink-700 dark:text-pink-300 text-sm">Ani suggests:</div>
                <div className="text-sm mt-1 text-gray-700 dark:text-gray-200">
                  "Your creative energy feels vibrant today! ✨ How about exploring the Story Collaboration feature?"
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
