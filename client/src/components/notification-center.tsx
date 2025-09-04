import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, X, Gift, Trophy, MessageCircle, Zap, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface Notification {
  id: string;
  type: 'achievement' | 'challenge' | 'message' | 'reward' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'achievement',
      title: 'New Achievement Unlocked!',
      message: 'You\'ve earned the "First Steps" achievement for completing your first AI chat!',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
      read: false
    },
    {
      id: '2',
      type: 'challenge',
      title: 'Challenge Completed',
      message: 'Great job completing the "Quantum Logic Puzzle"! You earned 150 XP and 25 GAC.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: false,
      actionUrl: '/dashboard'
    },
    {
      id: '3',
      type: 'message',
      title: 'New AI Insight',
      message: 'Ani has a creative suggestion for your next project based on your recent activity.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      read: true,
      actionUrl: '/ai-portal'
    },
    {
      id: '4',
      type: 'reward',
      title: 'Daily Reward',
      message: 'Your daily GAC reward of 10 tokens has been deposited to your account.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      read: true
    },
    {
      id: '5',
      type: 'system',
      title: 'Story Chapter Update',
      message: 'Chapter 4: "The Harmony Protocol" is now available for voting!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
      read: true,
      actionUrl: '/storychain'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'achievement':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'challenge':
        return <Zap className="h-4 w-4 text-blue-500" />;
      case 'message':
        return <MessageCircle className="h-4 w-4 text-purple-500" />;
      case 'reward':
        return <Gift className="h-4 w-4 text-green-500" />;
      case 'system':
        return <Bell className="h-4 w-4 text-orange-500" />;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <Card className="w-full" data-testid="notification-center">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              data-testid="button-mark-all-read"
            >
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>All caught up! No new notifications.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  !notification.read
                    ? 'bg-accent/10 border-accent/20'
                    : 'bg-muted/30 border-border hover:bg-muted/50'
                }`}
                onClick={() => {
                  if (!notification.read) markAsRead(notification.id);
                  if (notification.actionUrl) {
                    window.location.href = notification.actionUrl;
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`text-sm font-medium ${
                          !notification.read ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {notification.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="text-xs text-muted-foreground mt-2">
                          {format(notification.timestamp, 'MMM d, h:mm a')}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                        data-testid={`button-remove-${notification.id}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {!notification.read && (
                      <div className="w-2 h-2 bg-accent rounded-full mt-2" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}