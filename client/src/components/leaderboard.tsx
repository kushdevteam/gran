import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Heart, Trophy, Medal, Award, Clock, Star, Coins, Gem } from "lucide-react";
import { useState } from "react";
import type { User } from "@shared/schema";

interface LeaderboardProps {
  faction?: "grok" | "ani";
  category?: "points" | "xp" | "gac" | "nfts" | "voting";
  period?: "daily" | "weekly" | "monthly" | "all-time";
  limit?: number;
  showControls?: boolean;
}

export function Leaderboard({ 
  faction = "grok", 
  category = "points", 
  period = "all-time", 
  limit = 10,
  showControls = false 
}: LeaderboardProps) {
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [selectedPeriod, setSelectedPeriod] = useState(period);
  
  const { data: leaderboard = [], isLoading } = useQuery<User[]>({
    queryKey: [`/api/leaderboard/${faction}`, selectedCategory, selectedPeriod, limit],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const factionConfig = {
    grok: {
      icon: Brain,
      color: "text-grok",
      bgColor: "faction-grok",
      title: "Grok's Analysts",
      pointsLabel: "GrokPoints"
    },
    ani: {
      icon: Heart,
      color: "text-ani", 
      bgColor: "faction-ani",
      title: "Ani's Creatives",
      pointsLabel: "AniPoints"
    }
  };

  const config = factionConfig[faction];
  const Icon = config.icon;

  const getRankIcon = (position: number) => {
    if (position === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (position === 2) return <Medal className="h-4 w-4 text-gray-400" />;
    if (position === 3) return <Award className="h-4 w-4 text-amber-600" />;
    return <span className="text-sm font-bold">{position}</span>;
  };

  return (
    <Card className={`${config.bgColor} border-2`} data-testid={`leaderboard-${faction}`}>
      <CardHeader>
        <CardTitle className={`${config.color} flex items-center gap-2`}>
          <Icon className="h-5 w-5" />
          {config.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 border-${faction}`}></div>
          </div>
        ) : leaderboard.length > 0 ? (
          <div className="space-y-3">
            {leaderboard.slice(0, Math.min(limit, 5)).map((user, index: number) => (
              <div 
                key={user.id} 
                className="flex items-center justify-between bg-card rounded-lg p-3"
                data-testid={`leaderboard-item-${faction}-${index}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    {getRankIcon(index + 1)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.profileImageUrl} />
                      <AvatarFallback className="text-xs">
                        {(user.firstName?.[0] || user.email?.[0] || "U").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm" data-testid={`text-username-${index}`}>
                        {user.firstName || user.email?.split('@')[0] || 'Anonymous'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Level {user.level || 1}
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`${config.color} font-bold text-sm`} data-testid={`text-points-${index}`}>
                  {faction === "grok" ? user.grokPoints || 0 : user.aniPoints || 0}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground p-8">
            <Icon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No rankings yet. Be the first to earn {config.pointsLabel}!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
