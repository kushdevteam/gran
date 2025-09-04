import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Brain, Heart, Send, User } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

interface AIChatProps {
  aiType: "grok" | "ani";
}

interface ChatMessage {
  id: string;
  userMessage: string;
  aiResponse: string;
  createdAt: string;
}

export function AIChat({ aiType }: AIChatProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: chatHistory = [], isLoading, error } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chat/${aiType}/history`],
  });

  // Handle query errors
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const response = await apiRequest("POST", `/api/chat/${aiType}`, {
        message: messageText
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chat/${aiType}/history`] });
      setMessage("");
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
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessageMutation.isPending) return;
    
    sendMessageMutation.mutate(message);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const aiConfig = {
    grok: {
      icon: Brain,
      color: "text-grok",
      bgColor: "bg-grok/10",
      borderColor: "border-grok",
      placeholder: "Ask Grok anything..."
    },
    ani: {
      icon: Heart,
      color: "text-ani",
      bgColor: "bg-ani/10", 
      borderColor: "border-ani",
      placeholder: "Share with Ani..."
    }
  };

  const config = aiConfig[aiType];
  const Icon = config.icon;

  return (
    <div className="flex flex-col h-96">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto bg-card rounded-lg p-4 mb-4 space-y-4" data-testid={`chat-messages-${aiType}`}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 border-${aiType}`}></div>
          </div>
        ) : chatHistory.length > 0 ? (
          <>
            {chatHistory.slice().reverse().map((chat: ChatMessage) => (
              <div key={chat.id} className="space-y-3">
                {/* User Message */}
                <div className="flex items-start space-x-3 justify-end">
                  <div className="bg-secondary rounded-lg px-4 py-2 max-w-xs" data-testid={`user-message-${chat.id}`}>
                    <p className="text-sm">{chat.userMessage}</p>
                  </div>
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-accent text-accent-foreground">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                {/* AI Message */}
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className={`${config.bgColor} ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className={`${config.bgColor} rounded-lg px-4 py-2 max-w-xs`} data-testid={`ai-message-${chat.id}`}>
                    <p className="text-sm">{chat.aiResponse}</p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(chat.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Icon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Start a conversation with {aiType === "grok" ? "Grok" : "Ani"}</p>
            </div>
          </div>
        )}
        
        {sendMessageMutation.isPending && (
          <div className="flex items-start space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className={`${config.bgColor} ${config.color}`}>
                <Icon className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className={`${config.bgColor} rounded-lg px-4 py-2`}>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex space-x-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={config.placeholder}
          disabled={sendMessageMutation.isPending}
          className={`flex-1 focus:ring-2 focus:ring-${aiType}`}
          data-testid={`input-message-${aiType}`}
        />
        <Button
          type="submit"
          disabled={!message.trim() || sendMessageMutation.isPending}
          className={`${aiType === "grok" ? "bg-grok hover:bg-grok/80" : "bg-ani hover:bg-ani/80"}`}
          data-testid={`button-send-${aiType}`}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
