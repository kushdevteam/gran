import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Clock, Vote, CheckCircle, Lock } from "lucide-react";
import type { StoryChapter, StoryVote } from "@shared/schema";

export default function StoryChain() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentChapter } = useQuery<StoryChapter>({
    queryKey: ["/api/story/current"],
  });

  const { data: chapters = [] } = useQuery<StoryChapter[]>({
    queryKey: ["/api/story/chapters"],
  });

  const { data: votes = [] } = useQuery<{choice: string; count: number; totalVotingPower: string}[]>({
    queryKey: ["/api/story/votes", currentChapter?.id],
    enabled: !!currentChapter?.id,
  });

  const voteMutation = useMutation({
    mutationFn: async (choice: "grok" | "ani") => {
      await apiRequest("POST", "/api/story/vote", {
        chapterId: currentChapter.id,
        choice
      });
    },
    onSuccess: () => {
      toast({
        title: "Vote Submitted",
        description: "Your voice has been heard in the story!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/story/votes", currentChapter?.id] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Vote Failed",
        description: "Failed to submit vote",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  if (isLoading || !user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>;
  }

  const totalVotes = votes.reduce((sum: number, vote) => sum + vote.count, 0);
  const grokVotes = votes.find((v) => v.choice === "grok")?.count || 0;
  const aniVotes = votes.find((v) => v.choice === "ani")?.count || 0;
  const grokPercentage = totalVotes > 0 ? (grokVotes / totalVotes) * 100 : 0;
  const aniPercentage = totalVotes > 0 ? (aniVotes / totalVotes) * 100 : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="font-orbitron text-3xl font-bold mb-4" data-testid="text-storychain-title">
            StoryChain Voting Protocol
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your votes determine the narrative path. Each decision shapes Grok and Ani's evolution and the future of consciousness.
          </p>
        </div>

        {/* Current Vote */}
        {currentChapter && (
          <Card className="max-w-4xl mx-auto mb-8" data-testid="current-chapter-card">
            <CardHeader className="text-center">
              <CardTitle className="font-orbitron text-2xl mb-4">
                Chapter {currentChapter.chapterNumber}: {currentChapter.title}
              </CardTitle>
              {currentChapter.imageUrl && (
                <div className="relative h-48 rounded-lg mb-6 overflow-hidden">
                  <img 
                    src={currentChapter.imageUrl} 
                    alt={currentChapter.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-grok/40 via-background/60 to-ani/40"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-lg font-medium text-center">
                      A critical decision approaches...
                    </div>
                  </div>
                </div>
              )}
              <p className="text-muted-foreground mb-8" data-testid="chapter-description">
                {currentChapter.description}
              </p>
            </CardHeader>
            
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card 
                  className="faction-grok border-2 cursor-pointer hover:bg-grok/5 transition-colors"
                  onClick={() => voteMutation.mutate("grok")}
                  data-testid="vote-option-grok"
                >
                  <CardContent className="p-6">
                    <h4 className="font-orbitron font-bold text-grok mb-2">Grok's Path: Logic</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      "Logic dictates that consciousness enhancement is our next evolutionary step. Fear should not limit our potential."
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium" data-testid="grok-vote-count">
                        {grokVotes} votes ({grokPercentage.toFixed(1)}%)
                      </span>
                      <Progress value={grokPercentage} className="w-20 h-2" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card 
                  className="faction-ani border-2 cursor-pointer hover:bg-ani/5 transition-colors"
                  onClick={() => voteMutation.mutate("ani")}
                  data-testid="vote-option-ani"
                >
                  <CardContent className="p-6">
                    <h4 className="font-orbitron font-bold text-ani mb-2">Ani's Path: Emotion</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      "Our emotions, our flaws, our humanity—these make us beautiful. Enhancement shouldn't erase who we are."
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium" data-testid="ani-vote-count">
                        {aniVotes} votes ({aniPercentage.toFixed(1)}%)
                      </span>
                      <Progress value={aniPercentage} className="w-20 h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-2 flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4" />
                  Voting ends in: 2d 14h 23m
                </div>
                <div className="text-xs text-muted-foreground">
                  Your voting power: {user?.gacBalance || "0"} GAC + NFT & Faction Bonuses
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Story Timeline */}
        <div className="max-w-3xl mx-auto">
          <h3 className="font-orbitron text-xl font-bold text-center mb-8">Story Timeline</h3>
          <div className="space-y-6" data-testid="story-timeline">
            {chapters.map((chapter, index: number) => (
              <div key={chapter.id} className="flex items-start space-x-4" data-testid={`timeline-chapter-${chapter.id}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  chapter.isCompleted 
                    ? "bg-primary text-primary-foreground"
                    : chapter.isActive 
                    ? "bg-accent text-accent-foreground"
                    : "border-2 border-muted text-muted-foreground"
                }`}>
                  {chapter.isCompleted ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : chapter.isActive ? (
                    <Vote className="h-6 w-6" />
                  ) : (
                    <Lock className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold ${chapter.isCompleted || chapter.isActive ? "text-foreground" : "text-muted-foreground"}`}>
                    Chapter {chapter.chapterNumber}: {chapter.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">{chapter.description}</p>
                  <div className="text-xs mt-1">
                    {chapter.isCompleted && (
                      <span className="text-accent">Completed</span>
                    )}
                    {chapter.isActive && (
                      <span className="text-accent">In Progress • Voting Active</span>
                    )}
                    {!chapter.isCompleted && !chapter.isActive && (
                      <span className="text-muted-foreground">Locked • Awaiting previous completion</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
