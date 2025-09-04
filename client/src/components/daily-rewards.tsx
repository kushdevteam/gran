import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Gift, 
  Flame, 
  Coins, 
  Star, 
  Trophy,
  Calendar,
  Sparkles 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyReward {
  day: number;
  coins: number;
  xp: number;
  badge?: string;
  title?: string;
}

interface DailyRewardStatus {
  canClaim: boolean;
  currentStreak: number;
  nextReward?: DailyReward;
  missedDays: number;
  lastLoginDate?: string;
  streakDisplay: string;
}

export function DailyRewards() {
  const [claiming, setClaiming] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rewardStatus, isLoading } = useQuery({
    queryKey: ["/api/user/daily-reward/status"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const claimMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/user/daily-reward/claim"),
    onSuccess: (data: any) => {
      // Show success animation
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);

      // Show success toast
      toast({
        title: "Daily Reward Claimed! 🎉",
        description: data.message,
        duration: 5000,
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/user/daily-reward/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Claim Failed",
        description: error.message || "Failed to claim daily reward",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setClaiming(false);
    },
  });

  const handleClaim = async () => {
    setClaiming(true);
    claimMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden" data-testid="daily-rewards-loading">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Daily Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = rewardStatus as DailyRewardStatus;
  if (!status) return null;

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "text-purple-500";
    if (streak >= 14) return "text-orange-500";
    if (streak >= 7) return "text-yellow-500";
    if (streak >= 3) return "text-green-500";
    return "text-blue-500";
  };

  const getStreakIcon = (streak: number) => {
    if (streak >= 30) return Trophy;
    if (streak >= 7) return Flame;
    return Calendar;
  };

  const StreakIcon = getStreakIcon(status.currentStreak);

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        status.canClaim && "ring-2 ring-primary/50 shadow-lg",
        showConfetti && "animate-pulse"
      )}
      data-testid="daily-rewards-card"
    >
      {/* Confetti Animation Overlay */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-pink-500/20 to-purple-600/20 animate-pulse"></div>
          {[...Array(12)].map((_, i) => (
            <Sparkles
              key={i}
              className={cn(
                "absolute text-yellow-400 animate-bounce",
                i % 4 === 0 && "text-pink-500",
                i % 4 === 1 && "text-purple-600",
                i % 4 === 2 && "text-blue-500",
                i % 4 === 3 && "text-green-500"
              )}
              style={{
                top: `${Math.random() * 80 + 10}%`,
                left: `${Math.random() * 80 + 10}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${1 + Math.random()}s`,
              }}
              size={16 + Math.random() * 8}
            />
          ))}
        </div>
      )}

      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Daily Rewards
          </div>
          <div className="flex items-center gap-2">
            <StreakIcon className={cn("h-4 w-4", getStreakColor(status.currentStreak))} />
            <span className={cn("text-sm font-bold", getStreakColor(status.currentStreak))}>
              {status.streakDisplay}
            </span>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Reward Preview */}
        {status.nextReward && (
          <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {status.canClaim ? "Available Now!" : "Next Reward"}
              </span>
              {status.nextReward.badge && (
                <Badge variant="secondary" className="text-xs">
                  {status.nextReward.badge}
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Coins Reward */}
              <div className="flex items-center gap-2">
                <div className="p-2 bg-yellow-500/10 rounded-full">
                  <Coins className="h-4 w-4 text-yellow-500" />
                </div>
                <div>
                  <div className="text-lg font-bold text-yellow-500">
                    {status.nextReward.coins}
                  </div>
                  <div className="text-xs text-muted-foreground">GAC Coins</div>
                </div>
              </div>

              {/* XP Reward */}
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 rounded-full">
                  <Star className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-500">
                    {status.nextReward.xp}
                  </div>
                  <div className="text-xs text-muted-foreground">XP Points</div>
                </div>
              </div>
            </div>

            {/* Special Title */}
            {status.nextReward.title && (
              <div className="mt-3 text-center">
                <div className="text-sm font-medium text-primary">
                  🎉 {status.nextReward.title}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Claim Button or Status */}
        {status.canClaim ? (
          <Button 
            onClick={handleClaim}
            disabled={claiming}
            className="w-full text-white font-bold py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300"
            data-testid="button-claim-reward"
          >
            {claiming ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Claiming...
              </>
            ) : (
              <>
                <Gift className="mr-2 h-4 w-4" />
                Claim Daily Reward
              </>
            )}
          </Button>
        ) : (
          <div className="text-center py-3">
            <div className="text-sm text-muted-foreground">
              {status.missedDays > 1 ? (
                <>
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Streak reset due to {status.missedDays} missed days
                </>
              ) : (
                <>
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Come back tomorrow for your next reward!
                </>
              )}
            </div>
            {status.lastLoginDate && (
              <div className="text-xs text-muted-foreground mt-1">
                Last claimed: {new Date(status.lastLoginDate).toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        {/* Streak Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Current Streak</span>
            <span className="font-medium">{status.currentStreak} days</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                "bg-gradient-to-r from-primary to-primary/80"
              )}
              style={{ 
                width: `${Math.min((status.currentStreak / 7) * 100, 100)}%` 
              }}
            />
          </div>
          <div className="text-xs text-muted-foreground text-center">
            {status.currentStreak < 7 
              ? `${7 - status.currentStreak} days until Week Warrior badge`
              : status.currentStreak < 30
              ? `${30 - status.currentStreak} days until Monthly Master badge`
              : "You're a legend! 🏆"
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
}