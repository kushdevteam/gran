import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Lock, CheckCircle, Star, Brain, Heart, Zap } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'logic' | 'creativity' | 'social' | 'exploration';
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: any;
  reward: {
    xp: number;
    gac?: number;
    points?: number;
  };
}

export function Achievements() {
  const achievements: Achievement[] = [
    {
      id: '1',
      name: 'First Steps',
      description: 'Complete your first AI chat session',
      category: 'exploration',
      progress: 1,
      maxProgress: 1,
      unlocked: true,
      rarity: 'common',
      icon: CheckCircle,
      reward: { xp: 100 }
    },
    {
      id: '2',
      name: 'Logic Master',
      description: 'Complete 10 Grok challenges',
      category: 'logic',
      progress: 7,
      maxProgress: 10,
      unlocked: false,
      rarity: 'rare',
      icon: Brain,
      reward: { xp: 500, gac: 10, points: 100 }
    },
    {
      id: '3',
      name: 'Creative Soul',
      description: 'Complete 10 Ani challenges',
      category: 'creativity',
      progress: 4,
      maxProgress: 10,
      unlocked: false,
      rarity: 'rare',
      icon: Heart,
      reward: { xp: 500, gac: 10, points: 100 }
    },
    {
      id: '4',
      name: 'Dual Consciousness',
      description: 'Reach level 10 in both factions',
      category: 'exploration',
      progress: 0,
      maxProgress: 1,
      unlocked: false,
      rarity: 'legendary',
      icon: Zap,
      reward: { xp: 2000, gac: 50 }
    },
    {
      id: '5',
      name: 'Community Builder',
      description: 'Get 100 upvotes on community submissions',
      category: 'social',
      progress: 23,
      maxProgress: 100,
      unlocked: false,
      rarity: 'epic',
      icon: Trophy,
      reward: { xp: 1000, gac: 25 }
    },
    {
      id: '6',
      name: 'Story Weaver',
      description: 'Vote on 20 story chapters',
      category: 'social',
      progress: 8,
      maxProgress: 20,
      unlocked: false,
      rarity: 'rare',
      icon: Star,
      reward: { xp: 750, gac: 15 }
    }
  ];

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'text-gray-500 bg-gray-100 dark:bg-gray-800';
      case 'rare':
        return 'text-blue-500 bg-blue-100 dark:bg-blue-900';
      case 'epic':
        return 'text-purple-500 bg-purple-100 dark:bg-purple-900';
      case 'legendary':
        return 'text-orange-500 bg-orange-100 dark:bg-orange-900';
    }
  };

  const getCategoryIcon = (category: Achievement['category']) => {
    switch (category) {
      case 'logic':
        return <Brain className="h-4 w-4 text-blue-500" />;
      case 'creativity':
        return <Heart className="h-4 w-4 text-pink-500" />;
      case 'social':
        return <Trophy className="h-4 w-4 text-green-500" />;
      case 'exploration':
        return <Star className="h-4 w-4 text-yellow-500" />;
    }
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <Card className="w-full" data-testid="achievements">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Achievements</span>
          <Badge variant="outline">
            {unlockedCount}/{achievements.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg border transition-all ${
                achievement.unlocked
                  ? 'bg-accent/5 border-accent/20'
                  : 'bg-muted/30 border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${getRarityColor(achievement.rarity)}`}>
                  {achievement.unlocked ? (
                    <achievement.icon className="h-5 w-5" />
                  ) : (
                    <Lock className="h-5 w-5" />
                  )}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-semibold ${
                        achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {achievement.name}
                      </h4>
                      {getCategoryIcon(achievement.category)}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={getRarityColor(achievement.rarity)}
                    >
                      {achievement.rarity}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {achievement.description}
                  </p>
                  
                  {!achievement.unlocked && achievement.maxProgress > 1 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{achievement.progress}/{achievement.maxProgress}</span>
                      </div>
                      <Progress 
                        value={(achievement.progress / achievement.maxProgress) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>+{achievement.reward.xp} XP</span>
                    {achievement.reward.gac && (
                      <span>+{achievement.reward.gac} GAC</span>
                    )}
                    {achievement.reward.points && (
                      <span>+{achievement.reward.points} Points</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}