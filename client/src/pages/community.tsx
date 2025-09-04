import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Code, Palette, Book, Gamepad2, ThumbsUp, Heart, Upload, User } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

const submissionSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
  category: z.enum(["art", "code", "lore", "game"], {
    required_error: "Please select a category",
  }),
  fileUrl: z.string().optional(),
});

type SubmissionForm = z.infer<typeof submissionSchema>;

export default function Community() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const form = useForm<SubmissionForm>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "art",
      fileUrl: "",
    },
  });

  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: selectedCategory ? ["/api/community/submissions", { category: selectedCategory }] : ["/api/community/submissions"],
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SubmissionForm) => {
      await apiRequest("POST", "/api/community/submit", data);
    },
    onSuccess: () => {
      toast({
        title: "Submission Created!",
        description: "Your creation has been submitted for community review.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/community/submissions"] });
      form.reset();
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
        title: "Submission Failed",
        description: "Failed to submit your creation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ submissionId, isUpvote }: { submissionId: string; isUpvote: boolean }) => {
      await apiRequest("POST", `/api/community/vote/${submissionId}`, { isUpvote });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/submissions"] });
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

  const onSubmit = (data: SubmissionForm) => {
    submitMutation.mutate(data);
  };

  const handleVote = (submissionId: string, isUpvote: boolean) => {
    voteMutation.mutate({ submissionId, isUpvote });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "code": return <Code className="h-5 w-5 text-grok" />;
      case "art": return <Palette className="h-5 w-5 text-ani" />;
      case "lore": return <Book className="h-5 w-5 text-accent" />;
      case "game": return <Gamepad2 className="h-5 w-5 text-primary" />;
      default: return <Code className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "code": return "text-grok border-grok/50";
      case "art": return "text-ani border-ani/50";
      case "lore": return "text-accent border-accent/50";
      case "game": return "text-primary border-primary/50";
      default: return "text-muted-foreground border-border";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="font-orbitron text-3xl font-bold mb-4" data-testid="text-community-title">
            Community Co-Creation Arena
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Build extensions to the Grok & Ani universe. Submit art, code, stories, or concepts for community review and rewards.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Submission Categories and Recent Submissions */}
          <div className="lg:col-span-2 space-y-8">
            {/* Category Filter */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card 
                className={`cursor-pointer transition-colors ${selectedCategory === "code" ? "border-grok/50 bg-grok/5" : "hover:border-grok/50"}`}
                onClick={() => setSelectedCategory(selectedCategory === "code" ? "" : "code")}
                data-testid="category-code"
              >
                <CardContent className="p-6 text-center">
                  <Code className="h-8 w-8 text-grok mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Code Extensions</h4>
                  <p className="text-xs text-muted-foreground">Smart contracts, dApps, tools</p>
                </CardContent>
              </Card>
              
              <Card 
                className={`cursor-pointer transition-colors ${selectedCategory === "art" ? "border-ani/50 bg-ani/5" : "hover:border-ani/50"}`}
                onClick={() => setSelectedCategory(selectedCategory === "art" ? "" : "art")}
                data-testid="category-art"
              >
                <CardContent className="p-6 text-center">
                  <Palette className="h-8 w-8 text-ani mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Digital Art</h4>
                  <p className="text-xs text-muted-foreground">NFTs, avatars, UI designs</p>
                </CardContent>
              </Card>
              
              <Card 
                className={`cursor-pointer transition-colors ${selectedCategory === "lore" ? "border-accent/50 bg-accent/5" : "hover:border-accent/50"}`}
                onClick={() => setSelectedCategory(selectedCategory === "lore" ? "" : "lore")}
                data-testid="category-lore"
              >
                <CardContent className="p-6 text-center">
                  <Book className="h-8 w-8 text-accent mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Lore & Stories</h4>
                  <p className="text-xs text-muted-foreground">Plot lines, character arcs</p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-colors ${selectedCategory === "game" ? "border-primary/50 bg-primary/5" : "hover:border-primary/50"}`}
                onClick={() => setSelectedCategory(selectedCategory === "game" ? "" : "game")}
                data-testid="category-game"
              >
                <CardContent className="p-6 text-center">
                  <Gamepad2 className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Game Concepts</h4>
                  <p className="text-xs text-muted-foreground">Gameplay ideas, mechanics</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Recent Submissions */}
            <Card>
              <CardHeader>
                <CardTitle className="font-orbitron">
                  {selectedCategory ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Submissions` : "Recent Submissions"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {submissionsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : submissions && submissions.length > 0 ? (
                  <div className="space-y-4" data-testid="submissions-list">
                    {submissions.map((submission: any) => (
                      <div key={submission.id} className="flex items-start space-x-4 p-4 bg-muted rounded-lg" data-testid={`submission-${submission.id}`}>
                        <div className={`w-16 h-16 rounded-lg flex items-center justify-center border-2 ${getCategoryColor(submission.category)}`}>
                          {getCategoryIcon(submission.category)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium mb-1" data-testid={`submission-title-${submission.id}`}>
                            {submission.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2" data-testid={`submission-description-${submission.id}`}>
                            {submission.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={submission.author?.profileImageUrl} />
                                <AvatarFallback className="text-xs">
                                  {(submission.author?.firstName?.[0] || submission.author?.email?.[0] || "U").toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground" data-testid={`submission-author-${submission.id}`}>
                                by {submission.author?.firstName || submission.author?.email?.split('@')[0] || 'Anonymous'}
                              </span>
                              <Badge variant="outline" className={getCategoryColor(submission.category)}>
                                {submission.category}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleVote(submission.id, true)}
                                disabled={voteMutation.isPending}
                                className="text-grok hover:text-grok/80 hover:bg-grok/10"
                                data-testid={`button-upvote-${submission.id}`}
                              >
                                <ThumbsUp className="h-4 w-4 mr-1" />
                                {submission.upvotes || 0}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleVote(submission.id, false)}
                                disabled={voteMutation.isPending}
                                className="text-ani hover:text-ani/80 hover:bg-ani/10"
                                data-testid={`button-downvote-${submission.id}`}
                              >
                                <Heart className="h-4 w-4 mr-1" />
                                {submission.downvotes || 0}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground p-8" data-testid="no-submissions">
                    <Book className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No submissions yet. Be the first to share your creation!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Submission Form */}
          <Card data-testid="submission-form">
            <CardHeader>
              <CardTitle className="font-orbitron">Submit Your Creation</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter creation title" 
                            {...field} 
                            data-testid="input-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="art">Digital Art</SelectItem>
                            <SelectItem value="code">Code Extension</SelectItem>
                            <SelectItem value="lore">Lore & Stories</SelectItem>
                            <SelectItem value="game">Game Concept</SelectItem>
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your creation..." 
                            className="h-24" 
                            {...field} 
                            data-testid="textarea-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="fileUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>File URL (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/your-file" 
                            {...field} 
                            data-testid="input-file-url"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent transition-colors cursor-pointer" data-testid="file-upload-area">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Drop files here or click to upload</p>
                    <p className="text-xs text-muted-foreground mt-1">Alternative: Provide file URL above</p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary text-primary-foreground hover:bg-accent transition-colors"
                    disabled={submitMutation.isPending}
                    data-testid="button-submit-creation"
                  >
                    {submitMutation.isPending ? "Submitting..." : "Submit for Review"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
