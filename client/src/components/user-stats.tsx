import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, Heart, Coins, Trophy, Star } from "lucide-react";

export function UserStats() {
  const { user } = useAuth() as { user: User | null; isLoading: boolean; isAuthenticated: boolean };

  if (!user) return null;

  const totalPoints = (user.grokPoints || 0) + (user.aniPoints || 0);
  const grokPercentage = totalPoints > 0 ? ((user.grokPoints || 0) / totalPoints) * 100 : 50;
  const aniPercentage = totalPoints > 0 ? ((user.aniPoints || 0) / totalPoints) * 100 : 50;
  
  // Calculate next level XP requirement (simplified progression)
  const currentLevel = user.level || 1;
  const nextLevelXP = currentLevel * 1000;
  const currentXP = user.totalXP || 0;
  const xpProgress = ((currentXP % 1000) / 1000) * 100;

  return (
    <Card className="w-full" data-testid="user-stats">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your Journey</span>
          <Badge variant="outline" className="flex items-center gap-1">
            <Trophy className="h-3 w-3" />
            Level {currentLevel}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Balance and XP */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-accent flex items-center justify-center gap-1">
              <Coins className="h-5 w-5" />
              {user.gacBalance || "0.00"}
            </div>
            <div className="text-sm text-muted-foreground">GAC Balance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent flex items-center justify-center gap-1">
              <Star className="h-5 w-5" />
              {currentXP}
            </div>
            <div className="text-sm text-muted-foreground">Total XP</div>
          </div>
        </div>

        {/* Level Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Level Progress</span>
            <span>{Math.round(xpProgress)}%</span>
          </div>
          <Progress value={xpProgress} className="h-2" />
          <div className="text-xs text-muted-foreground mt-1">
            {1000 - (currentXP % 1000)} XP to next level
          </div>
        </div>

        {/* Faction Balance */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Faction Alignment</span>
            <Badge variant={user.faction === "grok" ? "default" : "secondary"}>
              {user.faction === "grok" ? "Grok" : "Ani"}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Brain className="h-4 w-4 text-blue-500" />
                <span>Logic Points</span>
              </div>
              <span className="font-semibold">{user.grokPoints || 0}</span>
            </div>
            <Progress value={grokPercentage} className="h-2 bg-blue-100">
              <div className="h-full bg-blue-500 transition-all duration-300 ease-in-out rounded-full" 
                   style={{ width: `${grokPercentage}%` }} />
            </Progress>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Heart className="h-4 w-4 text-pink-500" />
                <span>Creativity Points</span>
              </div>
              <span className="font-semibold">{user.aniPoints || 0}</span>
            </div>
            <Progress value={aniPercentage} className="h-2 bg-pink-100">
              <div className="h-full bg-pink-500 transition-all duration-300 ease-in-out rounded-full" 
                   style={{ width: `${aniPercentage}%` }} />
            </Progress>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}