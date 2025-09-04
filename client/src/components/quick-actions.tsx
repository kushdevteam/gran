import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { MessageCircle, BookOpen, Palette, Users, Zap, Coins } from "lucide-react";

export function QuickActions() {
  const { user } = useAuth() as { user: User | null; isLoading: boolean; isAuthenticated: boolean };
  
  // Dynamic faction-based colors
  const getFactionColors = (index: number) => {
    const isAni = user?.faction === "ani";
    const baseColor = isAni ? "text-ani" : "text-grok";
    const baseBg = isAni ? "bg-ani/15 border-ani/30 hover:bg-ani/25" : "bg-grok/15 border-grok/30 hover:bg-grok/25";
    return { color: baseColor, bgColor: baseBg };
  };

  const actions = [
    {
      icon: MessageCircle,
      title: "Chat with AIs",
      description: "Talk to Grok & Ani",
      href: "/ai-portal"
    },
    {
      icon: Zap,
      title: "Take Challenge",
      description: "Earn XP & rewards",
      href: "/dashboard"
    },
    {
      icon: BookOpen,
      title: "Story Voting",
      description: "Shape the narrative",
      href: "/storychain"
    },
    {
      icon: Palette,
      title: "Collect NFTs",
      description: "Trade & collect",
      href: "/nfts"
    },
    {
      icon: Users,
      title: "Community Hub",
      description: "Share & discover",
      href: "/community"
    },
    {
      icon: Coins,
      title: "Marketplace",
      description: "Buy & sell assets",
      href: "/nfts?tab=marketplace"
    }
  ];

  return (
    <Card className="w-full" data-testid="quick-actions">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {actions.map((action, index) => {
            const factionColors = getFactionColors(index);
            return (
              <Link key={`${action.href}-${index}`} href={action.href}>
                <Button
                  variant="ghost"
                  className={`h-20 sm:h-24 w-full flex flex-col items-center justify-center gap-1 sm:gap-2 hover:scale-105 transition-transform border-2 touch-manipulation ${factionColors.bgColor}`}
                  data-testid={`quick-action-${action.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <action.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${factionColors.color}`} />
                  <div className="text-center">
                    <div className="text-xs sm:text-sm font-semibold">{action.title}</div>
                    <div className="text-xs text-muted-foreground hidden sm:block">{action.description}</div>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}