import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/footer";
import { AIChat } from "../components/ai-chat";
import { Brain, Heart } from "lucide-react";

export default function AIPortal() {
  const { user } = useAuth();
  // No authentication checks needed

  return (
    <div className="min-h-screen bg-background text-foreground">
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="font-orbitron text-3xl font-bold mb-4" data-testid="text-ai-portal-title">
            AI Portal
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Communicate directly with Grok and Ani. Their responses shape the story and influence community decisions.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Grok Chat Interface */}
          <div className="faction-grok border-2 rounded-xl p-6" data-testid="grok-chat-section">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-grok to-grok-muted flex items-center justify-center mr-4">
                <Brain className="h-6 w-6 text-grok-foreground" />
              </div>
              <div>
                <h3 className="font-orbitron text-xl font-bold text-grok">Grok</h3>
                <div className="flex items-center text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                  Online • Analyzing patterns
                </div>
              </div>
            </div>
            
            <AIChat aiType="grok" />
          </div>
          
          {/* Ani Chat Interface */}
          <div className="faction-ani border-2 rounded-xl p-6" data-testid="ani-chat-section">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-ani to-ani-muted flex items-center justify-center mr-4">
                <Heart className="h-6 w-6 text-ani-foreground" />
              </div>
              <div>
                <h3 className="font-orbitron text-xl font-bold text-ani">Ani</h3>
                <div className="flex items-center text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                  Online • Feeling the vibes
                </div>
              </div>
            </div>
            
            <AIChat aiType="ani" />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
