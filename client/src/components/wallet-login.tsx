import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wallet, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface WalletLoginProps {
  onSuccess?: () => void;
}

export default function WalletLogin({ onSuccess }: WalletLoginProps) {
  const [walletAddress, setWalletAddress] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const { toast } = useToast();

  const validateMutation = useMutation({
    mutationFn: async (address: string) => {
      const response = await apiRequest("POST", "/api/wallet/validate", {
        address
      });
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('Wallet validation response:', data);
      setAccountInfo(data);
      if (data.isValid) {
        toast({
          title: "Wallet Validated",
          description: `Balance: ${data.balance} SOL • Account verified successfully`,
        });
      } else {
        toast({
          title: "Invalid Wallet",
          description: data.message || "Please check your Solana address and try again",
          variant: "destructive"
        });
      }
    },
    onError: () => {
      toast({
        title: "Validation Failed",
        description: "Unable to validate wallet. Please try again.",
        variant: "destructive"
      });
    }
  });

  const loginMutation = useMutation({
    mutationFn: async (address: string) => {
      const response = await apiRequest("POST", "/api/wallet/login", {
        address
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Login Successful",
        description: "Welcome to Grok & Ani!",
      });
      setIsDialogOpen(false);
      onSuccess?.();
      // Reload to get authenticated state
      setTimeout(() => window.location.reload(), 1000);
    },
    onError: () => {
      toast({
        title: "Login Failed",
        description: "Unable to log in with this wallet. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleValidate = () => {
    if (!walletAddress.trim()) {
      toast({
        title: "Address Required",
        description: "Please enter your Solana wallet address",
        variant: "destructive"
      });
      return;
    }
    validateMutation.mutate(walletAddress.trim());
  };

  const handleLogin = () => {
    if (accountInfo?.isValid) {
      loginMutation.mutate(walletAddress.trim());
    }
  };

  const resetForm = () => {
    setWalletAddress("");
    setAccountInfo(null);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => {
      setIsDialogOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full border-2 border-dashed border-purple-500/30 hover:border-purple-500/60 transition-colors"
          data-testid="button-wallet-login"
        >
          <Wallet className="h-4 w-4 mr-2" />
          Connect Solana Wallet
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect Solana Wallet
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Solana Wallet Address
            </label>
            <Input
              placeholder="Enter your Solana address (e.g., 7cVfg...xkxXy)"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="font-mono text-sm"
              data-testid="input-wallet-address"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Paste your Solana wallet address to connect
            </p>
          </div>

          {!accountInfo && (
            <Button 
              onClick={handleValidate}
              disabled={validateMutation.isPending || !walletAddress.trim()}
              className="w-full"
              data-testid="button-validate-wallet"
            >
              {validateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                "Validate Wallet"
              )}
            </Button>
          )}

          {accountInfo && (
            <Card className={`border-2 ${accountInfo.isValid ? "border-green-500" : "border-red-500"}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {accountInfo.isValid ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">
                      {accountInfo.isValid ? "Wallet Verified" : "Invalid Wallet"}
                    </h4>
                    {accountInfo.isValid ? (
                      <div className="text-sm text-muted-foreground space-y-1 mt-1">
                        <p>Balance: {accountInfo.balance} SOL</p>
                        <p>Status: {accountInfo.exists ? "Active Account" : "Empty Account"}</p>
                        <p className="text-xs font-mono break-all">
                          {walletAddress}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">
                        Please check your address format and try again
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {accountInfo?.isValid && (
            <div className="space-y-3">
              <Button 
                onClick={handleLogin}
                disabled={loginMutation.isPending}
                className="w-full bg-gradient-to-r from-grok to-ani text-white hover:from-grok/90 hover:to-ani/90"
                data-testid="button-connect-wallet"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect & Enter Platform"
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={resetForm}
                className="w-full"
                data-testid="button-try-different-wallet"
              >
                Try Different Wallet
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center">
            <p>
              Your wallet address will be used to verify ownership and enable GAC token features. 
              No private keys are stored or transmitted.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}