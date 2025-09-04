import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Brain, Heart, Loader2 } from "lucide-react";

export default function FactionSelector() {
  const { user } = useAuth() as { user: User | null; isLoading: boolean; isAuthenticated: boolean };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentFaction, setCurrentFaction] = useState(user?.faction || "grok");

  // Sync with user data changes
  useEffect(() => {
    if (user?.faction) {
      setCurrentFaction(user.faction);
    }
  }, [user?.faction]);

  const factionMutation = useMutation({
    mutationFn: async (faction: "grok" | "ani") => {
      await apiRequest("PATCH", "/api/user/faction", { faction });
    },
    onSuccess: (_, faction) => {
      setCurrentFaction(faction);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Faction Updated",
        description: `You are now aligned with ${faction === "grok" ? "Grok" : "Ani"}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update faction",
        variant: "destructive",
      });
    },
  });

  const handleFactionChange = (faction: "grok" | "ani") => {
    if (faction !== currentFaction) {
      factionMutation.mutate(faction);
    }
  };

  return (
    <div className="relative flex bg-muted rounded-lg p-1" data-testid="faction-selector">
      {/* Loading overlay */}
      {factionMutation.isPending && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-muted-foreground">Switching...</span>
          </div>
        </div>
      )}
      
      <Button
        variant={currentFaction === "grok" ? "default" : "ghost"}
        size="sm"
        onClick={() => handleFactionChange("grok")}
        disabled={factionMutation.isPending}
        className={`px-3 py-1 text-sm font-medium transition-all duration-300 ${
          currentFaction === "grok"
            ? "bg-grok text-grok-foreground hover:bg-grok/80 transform scale-105"
            : "text-muted-foreground hover:text-foreground"
        }`}
        data-testid="button-faction-grok"
      >
        <Brain className={`mr-1 h-3 w-3 transition-transform duration-300 ${
          factionMutation.isPending ? "animate-pulse" : ""
        }`} />
        Grok
      </Button>
      <Button
        variant={currentFaction === "ani" ? "default" : "ghost"}
        size="sm"
        onClick={() => handleFactionChange("ani")}
        disabled={factionMutation.isPending}
        className={`px-3 py-1 text-sm font-medium transition-all duration-300 ${
          currentFaction === "ani"
            ? "bg-ani text-ani-foreground hover:bg-ani/80 transform scale-105"
            : "text-muted-foreground hover:text-foreground"
        }`}
        data-testid="button-faction-ani"
      >
        <Heart className={`mr-1 h-3 w-3 transition-transform duration-300 ${
          factionMutation.isPending ? "animate-pulse" : ""
        }`} />
        Ani
      </Button>
    </div>
  );
}
