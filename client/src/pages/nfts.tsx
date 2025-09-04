import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, ShoppingCart, Plus, Gem, Trophy, Palette, Coins, TrendingUp, Filter, SortAsc } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { NFT } from "@shared/schema";

export default function NFTs() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRarity, setSelectedRarity] = useState<string>("all");
  const [selectedFaction, setSelectedFaction] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("price-low");
  const [sellPrice, setSellPrice] = useState("");
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);

  const { data: userNFTs = [], isLoading: userNFTsLoading } = useQuery<NFT[]>({
    queryKey: ["/api/nfts/user"],
    enabled: !!user,
  });

  const { data: marketplaceNFTs = [], isLoading: marketplaceLoading } = useQuery<NFT[]>({
    queryKey: ["/api/nfts/marketplace"],
  });

  // Enhanced NFT purchase mutation with GAC token integration
  const buyNFTMutation = useMutation({
    mutationFn: async ({ nftId, price }: { nftId: string; price: string }) => {
      const response = await apiRequest("POST", "/api/nfts/buy", { nftId, price });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nfts/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nfts/marketplace"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "NFT Purchased!",
        description: "NFT successfully added to your collection",
      });
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
        title: "Purchase Failed",
        description: error.message || "Failed to purchase NFT",
        variant: "destructive",
      });
    },
  });

  // NFT listing mutation
  const listNFTMutation = useMutation({
    mutationFn: async ({ nftId, price }: { nftId: string; price: string }) => {
      const response = await apiRequest("POST", "/api/nfts/list", { nftId, price });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nfts/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nfts/marketplace"] });
      setSelectedNFT(null);
      setSellPrice("");
      toast({
        title: "NFT Listed!",
        description: "Your NFT is now available in the marketplace",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Listing Failed",
        description: error.message || "Failed to list NFT",
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

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case "legendary": return <Trophy className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case "epic": return <Gem className="h-4 w-4 text-purple-500 animate-bounce" />;
      case "rare": return <Star className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <Palette className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary": return "border-yellow-500/70 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 shadow-lg shadow-yellow-500/25";
      case "epic": return "border-purple-500/70 bg-gradient-to-br from-purple-500/20 to-pink-500/20 shadow-lg shadow-purple-500/25";
      case "rare": return "border-blue-500/70 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 shadow-lg shadow-blue-500/25";
      default: return "border-gray-500/50 bg-gradient-to-br from-gray-500/10 to-slate-500/10";
    }
  };

  const getRarityMultiplier = (rarity: string): number => {
    switch (rarity) {
      case "legendary": return 10;
      case "epic": return 5;
      case "rare": return 2;
      default: return 1;
    }
  };

  const formatGAC = (amount: string | number): string => {
    return parseFloat(amount.toString()).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const getFactionColor = (faction: string) => {
    if (faction === "grok") return "text-grok";
    if (faction === "ani") return "text-ani";
    return "text-accent";
  };

  // Filtered and sorted marketplace NFTs
  const filteredMarketplaceNFTs = marketplaceNFTs
    .filter(nft => {
      if (selectedRarity !== "all" && nft.rarity !== selectedRarity) return false;
      if (selectedFaction !== "all" && nft.faction !== selectedFaction) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return parseFloat(a.price || "0") - parseFloat(b.price || "0");
        case "price-high":
          return parseFloat(b.price || "0") - parseFloat(a.price || "0");
        case "rarity":
          const rarityOrder = { "legendary": 4, "epic": 3, "rare": 2, "common": 1 };
          return (rarityOrder[b.rarity as keyof typeof rarityOrder] || 1) - (rarityOrder[a.rarity as keyof typeof rarityOrder] || 1);
        default:
          return 0;
      }
    });

  const handleBuyNFT = (nft: NFT) => {
    const userBalance = parseFloat(user?.gacBalance || "0");
    const nftPrice = parseFloat(nft.price || "0");
    
    if (userBalance < nftPrice) {
      toast({
        title: "Insufficient GAC Tokens",
        description: `You need ${formatGAC(nftPrice)} GAC tokens but only have ${formatGAC(userBalance)}`,
        variant: "destructive",
      });
      return;
    }
    
    // Show confirmation for expensive purchases
    if (nftPrice > 1000) {
      const confirmed = window.confirm(`Are you sure you want to purchase "${nft.name}" for ${formatGAC(nftPrice)} GAC tokens?`);
      if (!confirmed) return;
    }
    
    buyNFTMutation.mutate({ nftId: nft.id, price: nft.price || "0" });
  };

  const handleListNFT = () => {
    if (!selectedNFT || !sellPrice) return;
    
    const price = parseFloat(sellPrice);
    if (price <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price greater than 0",
        variant: "destructive",
      });
      return;
    }
    
    // Suggest reasonable pricing based on rarity
    const suggestedMin = getRarityMultiplier(selectedNFT.rarity) * 10;
    if (price < suggestedMin) {
      const confirmed = window.confirm(`This price seems low for a ${selectedNFT.rarity} NFT. Suggested minimum: ${suggestedMin} GAC. Continue anyway?`);
      if (!confirmed) return;
    }
    
    listNFTMutation.mutate({ nftId: selectedNFT.id, price: sellPrice });
  };

  // Collection statistics
  const getCollectionStats = () => {
    if (!userNFTs.length) return null;
    
    const rarityCount = userNFTs.reduce((acc, nft) => {
      acc[nft.rarity] = (acc[nft.rarity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const totalValue = userNFTs.reduce((sum, nft) => {
      if (nft.isForSale) return sum + parseFloat(nft.price || "0");
      return sum + (getRarityMultiplier(nft.rarity) * 25); // Estimated value
    }, 0);
    
    return { rarityCount, totalValue, totalNFTs: userNFTs.length };
  };

  const collectionStats = getCollectionStats();

  return (
    <div className="min-h-screen bg-background text-foreground">
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="font-orbitron text-3xl font-bold mb-4" data-testid="text-nfts-title">
            NFT Trading Hub
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Trade unique NFTs using GAC tokens. Each NFT grants special abilities, voting power, and faction bonuses.
          </p>
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="flex items-center gap-2 text-sm">
              <Coins className="h-4 w-4 text-accent" />
              <span>Balance: <span className="font-bold text-accent">{formatGAC(user?.gacBalance || 0)} GAC</span></span>
            </div>
            {collectionStats && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-blue-400" />
                  <span>Collection: <span className="font-bold text-blue-400">{collectionStats.totalNFTs} NFTs</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span>Est. Value: <span className="font-bold text-green-400">{formatGAC(collectionStats.totalValue)} GAC</span></span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* User NFTs Section */}
        <div className="mb-12">
          <h2 className="font-orbitron text-2xl font-bold mb-6" data-testid="text-your-nfts">
            Your Collection
          </h2>
          
          {userNFTsLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : userNFTs.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="user-nfts-grid">
              {userNFTs.map((nft: NFT) => (
                <Card 
                  key={nft.id} 
                  className={`${getRarityColor(nft.rarity)} border-2 hover:scale-105 transition-transform`}
                  data-testid={`nft-card-${nft.id}`}
                >
                  <CardHeader className="pb-2">
                    <div className="aspect-square rounded-lg mb-4 overflow-hidden bg-gradient-to-br from-muted to-card">
                      {nft.imageUrl ? (
                        <img 
                          src={nft.imageUrl} 
                          alt={nft.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {getRarityIcon(nft.rarity)}
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-base" data-testid={`nft-name-${nft.id}`}>
                      {nft.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-3" data-testid={`nft-description-${nft.id}`}>
                      {nft.description}
                    </p>
                    <div className="flex justify-between items-center text-xs mb-3">
                      <Badge variant="secondary" className={getFactionColor(nft.faction)}>
                        {nft.faction === "grok" ? "Grok" : nft.faction === "ani" ? "Ani" : "Neutral"}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {getRarityIcon(nft.rarity)}
                        <span className="capitalize">{nft.rarity}</span>
                      </div>
                    </div>
                    {!nft.isForSale && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full"
                            data-testid={`button-sell-nft-${nft.id}`}
                            onClick={() => setSelectedNFT(nft)}
                          >
                            <TrendingUp className="h-3 w-3 mr-1" />
                            List for Sale
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>List NFT for Sale</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="price">Price (GAC Tokens)</Label>
                              <Input
                                id="price"
                                type="number"
                                placeholder="Enter price..."
                                value={sellPrice}
                                onChange={(e) => setSellPrice(e.target.value)}
                                data-testid="input-sell-price"
                              />
                            </div>
                            <Button 
                              onClick={handleListNFT}
                              disabled={!sellPrice || listNFTMutation.isPending}
                              className="w-full"
                              data-testid="button-confirm-list"
                            >
                              {listNFTMutation.isPending ? "Listing..." : "List for Sale"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {/* Earn New NFT Card */}
              <Card className="border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-accent transition-colors min-h-[300px]" data-testid="earn-new-nft-card">
                <div className="text-center p-6">
                  <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="font-medium mb-2">Earn New NFT</p>
                  <p className="text-xs text-muted-foreground">Complete challenges to unlock rewards</p>
                </div>
              </Card>
            </div>
          ) : (
            <Card className="text-center p-12" data-testid="no-nfts-message">
              <div className="text-muted-foreground">
                <Star className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No NFTs Yet</h3>
                <p className="mb-4">Complete challenges and participate in story voting to earn your first NFT rewards.</p>
                <Button variant="outline" data-testid="button-start-earning">
                  Start Earning NFTs
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* NFT Marketplace Section */}
        <div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="font-orbitron text-2xl font-bold mb-4 md:mb-0" data-testid="text-marketplace">
              NFT Marketplace
            </h2>
            
            {/* Marketplace Filters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <Select value={selectedFaction} onValueChange={setSelectedFaction}>
                  <SelectTrigger className="w-32" data-testid="select-faction-filter">
                    <SelectValue placeholder="Faction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Factions</SelectItem>
                    <SelectItem value="grok">Grok</SelectItem>
                    <SelectItem value="ani">Ani</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Select value={selectedRarity} onValueChange={setSelectedRarity}>
                <SelectTrigger className="w-32" data-testid="select-rarity-filter">
                  <SelectValue placeholder="Rarity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rarities</SelectItem>
                  <SelectItem value="common">Common</SelectItem>
                  <SelectItem value="rare">Rare</SelectItem>
                  <SelectItem value="epic">Epic</SelectItem>
                  <SelectItem value="legendary">Legendary</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-2">
                <SortAsc className="h-4 w-4" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40" data-testid="select-sort">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rarity">Rarity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {marketplaceLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredMarketplaceNFTs.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="marketplace-nfts">
              {filteredMarketplaceNFTs.map((nft: NFT) => (
                <Card key={nft.id} className={`${getRarityColor(nft.rarity)} border-2 hover:scale-105 transition-transform`} data-testid={`marketplace-nft-${nft.id}`}>
                  <CardHeader className="pb-2">
                    <div className="aspect-square rounded-lg mb-4 overflow-hidden bg-gradient-to-br from-muted to-card">
                      {nft.imageUrl ? (
                        <img 
                          src={nft.imageUrl} 
                          alt={nft.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {getRarityIcon(nft.rarity)}
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-base" data-testid={`marketplace-nft-name-${nft.id}`}>
                      {nft.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-3" data-testid={`marketplace-nft-description-${nft.id}`}>
                      {nft.description}
                    </p>
                    <div className="flex justify-between items-center text-xs mb-4">
                      <Badge variant="secondary" className={getFactionColor(nft.faction)}>
                        {nft.faction === "grok" ? "Grok" : nft.faction === "ani" ? "Ani" : "Neutral"}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {getRarityIcon(nft.rarity)}
                        <span className="capitalize">{nft.rarity}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-card/50 rounded-lg p-3 border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground">Current Price</span>
                          <div className="flex items-center gap-1">
                            <Coins className="h-3 w-3 text-accent" />
                            <span className="text-sm font-bold text-accent" data-testid={`marketplace-nft-price-${nft.id}`}>
                              {formatGAC(nft.price || "0")}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Est. Value: {formatGAC(getRarityMultiplier(nft.rarity) * 25)}</span>
                          <span>{nft.rarity} × {getRarityMultiplier(nft.rarity)}</span>
                        </div>
                      </div>
                      
                      <Button 
                        size="sm" 
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 font-semibold shadow-lg"
                        onClick={() => handleBuyNFT(nft)}
                        disabled={buyNFTMutation.isPending || parseFloat(user?.gacBalance || "0") < parseFloat(nft.price || "0")}
                        data-testid={`button-buy-nft-${nft.id}`}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        {buyNFTMutation.isPending ? "Purchasing..." : 
                         parseFloat(user?.gacBalance || "0") < parseFloat(nft.price || "0") ? "Insufficient GAC" : "Purchase"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center p-12" data-testid="no-marketplace-nfts">
              <div className="text-muted-foreground">
                <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  {marketplaceNFTs.length === 0 ? "Marketplace Empty" : "No NFTs Match Filters"}
                </h3>
                <p>
                  {marketplaceNFTs.length === 0 ? 
                    "No NFTs are currently for sale. Check back later for new listings." :
                    "Try adjusting your filters to see more NFTs."}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}