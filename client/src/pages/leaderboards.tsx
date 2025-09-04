import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Leaderboard } from "@/components/leaderboard";
import Footer from "@/components/footer";
import { 
  Trophy, Medal, Award, Crown, Brain, Heart, Zap, 
  Coins, Gem, Target, TrendingUp, Users, Swords 
} from "lucide-react";
import type { User } from "@shared/schema";

interface FactionWarStats {
  grokTotal: number;
  aniTotal: number;
  grokPercentage: number;
  aniPercentage: number;
}

export default function Leaderboards() {
  const { user, isLoading } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<"daily" | "weekly" | "monthly" | "all-time">("all-time");

  const { data: factionWarStats } = useQuery<FactionWarStats>({
    queryKey: ["/api/leaderboard/faction-war"],
    refetchInterval: 10000, // Update every 10 seconds
  });

  const { data: overallLeaderboard = [] } = useQuery<User[]>({
    queryKey: ["/api/leaderboard/overall", "xp", selectedPeriod],
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getRankIcon = (position: number) => {
    if (position === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (position === 2) return <Trophy className="h-5 w-5 text-gray-400" />;
    if (position === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-lg font-bold">{position}</span>;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="font-orbitron text-3xl font-bold mb-4" data-testid="text-leaderboards-title">
            Global Rankings & Faction War
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Track your progress and compete with the community. See how Grok and Ani factions battle for supremacy.
          </p>
        </div>

        {/* Faction War Overview */}
        {factionWarStats && (
          <Card className="mb-8 border-2 border-primary/20" data-testid="faction-war-stats">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Swords className="h-6 w-6" />
                Faction War Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="faction-grok p-4 rounded-lg border">
                    <Brain className="h-8 w-8 mx-auto mb-2 text-grok" />
                    <div className="font-orbitron text-2xl font-bold text-grok">
                      {factionWarStats?.grokTotal || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Grok Faction</div>
                  </div>
                </div>
                
                <div className="flex flex-col justify-center">
                  <div className="text-center mb-4">
                    <div className="text-sm text-muted-foreground mb-2">Total Dominance</div>
                    <Progress 
                      value={factionWarStats?.grokPercentage || 50} 
                      className="h-3"
                    />
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-grok">Grok {(factionWarStats?.grokPercentage || 50).toFixed(1)}%</span>
                      <span className="text-ani">Ani {(factionWarStats?.aniPercentage || 50).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="faction-ani p-4 rounded-lg border">
                    <Heart className="h-8 w-8 mx-auto mb-2 text-ani" />
                    <div className="font-orbitron text-2xl font-bold text-ani">
                      {factionWarStats?.aniTotal || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Ani Faction</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Period Selector */}
        <div className="flex justify-center mb-8">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48" data-testid="select-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily Rankings</SelectItem>
              <SelectItem value="weekly">Weekly Rankings</SelectItem>
              <SelectItem value="monthly">Monthly Rankings</SelectItem>
              <SelectItem value="all-time">All-Time Rankings</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="overall" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overall" data-testid="tab-overall">Overall</TabsTrigger>
            <TabsTrigger value="grok" data-testid="tab-grok">Grok Faction</TabsTrigger>
            <TabsTrigger value="ani" data-testid="tab-ani">Ani Faction</TabsTrigger>
            <TabsTrigger value="categories" data-testid="tab-categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="overall" className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-2" data-testid="overall-leaderboard">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    Top Players - Total XP
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {overallLeaderboard.slice(0, 10).map((player, index) => (
                      <div 
                        key={player.id} 
                        className="flex items-center justify-between p-3 bg-card rounded-lg"
                        data-testid={`overall-rank-${index}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            {getRankIcon(index + 1)}
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={player.profileImageUrl || ""} />
                            <AvatarFallback>
                              {(player.firstName?.[0] || player.email?.[0] || "U").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {player.firstName || player.email?.split('@')[0] || 'Anonymous'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Level {player.level || 1} • {player.faction || "Neutral"}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{player.totalXP || 0} XP</div>
                          <div className="text-xs text-muted-foreground">
                            {player.gacBalance || 0} GAC
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {user && (
                <Card className="border-2 border-primary/20" data-testid="user-ranking-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Your Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Global Rank</span>
                        <Badge variant="outline">#42</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Faction Rank</span>
                        <Badge variant="secondary">#{user.faction === "grok" ? "15" : "23"}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Total XP</span>
                        <span className="font-bold">{user.totalXP || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GAC Balance</span>
                        <span className="font-bold">{user.gacBalance || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Challenges Won</span>
                        <span className="font-bold">8</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="grok" className="mt-8">
            <Leaderboard faction="grok" limit={20} showControls={true} />
          </TabsContent>

          <TabsContent value="ani" className="mt-8">
            <Leaderboard faction="ani" limit={20} showControls={true} />
          </TabsContent>

          <TabsContent value="categories" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-2" data-testid="category-xp">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Zap className="h-5 w-5" />
                    XP Masters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {overallLeaderboard.slice(0, 3).map((player, index) => (
                      <div key={player.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getRankIcon(index + 1)}
                          <span className="text-sm">{player.firstName || "Anonymous"}</span>
                        </div>
                        <span className="font-bold text-primary">{player.totalXP || 0}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2" data-testid="category-gac">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-600">
                    <Coins className="h-5 w-5" />
                    GAC Holders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {overallLeaderboard
                      .sort((a, b) => parseFloat(b.gacBalance || "0") - parseFloat(a.gacBalance || "0"))
                      .slice(0, 3).map((player, index) => (
                      <div key={player.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getRankIcon(index + 1)}
                          <span className="text-sm">{player.firstName || "Anonymous"}</span>
                        </div>
                        <span className="font-bold text-yellow-600">{player.gacBalance || 0}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2" data-testid="category-nft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-600">
                    <Gem className="h-5 w-5" />
                    NFT Collectors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center text-muted-foreground p-4">
                      <Gem className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">NFT rankings coming soon!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}