import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Bell, Vote, Trophy, Coins, MessageSquare, Zap,
  CheckCircle, X, Clock, Star, Users, Gift
} from "lucide-react";

interface Notification {
  id: string;
  userId: string;
  type: "challenge" | "vote" | "nft" | "trade" | "community" | "governance" | "reward";
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
    refetchInterval: 30000, // Check every 30 seconds
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/notifications/mark-all-read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("DELETE", `/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Show toast for new notifications
  useEffect(() => {
    const recentNotifications = notifications.filter(n => 
      !n.isRead && new Date(n.createdAt).getTime() > Date.now() - 60000 // Last minute
    );

    recentNotifications.forEach(notification => {
      if (notification.type === "reward" || notification.type === "challenge") {
        toast({
          title: notification.title,
          description: notification.message,
          duration: 5000,
        });
      }
    });
  }, [notifications, toast]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "challenge": return <Trophy className="h-5 w-5 text-yellow-500" />;
      case "vote": return <Vote className="h-5 w-5 text-blue-500" />;
      case "nft": return <Star className="h-5 w-5 text-purple-500" />;
      case "trade": return <Coins className="h-5 w-5 text-green-500" />;
      case "community": return <Users className="h-5 w-5 text-orange-500" />;
      case "governance": return <MessageSquare className="h-5 w-5 text-indigo-500" />;
      case "reward": return <Gift className="h-5 w-5 text-pink-500" />;
      default: return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  if (!user) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline" 
          size="icon"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              data-testid="notification-count"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-96 sm:w-[540px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </SheetTitle>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                data-testid="button-mark-all-read"
              >
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="mt-6">
          {notifications.length === 0 ? (
            <div className="text-center text-muted-foreground p-8">
              <Bell className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p>You're all caught up! New notifications will appear here.</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-120px)]">
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <Card 
                    key={notification.id} 
                    className={`cursor-pointer transition-colors ${
                      notification.isRead ? 'opacity-75' : 'bg-muted/30'
                    }`}
                    onClick={() => !notification.isRead && markAsReadMutation.mutate(notification.id)}
                    data-testid={`notification-${notification.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-sm truncate">
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(notification.createdAt)}
                              </span>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          {notification.type && (
                            <Badge variant="outline" className="text-xs mt-2">
                              {notification.type}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotificationMutation.mutate(notification.id);
                          }}
                          data-testid={`button-delete-notification-${notification.id}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Real-time notification hook for other components
export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createNotification = (notification: Omit<Notification, "id" | "userId" | "isRead" | "createdAt">) => {
    // Add notification to backend
    apiRequest("POST", "/api/notifications", notification);
    
    // Invalidate cache to refresh
    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
  };

  return {
    createNotification,
  };
}

// In-app notification component for immediate feedback
interface InAppNotificationProps {
  type: "success" | "info" | "warning" | "error";
  title: string;
  message: string;
  onDismiss: () => void;
  autoHide?: boolean;
}

export function InAppNotification({ 
  type, 
  title, 
  message, 
  onDismiss, 
  autoHide = true 
}: InAppNotificationProps) {
  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [autoHide, onDismiss]);

  const getTypeStyles = () => {
    switch (type) {
      case "success": return "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300";
      case "info": return "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300";
      case "warning": return "bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-300";
      case "error": return "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300";
      default: return "bg-muted/10 border-border text-foreground";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success": return <CheckCircle className="h-5 w-5" />;
      case "info": return <Bell className="h-5 w-5" />;
      case "warning": return <Clock className="h-5 w-5" />;
      case "error": return <X className="h-5 w-5" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  return (
    <div className={`fixed top-20 right-4 z-50 max-w-sm border-2 rounded-lg p-4 shadow-lg ${getTypeStyles()}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-1">{title}</h4>
          <p className="text-sm opacity-90">{message}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onDismiss}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}