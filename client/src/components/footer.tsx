import { Github, Twitter, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-12 bg-secondary border-t border-border">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="font-orbitron text-xl font-bold text-accent mb-4" data-testid="text-footer-logo">
              GAC
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Bridging consciousness through blockchain storytelling.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="text-muted-foreground hover:text-accent transition-colors"
                data-testid="link-twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-accent transition-colors"
                data-testid="link-discord"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-accent transition-colors"
                data-testid="link-github"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-accent transition-colors" data-testid="link-how-it-works">How it Works</a></li>
              <li><a href="#" className="hover:text-accent transition-colors" data-testid="link-tokenomics">Tokenomics</a></li>
              <li><a href="#" className="hover:text-accent transition-colors" data-testid="link-smart-contracts">Smart Contracts</a></li>
              <li><a href="#" className="hover:text-accent transition-colors" data-testid="link-api-docs">API Documentation</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Community</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-accent transition-colors" data-testid="link-governance">Governance</a></li>
              <li><a href="#" className="hover:text-accent transition-colors" data-testid="link-faction-guidelines">Faction Guidelines</a></li>
              <li><a href="#" className="hover:text-accent transition-colors" data-testid="link-creator-program">Creator Program</a></li>
              <li><a href="#" className="hover:text-accent transition-colors" data-testid="link-bug-bounty">Bug Bounty</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-accent transition-colors" data-testid="link-whitepaper">Whitepaper</a></li>
              <li><a href="#" className="hover:text-accent transition-colors" data-testid="link-lore-book">Lore Book</a></li>
              <li><a href="#" className="hover:text-accent transition-colors" data-testid="link-help-center">Help Center</a></li>
              <li><a href="#" className="hover:text-accent transition-colors" data-testid="link-contact">Contact</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-12 pt-6 text-center">
          <p className="text-sm text-muted-foreground" data-testid="text-copyright">
            © 2024 Grok & Ani: The Conscious Coin Project. Built with consciousness, powered by community.
          </p>
        </div>
      </div>
    </footer>
  );
}
