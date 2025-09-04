import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Puzzle, Palette } from "lucide-react";
import ChallengeInterface from "./challenge-interface";

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: "logic" | "creative";
  faction: "grok" | "ani";
  reward: number;
  timeLimit?: number;
  challengeData?: any;
  solutionData?: any;
}

interface ChallengeCardProps {
  challenge: Challenge;
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const [showInterface, setShowInterface] = useState(false);

  const factionClass = challenge.faction === "grok" ? "faction-grok" : "faction-ani";
  const factionColor = challenge.faction === "grok" ? "text-grok" : "text-ani";
  const Icon = challenge.type === "logic" ? Puzzle : Palette;

  if (showInterface && challenge.challengeData) {
    return (
      <ChallengeInterface 
        challenge={challenge as any}
        onClose={() => setShowInterface(false)}
      />
    );
  }

  return (
    <Card className={`${factionClass} border-2`} data-testid={`challenge-card-${challenge.id}`}>
      <CardHeader>
        <CardTitle className={`${factionColor} flex items-center gap-2`}>
          <Icon className="h-5 w-5" />
          {challenge.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4 text-sm">{challenge.description}</p>
        
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {challenge.timeLimit && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {challenge.timeLimit}h limit
              </span>
            )}
            <span className={factionColor}>+{challenge.reward} points</span>
          </div>
        </div>
        
        <Button 
          onClick={() => setShowInterface(true)}
          className={`w-full ${challenge.faction === "grok" ? "bg-grok hover:bg-grok/80" : "bg-ani hover:bg-ani/80"}`}
          data-testid={`button-start-challenge-${challenge.id}`}
        >
          Start Challenge
        </Button>
      </CardContent>
    </Card>
  );
}