import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import FactionSelector from "./faction-selector";
import NotificationCenter from "./notifications";
import { Menu, X, Home, Brain, BookOpen, Trophy, Users, Vote, Palette, FileText, BarChart3, LogOut } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false);

  // Check if running in Telegram WebApp
  useEffect(() => {
    setIsTelegramWebApp(!!(window as any).Telegram?.WebApp);
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Default colors (no authentication needed)
  const factionColors = {
    accent: "text-grok",
    accentHover: "hover:text-grok",
    bg: "bg-grok/10",
    border: "border-grok/20"
  };

  // Organized navigation items with icons
  const navItems = {
    main: [
      { href: "/dashboard", label: "Dashboard", icon: Home },
      { href: "/ai-portal", label: "AI Portal", icon: Brain },
      { href: "/storychain", label: "StoryChain", icon: BookOpen },
      { href: "/nfts", label: "NFTs", icon: Palette },
    ],
    secondary: [
      { href: "/leaderboards", label: "Rankings", icon: BarChart3 },
      { href: "/governance", label: "Governance", icon: Vote },
      { href: "/community", label: "Community", icon: Users },
      { href: "/whitepaper", label: "Whitepaper", icon: FileText },
      { href: "#logout", label: "Logout", icon: LogOut },
    ]
  };

  // Mobile bottom navigation items (most important)
  const mobileBottomNavItems = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/ai-portal", label: "AI", icon: Brain },
    { href: "/storychain", label: "Story", icon: BookOpen },
    { href: "/leaderboards", label: "Ranks", icon: Trophy },
  ];

  const handleBackToLanding = () => {
    window.location.href = "/";
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <>
      {/* Desktop/Tablet Navigation */}
      <header className={`sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border ${
        isTelegramWebApp ? 'pt-safe-area-inset-top' : ''
      }`}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className={`font-orbitron text-xl font-bold ${factionColors.accent}`} data-testid="link-home">
              GAC
            </Link>
            
            {/* Desktop Navigation - Organized Groups */}
            <nav className="hidden lg:flex space-x-1">
              {navItems.main.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                      location === item.href
                        ? `${factionColors.bg} ${factionColors.accent} shadow-sm`
                        : `text-foreground hover:bg-muted ${factionColors.accentHover}`
                    }`}
                    data-testid={`link-${item.label.toLowerCase().replace(" ", "-")}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
              
              {/* More menu for secondary items */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Menu className="h-4 w-4" />
                    <span className="text-sm">More</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="space-y-6 pt-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-4">Navigation</h3>
                      <div className="space-y-2">
                        {navItems.secondary.map((item) => {
                          const Icon = item.icon;
                          
                          if (item.href === "#logout") {
                            return (
                              <button
                                key={item.href}
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-3 py-3 rounded-lg transition-all hover:bg-muted w-full text-left"
                                data-testid="button-logout"
                              >
                                <Icon className="h-5 w-5" />
                                <span>{item.label}</span>
                              </button>
                            );
                          }
                          
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                                location === item.href
                                  ? `${factionColors.bg} ${factionColors.accent}`
                                  : `hover:bg-muted`
                              }`}
                            >
                              <Icon className="h-5 w-5" />
                              <span>{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </nav>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Stats - Compact on mobile, full on desktop */}
            <div className={`flex items-center space-x-2 text-sm ${
              isMobile ? 'bg-muted px-3 py-1.5 rounded-lg' : ''
            }`}>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-xs">GAC:</span>
                <span className={`font-semibold text-sm ${factionColors.accent}`}>0.00</span>
              </div>
              <div className="hidden sm:block text-muted-foreground">|</div>
              <div className="hidden sm:flex items-center gap-1">
                <span className="text-muted-foreground text-xs">Lvl:</span>
                <span className={`font-semibold text-sm ${factionColors.accent}`}>1</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <NotificationCenter />
              <FactionSelector />
              
              {/* Mobile menu button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden p-2"
                    data-testid="button-mobile-menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-0">
                  <div className="p-6">
                    <h2 className="font-semibold text-lg mb-6">Navigation</h2>
                    
                    <div className="space-y-1 mb-8">
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Main</h3>
                      {navItems.main.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                              location === item.href
                                ? `${factionColors.bg} ${factionColors.accent} shadow-sm`
                                : `hover:bg-muted`
                            }`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="font-medium">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">More</h3>
                      {navItems.secondary.map((item) => {
                        const Icon = item.icon;
                        
                        if (item.href === "#logout") {
                          return (
                            <button
                              key={item.href}
                              onClick={() => {
                                handleLogout();
                                setMobileMenuOpen(false);
                              }}
                              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-muted w-full text-left"
                              data-testid="button-logout-mobile"
                            >
                              <Icon className="h-5 w-5" />
                              <span className="font-medium">{item.label}</span>
                            </button>
                          );
                        }
                        
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                              location === item.href
                                ? `${factionColors.bg} ${factionColors.accent} shadow-sm`
                                : `hover:bg-muted`
                            }`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="font-medium">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-border">
                      <Button
                        onClick={() => {
                          handleBackToLanding();
                          setMobileMenuOpen(false);
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        Back to Landing
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className={`fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border ${
          isTelegramWebApp ? 'pb-safe-area-inset-bottom' : 'pb-2'
        }`}>
          <div className="flex items-center justify-around px-2 pt-2">
            {mobileBottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all touch-manipulation ${
                    isActive
                      ? `${factionColors.accent}`
                      : 'text-muted-foreground'
                  }`}
                  data-testid={`bottom-nav-${item.label.toLowerCase()}`}
                >
                  <Icon className={`h-5 w-5 ${
                    isActive ? 'scale-110' : ''
                  } transition-transform`} />
                  <span className="text-xs font-medium">{item.label}</span>
                  {isActive && (
                    <div className={`w-1 h-1 rounded-full ${factionColors.bg.replace('/10', '')}`} />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Add bottom padding when mobile bottom nav is present */}
      {isMobile && <div className="h-20" />}
    </>
  );
}
