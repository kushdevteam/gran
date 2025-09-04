import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Footer from "@/components/footer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Vote, Plus, Clock, CheckCircle, XCircle, Users, 
  MessageSquare, Lightbulb, Settings, Coins, TrendingUp 
} from "lucide-react";
import type { User, GovernanceVote } from "@shared/schema";

interface Proposal {
  id: string;
  title: string;
  description: string;
  type: "feature" | "economic" | "governance" | "story";
  status: "active" | "passed" | "rejected" | "pending";
  author: User;
  yesVotes: number;
  noVotes: number;
  totalVotingPower: number;
  endDate: string;
  createdAt: string;
  requiredQuorum: number;
}

const proposalSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  type: z.enum(["feature", "economic", "governance", "story"]),
});

export default function Governance() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "feature" as const,
    },
  });

  const { data: proposals = [], isLoading: proposalsLoading } = useQuery<Proposal[]>({
    queryKey: ["/api/governance/proposals"],
    refetchInterval: 15000, // Update every 15 seconds
  });

  const { data: userVotes = [] } = useQuery<GovernanceVote[]>({
    queryKey: ["/api/governance/my-votes"],
    enabled: !!user,
  });

  const createProposalMutation = useMutation({
    mutationFn: async (data: z.infer<typeof proposalSchema>) => {
      await apiRequest("POST", "/api/governance/proposals", data);
    },
    onSuccess: () => {
      toast({
        title: "Proposal Created",
        description: "Your proposal is now live for community voting!",
      });
      setIsDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/governance/proposals"] });
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
        title: "Creation Failed",
        description: "Failed to create proposal",
        variant: "destructive",
      });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ proposalId, vote }: { proposalId: string; vote: "yes" | "no" }) => {
      await apiRequest("POST", "/api/governance/vote", { proposalId, vote });
    },
    onSuccess: () => {
      toast({
        title: "Vote Submitted",
        description: "Your voice has been heard in governance!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/governance/proposals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/governance/my-votes"] });
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

  const getProposalTypeIcon = (type: string) => {
    switch (type) {
      case "feature": return <Lightbulb className="h-4 w-4" />;
      case "economic": return <Coins className="h-4 w-4" />;
      case "governance": return <Settings className="h-4 w-4" />;
      case "story": return <MessageSquare className="h-4 w-4" />;
      default: return <Vote className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-blue-500";
      case "passed": return "bg-green-500";
      case "rejected": return "bg-red-500";
      case "pending": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const hasVoted = (proposalId: string) => {
    return userVotes.some((vote: any) => vote.proposalId === proposalId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-orbitron text-3xl font-bold mb-2" data-testid="text-governance-title">
              Community Governance
            </h1>
            <p className="text-muted-foreground">
              Shape the future of the GAC ecosystem through democratic proposals and voting.
            </p>
          </div>

          {user && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-proposal">
                  <Plus className="h-4 w-4 mr-2" />
                  New Proposal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Proposal</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => createProposalMutation.mutate(data))} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proposal Title</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Add new feature for AI personalities..." 
                              {...field}
                              data-testid="input-proposal-title"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proposal Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-proposal-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="feature">Feature Request</SelectItem>
                              <SelectItem value="economic">Economic Change</SelectItem>
                              <SelectItem value="governance">Governance Update</SelectItem>
                              <SelectItem value="story">Story Direction</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Detailed Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Explain your proposal in detail, including benefits and implementation approach..."
                              className="h-32"
                              {...field}
                              data-testid="input-proposal-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        data-testid="button-cancel-proposal"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createProposalMutation.isPending}
                        data-testid="button-submit-proposal"
                      >
                        {createProposalMutation.isPending ? "Creating..." : "Create Proposal"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="active" data-testid="tab-active">Active Proposals</TabsTrigger>
            <TabsTrigger value="passed" data-testid="tab-passed">Passed</TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">Rejected</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-8">
            <div className="space-y-6">
              {proposalsLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : proposals.filter(p => p.status === "active").length > 0 ? (
                proposals
                  .filter(p => p.status === "active")
                  .map((proposal) => (
                    <ProposalCard 
                      key={proposal.id} 
                      proposal={proposal}
                      hasVoted={hasVoted(proposal.id)}
                      onVote={(vote) => voteMutation.mutate({ proposalId: proposal.id, vote })}
                      isVoting={voteMutation.isPending}
                    />
                  ))
              ) : (
                <div className="text-center text-muted-foreground p-12">
                  <Vote className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Active Proposals</h3>
                  <p>Be the first to shape our community's future!</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="passed" className="mt-8">
            <div className="space-y-6">
              {proposals
                .filter(p => p.status === "passed")
                .map((proposal) => (
                  <ProposalCard 
                    key={proposal.id} 
                    proposal={proposal}
                    hasVoted={hasVoted(proposal.id)}
                    onVote={() => {}}
                    isVoting={false}
                    readonly={true}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="rejected" className="mt-8">
            <div className="space-y-6">
              {proposals
                .filter(p => p.status === "rejected")
                .map((proposal) => (
                  <ProposalCard 
                    key={proposal.id} 
                    proposal={proposal}
                    hasVoted={hasVoted(proposal.id)}
                    onVote={() => {}}
                    isVoting={false}
                    readonly={true}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card data-testid="governance-analytics-total">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Vote className="h-5 w-5" />
                    Total Proposals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{proposals.length}</div>
                  <div className="text-sm text-muted-foreground">All time</div>
                </CardContent>
              </Card>

              <Card data-testid="governance-analytics-participation">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Participation Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">67%</div>
                  <div className="text-sm text-muted-foreground">Community engagement</div>
                </CardContent>
              </Card>

              <Card data-testid="governance-analytics-success">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {proposals.length > 0 ? Math.round((proposals.filter(p => p.status === "passed").length / proposals.length) * 100) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Passed proposals</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}

interface ProposalCardProps {
  proposal: Proposal;
  hasVoted: boolean;
  onVote: (vote: "yes" | "no") => void;
  isVoting: boolean;
  readonly?: boolean;
}

function ProposalCard({ proposal, hasVoted, onVote, isVoting, readonly = false }: ProposalCardProps) {
  const totalVotes = proposal.yesVotes + proposal.noVotes;
  const yesPercentage = totalVotes > 0 ? (proposal.yesVotes / totalVotes) * 100 : 0;
  const noPercentage = totalVotes > 0 ? (proposal.noVotes / totalVotes) * 100 : 0;
  const quorumProgress = (proposal.totalVotingPower / proposal.requiredQuorum) * 100;

  const timeLeft = new Date(proposal.endDate).getTime() - Date.now();
  const daysLeft = Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60 * 24)));

  return (
    <Card className="border-2" data-testid={`proposal-${proposal.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {proposal.type && getProposalTypeIcon(proposal.type)}
              <Badge variant="outline" className="text-xs">
                {proposal.type.charAt(0).toUpperCase() + proposal.type.slice(1)}
              </Badge>
              <Badge className={getStatusColor(proposal.status)}>
                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
              </Badge>
            </div>
            <CardTitle className="text-xl mb-2" data-testid={`proposal-title-${proposal.id}`}>
              {proposal.title}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={proposal.author?.profileImageUrl || ""} />
                  <AvatarFallback className="text-xs">
                    {(proposal.author?.firstName?.[0] || proposal.author?.email?.[0] || "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{proposal.author?.firstName || proposal.author?.email?.split('@')[0] || 'Anonymous'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{daysLeft} days left</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-muted-foreground mb-6" data-testid={`proposal-description-${proposal.id}`}>
          {proposal.description}
        </p>

        {/* Voting Results */}
        <div className="space-y-4 mb-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-green-600 font-medium">Yes ({proposal.yesVotes})</span>
              <span className="text-red-600 font-medium">No ({proposal.noVotes})</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full flex">
                <div 
                  className="bg-green-500" 
                  style={{ width: `${yesPercentage}%` }}
                ></div>
                <div 
                  className="bg-red-500" 
                  style={{ width: `${noPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Quorum Progress</span>
              <span>{Math.min(100, Math.round(quorumProgress))}%</span>
            </div>
            <Progress value={Math.min(100, quorumProgress)} className="h-2" />
          </div>
        </div>

        {/* Voting Buttons */}
        {!readonly && proposal.status === "active" && (
          <div className="flex gap-4">
            {hasVoted ? (
              <div className="flex-1 text-center py-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 inline mr-1" />
                You have voted on this proposal
              </div>
            ) : (
              <>
                <Button
                  onClick={() => onVote("yes")}
                  disabled={isVoting}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  data-testid={`button-vote-yes-${proposal.id}`}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Vote Yes
                </Button>
                <Button
                  onClick={() => onVote("no")}
                  disabled={isVoting}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  data-testid={`button-vote-no-${proposal.id}`}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Vote No
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getProposalTypeIcon(type: string) {
  switch (type) {
    case "feature": return <Lightbulb className="h-4 w-4" />;
    case "economic": return <Coins className="h-4 w-4" />;
    case "governance": return <Settings className="h-4 w-4" />;
    case "story": return <MessageSquare className="h-4 w-4" />;
    default: return <Vote className="h-4 w-4" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "active": return "bg-blue-500";
    case "passed": return "bg-green-500";
    case "rejected": return "bg-red-500";
    case "pending": return "bg-yellow-500";
    default: return "bg-gray-500";
  }
}