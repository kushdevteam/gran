import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import Navigation from "@/components/navigation";
import NotFound from "@/pages/not-found";
import LoadingScreen from "./components/loading-screen";
import Landing from "./pages/landing";
import Home from "./pages/home";
import Dashboard from "./pages/dashboard";
import AiPortal from "./pages/ai-portal";
import StoryChain from "./pages/storychain";
import Nfts from "./pages/nfts";
import Community from "./pages/community";
import Whitepaper from "./pages/whitepaper";
import Leaderboards from "./pages/leaderboards";
import Governance from "./pages/governance";

function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public routes - accessible without authentication */}
      <Route path="/whitepaper" component={Whitepaper} />
      
      {/* Protected routes - require authentication */}
      <Route path="*">
        {isLoading ? (
          <LoadingScreen />
        ) : !isAuthenticated ? (
          <Landing />
        ) : (
          <Switch>
            {/* Main app pages with navigation */}
            <Route path="/">
              <div className="min-h-screen bg-background">
                <Navigation />
                <main>
                  <Home />
                </main>
              </div>
            </Route>
            
            <Route path="/home">
              <div className="min-h-screen bg-background">
                <Navigation />
                <main>
                  <Home />
                </main>
              </div>
            </Route>
            
            <Route path="/dashboard">
              <div className="min-h-screen bg-background">
                <Navigation />
                <main>
                  <Dashboard />
                </main>
              </div>
            </Route>
            
            <Route path="/ai-portal">
              <div className="min-h-screen bg-background">
                <Navigation />
                <main>
                  <AiPortal />
                </main>
              </div>
            </Route>
            
            <Route path="/storychain">
              <div className="min-h-screen bg-background">
                <Navigation />
                <main>
                  <StoryChain />
                </main>
              </div>
            </Route>
            
            <Route path="/nfts">
              <div className="min-h-screen bg-background">
                <Navigation />
                <main>
                  <Nfts />
                </main>
              </div>
            </Route>
            
            <Route path="/community">
              <div className="min-h-screen bg-background">
                <Navigation />
                <main>
                  <Community />
                </main>
              </div>
            </Route>
            
            <Route path="/leaderboards">
              <div className="min-h-screen bg-background">
                <Navigation />
                <main>
                  <Leaderboards />
                </main>
              </div>
            </Route>
            
            <Route path="/governance">
              <div className="min-h-screen bg-background">
                <Navigation />
                <main>
                  <Governance />
                </main>
              </div>
            </Route>
            
            {/* 404 page */}
            <Route component={NotFound} />
          </Switch>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <AppRouter />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;