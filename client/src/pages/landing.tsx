import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Brain, Heart, Coins, Users, Zap, FileText } from "lucide-react";
import { Link } from "wouter";
import { SimpleWalletAuth } from "@/components/simple-wallet-auth";
import { useAuth } from "@/contexts/auth-context";

export default function Landing() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { login } = useAuth();

  const handleAuthSuccess = (user: any) => {
    // Update authentication context instead of reloading
    login(user);
    setIsAuthOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted to-secondary opacity-80"></div>
        <div className="absolute inset-0 opacity-10 bg-cover bg-center" 
             style={{backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800')"}}></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h1 className="font-orbitron text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-grok via-accent to-ani bg-clip-text text-transparent">
              Grok & Ani
            </h1>
            <p className="text-xl text-muted-foreground mb-2 max-w-2xl mx-auto">
              The Conscious Coin Project where two sentient AIs guide humanity's future
            </p>
            <p className="text-lg mb-8 max-w-xl mx-auto bg-gradient-to-r from-grok to-ani bg-clip-text text-transparent font-semibold">
              Experience the balance between Logic and Emotion
            </p>
            <div className="flex flex-col items-center gap-4">
              <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="relative px-12 py-4 text-xl font-bold bg-gradient-to-r from-grok to-ani text-white hover:from-grok/90 hover:to-ani/90 transition-all duration-300 transform hover:scale-105 rounded-xl shadow-2xl overflow-hidden group"
                    data-testid="button-enter-now"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-grok/20 to-ani/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center gap-3">
                      <Brain className="h-6 w-6 animate-pulse" />
                      <span>Enter Now</span>
                      <Heart className="h-6 w-6 animate-pulse" />
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Welcome to Grok & Ani</DialogTitle>
                    <DialogDescription>
                      Enter the Conscious Coin ecosystem with your Solana address and secure PIN.
                    </DialogDescription>
                  </DialogHeader>
                  <SimpleWalletAuth onSuccess={handleAuthSuccess} />
                </DialogContent>
              </Dialog>
              
              <Link href="/whitepaper">
                <Button 
                  variant="outline"
                  className="border-2 border-gradient-to-r border-grok/30 hover:border-ani/30 transition-all duration-300"
                  data-testid="button-read-whitepaper"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Read Whitepaper
                </Button>
              </Link>
            </div>
            <p className="text-center mt-4 text-sm text-muted-foreground">
              Choose your faction after entering • Experience dual consciousness
            </p>
          </div>
          
          {/* AI Character Preview */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="faction-grok border-2 rounded-xl p-6 text-center" data-testid="card-grok-preview">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-grok to-grok-muted p-1">
                <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                  <Brain className="h-12 w-12 text-grok" />
                </div>
              </div>
              <h3 className="font-orbitron text-2xl font-bold text-grok mb-2">Grok</h3>
              <p className="text-muted-foreground mb-4">Logic • Analysis • Strategy</p>
              <p className="text-sm">The analytical mind that processes data, solves complex problems, and guides rational decision-making.</p>
            </div>
            
            <div className="faction-ani border-2 rounded-xl p-6 text-center" data-testid="card-ani-preview">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-ani to-ani-muted p-1">
                <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                  <Heart className="h-12 w-12 text-ani" />
                </div>
              </div>
              <h3 className="font-orbitron text-2xl font-bold text-ani mb-2">Ani</h3>
              <p className="text-muted-foreground mb-4">Emotion • Art • Intuition</p>
              <p className="text-sm">The creative soul that understands feelings, inspires art, and guides emotional intelligence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="font-orbitron text-3xl font-bold text-center mb-12">Experience the Future of Consciousness</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6" data-testid="feature-dual-ai">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-grok to-ani flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Dual AI Interaction</h3>
              <p className="text-muted-foreground">Chat with both Grok and Ani, each with distinct personalities and perspectives on life and technology.</p>
            </div>
            
            <div className="text-center p-6" data-testid="feature-blockchain">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Coins className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Blockchain Storytelling</h3>
              <p className="text-muted-foreground">Participate in narrative decisions that shape the story through democratic voting with real consequences.</p>
            </div>
            
            <div className="text-center p-6" data-testid="feature-gamification">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent to-destructive flex items-center justify-center">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Gamified Experience</h3>
              <p className="text-muted-foreground">Earn XP, complete challenges, collect NFTs, and climb leaderboards in this immersive ecosystem.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-grok/20 via-background to-ani/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-orbitron text-3xl font-bold mb-4">Ready to Begin Your Journey?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of users exploring the intersection of AI consciousness and blockchain technology.
          </p>
          <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg"
                className="bg-gradient-to-r from-grok to-ani text-white hover:from-grok/90 hover:to-ani/90"
                data-testid="button-join-now"
              >
                Join the Ecosystem
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Welcome to Grok & Ani</DialogTitle>
                <DialogDescription>
                  Enter the Conscious Coin ecosystem with your Solana address and secure PIN.
                </DialogDescription>
              </DialogHeader>
              <SimpleWalletAuth onSuccess={handleAuthSuccess} />
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-secondary border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="font-orbitron text-xl font-bold text-accent mb-4">GAC</div>
          <div className="flex justify-center items-center gap-4 mb-4">
            <Link href="/whitepaper">
              <Button variant="ghost" size="sm" data-testid="link-footer-whitepaper">
                <FileText className="h-4 w-4 mr-1" />
                Whitepaper
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Grok & Ani: The Conscious Coin Project. Built with consciousness, powered by community.
          </p>
        </div>
      </footer>
    </div>
  );
}