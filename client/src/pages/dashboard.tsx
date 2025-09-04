import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Coins, Star, Brain, Heart, TrendingUp, Target, Zap, Trophy,
  Users, MessageSquare, Vote, Activity, BarChart3, LineChart,
  Sparkles, Flame, Shield, Lightbulb
} from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ActivityFeed } from "@/components/activity-feed";
import Footer from "@/components/footer";
import type { User, Challenge } from "@shared/schema";

interface PredictionMarket {
  id: string;
  question: string;
  description: string;
  category: "technology" | "economy" | "story" | "community";
  confidence: number;
  trend: "bullish" | "bearish" | "neutral";
  participants: number;
  deadline: string;
}

interface DashboardStats {
  totalUsers: number;
  dailyActiveUsers: number;
  weeklyGrowth: number;
  factionBalance: {
    grok: { users: number; activity: number };
    ani: { users: number; activity: number };
  };
  marketSentiment: {
    overall: number;
    grokBias: number;
    aniBias: number;
  };
}

export default function Dashboard() {
  const { user } = useAuth() as { user: User | null; isLoading: boolean; isAuthenticated: boolean };
  const [activeTab, setActiveTab] = useState("overview");

  const { data: challenges = [] } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges"],
  });

  const { data: dashboardStats } = useQuery<DashboardStats>({
    queryKey: ["/api/oracle/dashboard-stats"],
    refetchInterval: 60000, // Update every minute
  });

  const { data: predictions = [] } = useQuery<PredictionMarket[]>({
    queryKey: ["/api/oracle/predictions"],
    refetchInterval: 300000, // Update every 5 minutes
  });

  const { data: factionWarStats } = useQuery({
    queryKey: ["/api/leaderboard/faction-war"],
    refetchInterval: 30000,
  });

  // No authentication checks needed

  const grokChallenges = (challenges as Challenge[]).filter((c: Challenge) => c.faction === "grok");
  const aniChallenges = (challenges as Challenge[]).filter((c: Challenge) => c.faction === "ani");

  // Dynamic faction-based colors
  const factionColors = {
    accent: user?.faction === "ani" ? "text-ani" : "text-grok",
    accentBg: user?.faction === "ani" ? "from-ani/20 to-ani/10" : "from-grok/20 to-grok/10",
    accentBorder: user?.faction === "ani" ? "border-ani/20" : "border-grok/20",
    primary: user?.faction === "ani" ? "text-ani" : "text-grok"
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className={`font-orbitron text-3xl font-bold mb-8 ${factionColors.accent}`} data-testid="text-dashboard-title">
          Command Center: Advanced Analytics
        </h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
            <TabsTrigger value="predictions" data-testid="tab-predictions">Oracle</TabsTrigger>
            <TabsTrigger value="faction" data-testid="tab-faction">Faction War</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Personal Stats Grid */}
            <div className="grid md:grid-cols-4 gap-6 mb-6">
              <Card className={`bg-gradient-to-br ${factionColors.accentBg} ${factionColors.accentBorder}`} data-testid="card-gac-balance">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="text-muted-foreground">GAC Balance</span>
                    <Coins className={`h-4 w-4 ${factionColors.primary}`} />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${factionColors.primary}`} data-testid="text-gac-balance">
                    {user.gacBalance || "0.0"}
                  </div>
                  <div className="text-xs text-muted-foreground">+0.0 today</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-grok/20 to-grok-muted/10 border-grok/20" data-testid="card-total-xp">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="text-muted-foreground">Total XP</span>
                    <Star className="h-4 w-4 text-grok" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-grok" data-testid="text-total-xp">
                    {user.totalXP || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Level {user.level || 1}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-grok/15 to-transparent border-grok/20" data-testid="card-grok-points">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="text-muted-foreground">GrokPoints</span>
                    <Brain className="h-4 w-4 text-grok" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-grok" data-testid="text-grok-points">
                    {user.grokPoints || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Logic Faction</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-ani/15 to-transparent border-ani/20" data-testid="card-ani-points">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="text-muted-foreground">AniPoints</span>
                    <Heart className="h-4 w-4 text-ani" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-ani" data-testid="text-ani-points">
                    {user.aniPoints || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Emotion Faction</div>
                </CardContent>
              </Card>
            </div>

            {/* Platform Analytics Section */}
            {dashboardStats && (
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <Card data-testid="card-total-users">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="text-muted-foreground">Platform Users</span>
                      <Users className="h-4 w-4 text-blue-500" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-500">{dashboardStats.totalUsers}</div>
                    <div className="text-xs text-muted-foreground">+{dashboardStats.weeklyGrowth}% this week</div>
                  </CardContent>
                </Card>

                <Card data-testid="card-daily-active">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="text-muted-foreground">Daily Active</span>
                      <Activity className="h-4 w-4 text-green-500" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-500">{dashboardStats.dailyActiveUsers}</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round((dashboardStats.dailyActiveUsers / dashboardStats.totalUsers) * 100)}% engagement
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-market-sentiment">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="text-muted-foreground">Market Sentiment</span>
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-500">{dashboardStats.marketSentiment.overall.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">Overall confidence</div>
                  </CardContent>
                </Card>
              </div>
            )}

            <ActivityFeed />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card data-testid="card-challenge-analytics">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Challenge Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Completion Rate</span>
                    <span className="font-semibold">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Avg Score</span>
                    <span className="font-semibold">8.3/10</span>
                  </div>
                  <Progress value={83} className="h-2" />
                </CardContent>
              </Card>

              <Card data-testid="card-ai-interaction">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    AI Interactions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-grok">Grok Conversations</span>
                    <Badge variant="outline" className="text-grok">47</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-ani">Ani Conversations</span>
                    <Badge variant="outline" className="text-ani">23</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Avg session: 12 minutes
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Prediction Markets Tab */}
          <TabsContent value="predictions" className="space-y-6">
            <Card data-testid="card-prediction-markets">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  AI Oracle Predictions
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  AI-generated predictions about platform growth and community trends
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {predictions.length > 0 ? predictions.map((prediction, index) => (
                  <div key={prediction.id} className="p-4 rounded-lg border bg-card" data-testid={`prediction-${index}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{prediction.question}</h3>
                      <Badge 
                        variant={prediction.trend === "bullish" ? "default" : prediction.trend === "bearish" ? "destructive" : "secondary"}
                        data-testid={`badge-trend-${index}`}
                      >
                        {prediction.trend}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{prediction.description}</p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Confidence: {prediction.confidence}%</span>
                      <span className="text-muted-foreground">{prediction.participants} participants</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Oracle predictions will appear here as AI analyzes platform trends
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Faction War Tab */}
          <TabsContent value="faction" className="space-y-6">
            {factionWarStats && (
              <Card data-testid="card-faction-war">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Faction War Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">
                      <span className="text-grok">{factionWarStats.grokTotal || 0}</span>
                      <span className="text-muted-foreground mx-4">vs</span>
                      <span className="text-ani">{factionWarStats.aniTotal || 0}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Total Faction Points</div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-grok font-semibold">Grok Dominance</span>
                        <span className="text-grok">{factionWarStats.grokPercentage || 0}%</span>
                      </div>
                      <Progress value={factionWarStats.grokPercentage || 0} className="h-3" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-ani font-semibold">Ani Dominance</span>
                        <span className="text-ani">{factionWarStats.aniPercentage || 0}%</span>
                      </div>
                      <Progress value={factionWarStats.aniPercentage || 0} className="h-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}