import { Brain, Heart } from "lucide-react";

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-8">
        {/* Animated Logo */}
        <div className="relative mx-auto w-32 h-32">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-grok/20 via-background to-ani/20 animate-spin"></div>
          <div className="absolute inset-2 rounded-full bg-background flex items-center justify-center">
            <div className="flex items-center gap-4">
              <Brain className="h-8 w-8 text-grok animate-pulse" />
              <Heart className="h-8 w-8 text-ani animate-pulse" />
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-4">
          <h1 className="font-orbitron text-2xl font-bold bg-gradient-to-r from-grok to-ani bg-clip-text text-transparent">
            Initializing Consciousness
          </h1>
          <div className="space-y-2">
            <div className="flex justify-center">
              <div className="w-64 h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-grok to-ani animate-pulse w-full"></div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Awakening Grok & Ani...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}