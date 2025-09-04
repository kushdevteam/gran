import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Heart, Clock, Trophy, CheckCircle, AlertCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: "logic" | "creative";
  faction: "grok" | "ani";
  reward: number;
  timeLimit: number;
  challengeData: any;
  solutionData: any;
}

interface ChallengeInterfaceProps {
  challenge: Challenge;
  onClose: () => void;
}

export default function ChallengeInterface({ challenge, onClose }: ChallengeInterfaceProps) {
  const [submission, setSubmission] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async (submission: string) => {
      setIsSubmitting(true);
      const response = await apiRequest("POST", "/api/challenges/submit", {
        challengeId: challenge.id,
        submission
      }) as any;
      return response;
    },
    onSuccess: (data: any) => {
      setResult(data.validation);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      
      toast({
        title: data.validation.passed ? "Challenge Completed!" : "Challenge Reviewed",
        description: data.validation.passed 
          ? `Great work! You earned ${challenge.reward} points.`
          : "Your submission has been evaluated. Check the feedback below.",
        variant: data.validation.passed ? "default" : "destructive"
      });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: "Failed to submit challenge. Please try again.",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const handleSubmit = () => {
    if (!submission.trim()) {
      toast({
        title: "Empty Submission",
        description: "Please provide your solution before submitting.",
        variant: "destructive"
      });
      return;
    }
    submitMutation.mutate(submission);
  };

  const renderChallengeContent = () => {
    const data = challenge.challengeData;
    
    if (data.type === "algorithmic") {
      return (
        <Tabs defaultValue="problem" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="problem">Problem</TabsTrigger>
            <TabsTrigger value="examples">Test Cases</TabsTrigger>
          </TabsList>
          <TabsContent value="problem" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-grok">Algorithm Challenge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-foreground">{data.problem}</p>
                
                <div>
                  <h4 className="font-semibold mb-2">Constraints:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {data.constraints.map((constraint: string, index: number) => (
                      <li key={index}>{constraint}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Expected Format:</h4>
                  <p className="text-sm text-muted-foreground">
                    Provide your algorithm explanation, approach, and complexity analysis.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="examples" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-grok">Test Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.testCases.map((testCase: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 bg-muted/50">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Input:</strong> <code>{testCase.input}</code>
                        </div>
                        <div>
                          <strong>Expected:</strong> <code>{testCase.expected}</code>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm mt-2">{testCase.explanation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      );
    }

    if (data.type === "security_analysis") {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-grok">Security Scenario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Scenario:</h4>
              <p className="text-foreground">{data.scenario}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Network Components:</h4>
              <div className="grid grid-cols-2 gap-2">
                {data.topology.components.map((component: string, index: number) => (
                  <Badge key={index} variant="outline">{component}</Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Network Connections:</h4>
              <ul className="space-y-1">
                {data.topology.connections.map((connection: string, index: number) => (
                  <li key={index} className="text-sm font-mono bg-muted p-2 rounded">{connection}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Additional Information:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {data.knownInfo.map((info: string, index: number) => (
                  <li key={index}>{info}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (data.type === "design") {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-ani">Design Challenge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Brief:</h4>
              <p className="text-foreground">{data.brief}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Requirements:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {data.requirements.map((req: string, index: number) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Inspiration Sources:</h4>
              <div className="flex flex-wrap gap-2">
                {data.inspiration.map((source: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-ani">{source}</Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Deliverables:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {data.deliverables.map((deliverable: string, index: number) => (
                  <li key={index}>{deliverable}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (data.type === "character_design") {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-ani">Character Design Challenge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Scenario:</h4>
              <p className="text-foreground">{data.scenario}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Requirements:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {data.requirements.map((req: string, index: number) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Character Elements to Address:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {data.characterElements.map((element: string, index: number) => (
                  <li key={index}>{element}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Test Scenarios:</h4>
              <div className="space-y-2">
                {data.scenarios.map((scenario: string, index: number) => (
                  <div key={index} className="bg-muted p-3 rounded-lg text-sm">
                    <strong>Scenario {index + 1}:</strong> {scenario}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return <p>Unsupported challenge type</p>;
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 overflow-y-auto">
      <div className="container max-w-4xl mx-auto py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {challenge.faction === "grok" ? (
                  <Brain className="h-6 w-6 text-grok" />
                ) : (
                  <Heart className="h-6 w-6 text-ani" />
                )}
                <h1 className="text-2xl font-bold">{challenge.title}</h1>
              </div>
              <p className="text-muted-foreground">{challenge.description}</p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{challenge.timeLimit}h limit</span>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="h-4 w-4" />
                  <span>{challenge.reward} points</span>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={onClose} data-testid="button-close-challenge">
              Close
            </Button>
          </div>

          {/* Challenge Content */}
          {renderChallengeContent()}

          {/* Submission Area */}
          {!result && (
            <Card>
              <CardHeader>
                <CardTitle>Your Solution</CardTitle>
                <CardDescription>
                  {challenge.type === "logic" 
                    ? "Explain your approach, algorithm, and complexity analysis."
                    : "Describe your creative concept with detailed explanations."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder={
                    challenge.type === "logic"
                      ? "Provide your algorithm solution, approach explanation, and complexity analysis..."
                      : "Describe your creative concept, design decisions, and rationale..."
                  }
                  value={submission}
                  onChange={(e) => setSubmission(e.target.value)}
                  className="min-h-[200px]"
                  data-testid="textarea-challenge-submission"
                />
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting || !submission.trim()}
                  className={challenge.faction === "grok" ? "bg-grok hover:bg-grok/80" : "bg-ani hover:bg-ani/80"}
                  data-testid="button-submit-challenge"
                >
                  {isSubmitting ? "Evaluating..." : "Submit Solution"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {result && (
            <Card className={`border-2 ${result.passed ? "border-green-500" : "border-red-500"}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.passed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  Challenge {result.passed ? "Completed" : "Needs Improvement"}
                </CardTitle>
                <CardDescription>
                  Score: {result.score}/100 {result.passed && `• +${challenge.reward} points earned`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">AI Feedback:</h4>
                    <p className="text-sm whitespace-pre-wrap">{result.feedback}</p>
                  </div>
                  
                  {result.details && (
                    <div>
                      <h4 className="font-semibold mb-2">Detailed Scores:</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {Object.entries(result.details).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                            <span className="font-mono">{String(value)}/25</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!result.passed && (
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setResult(null);
                          setSubmission("");
                        }}
                        data-testid="button-retry-challenge"
                      >
                        Try Again
                      </Button>
                    )}
                    <Button onClick={onClose} data-testid="button-close-results">
                      {result.passed ? "Continue" : "Close"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}