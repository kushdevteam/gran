import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Heart, MessageCircle, Trophy, Zap } from "lucide-react";
import { format } from "date-fns";

interface ActivityItem {
  id: string;
  type: 'challenge_complete' | 'ai_chat' | 'story_vote' | 'level_up' | 'nft_earned';
  message: string;
  timestamp: Date;
  points?: number;
  faction?: 'grok' | 'ani';
}

export function ActivityFeed() {
  // Mock activity data - in real app this would come from API
  const mockActivity: ActivityItem[] = [
    {
      id: '1',
      type: 'challenge_complete',
      message: 'Completed "Quantum Logic Puzzle"',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
      points: 150,
      faction: 'grok'
    },
    {
      id: '2', 
      type: 'ai_chat',
      message: 'Had a deep conversation with Ani about creativity',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      points: 25,
      faction: 'ani'
    },
    {
      id: '3',
      type: 'level_up',
      message: 'Reached Level 8!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      points: 0
    },
    {
      id: '4',
      type: 'story_vote', 
      message: 'Voted on Chapter 3: The Digital Divide',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      points: 50,
      faction: 'grok'
    },
    {
      id: '5',
      type: 'nft_earned',
      message: 'Earned "Logic Master" NFT',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      faction: 'grok'
    }
  ];

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'challenge_complete':
        return <Zap className="h-4 w-4" />;
      case 'ai_chat':
        return <MessageCircle className="h-4 w-4" />;
      case 'story_vote':
        return <Brain className="h-4 w-4" />;
      case 'level_up':
        return <Trophy className="h-4 w-4" />;
      case 'nft_earned':
        return <Heart className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: ActivityItem['type'], faction?: 'grok' | 'ani') => {
    if (faction === 'grok') return 'text-blue-500';
    if (faction === 'ani') return 'text-pink-500';
    
    switch (type) {
      case 'challenge_complete':
        return 'text-yellow-500';
      case 'ai_chat':
        return 'text-purple-500';
      case 'story_vote':
        return 'text-green-500';
      case 'level_up':
        return 'text-orange-500';
      case 'nft_earned':
        return 'text-indigo-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card className="w-full" data-testid="activity-feed">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockActivity.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className={`mt-0.5 ${getActivityColor(activity.type, activity.faction)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="text-sm">{activity.message}</div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">
                    {format(activity.timestamp, 'MMM d, h:mm a')}
                  </div>
                  {activity.points && activity.points > 0 && (
                    <Badge variant="outline" className="text-xs">
                      +{activity.points} XP
                    </Badge>
                  )}
                  {activity.faction && (
                    <Badge 
                      variant={activity.faction === 'grok' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {activity.faction === 'grok' ? 'Grok' : 'Ani'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}