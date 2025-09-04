import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Wallet, User } from "lucide-react";

interface WalletAuthProps {
  onSuccess: (user: any) => void;
}

export function SimpleWalletAuth({ onSuccess }: WalletAuthProps) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [profileName, setProfileName] = useState("");
  const [solanaAddress, setSolanaAddress] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [faction, setFaction] = useState("grok");
  const { toast } = useToast();

  const registerMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/wallet/register", {
        profileName,
        solanaAddress,
        pin,
        faction,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Registration Successful!",
        description: "Your wallet has been registered. You can now log in.",
      });
      setMode("login");
      // Clear form except address
      setProfileName("");
      setPin("");
      setConfirmPin("");
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register wallet",
        variant: "destructive",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/wallet/login", {
        solanaAddress,
        pin,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Login Successful!",
        description: `Welcome back, ${data.user.profileName}!`,
      });
      localStorage.setItem("walletUser", JSON.stringify(data.user));
      onSuccess(data.user);
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed", 
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileName || !solanaAddress || !pin || !confirmPin) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (pin !== confirmPin) {
      toast({
        title: "PIN Mismatch",
        description: "PINs don't match",
        variant: "destructive",
      });
      return;
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be exactly 4 digits",
        variant: "destructive",
      });
      return;
    }

    if (solanaAddress.length < 32) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Solana address",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate();
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!solanaAddress || !pin) {
      toast({
        title: "Missing Fields",
        description: "Please enter your address and PIN",
        variant: "destructive",
      });
      return;
    }

    loginMutation.mutate();
  };

  if (mode === "register") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <User className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle>Create Wallet Account</CardTitle>
          <CardDescription>
            Register with your Solana address and create a secure PIN. No wallet connection required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <Label htmlFor="profileName">Profile Name</Label>
              <Input 
                id="profileName"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Enter your display name" 
                required
              />
            </div>

            <div>
              <Label htmlFor="solanaAddress">Solana Address</Label>
              <Input 
                id="solanaAddress"
                value={solanaAddress}
                onChange={(e) => setSolanaAddress(e.target.value)}
                placeholder="Enter your Solana wallet address" 
                required
              />
            </div>

            <div>
              <Label htmlFor="faction">Choose Your Faction</Label>
              <Select value={faction} onValueChange={setFaction}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a faction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grok">🔵 Grok (Logic & Analysis)</SelectItem>
                  <SelectItem value="ani">🟣 Ani (Emotion & Creativity)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pin">Create 4-Digit PIN</Label>
              <Input 
                id="pin"
                type="password" 
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter 4-digit PIN" 
                maxLength={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="confirmPin">Confirm PIN</Label>
              <Input 
                id="confirmPin"
                type="password" 
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Confirm your PIN" 
                maxLength={4}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-grok to-ani text-white hover:from-grok/90 hover:to-ani/90 transition-all duration-300 transform hover:scale-105" 
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button 
              variant="link" 
              onClick={() => setMode("login")}
            >
              Already have an account? Log in
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle>Wallet Login</CardTitle>
        <CardDescription>
          Enter your Solana address and PIN to access your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <Label htmlFor="loginAddress">Solana Address</Label>
            <Input 
              id="loginAddress"
              value={solanaAddress}
              onChange={(e) => setSolanaAddress(e.target.value)}
              placeholder="Enter your Solana wallet address" 
              required
            />
          </div>

          <div>
            <Label htmlFor="loginPin">PIN</Label>
            <Input 
              id="loginPin"
              type="password" 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter your 4-digit PIN" 
              maxLength={4}
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-grok to-ani text-white hover:from-grok/90 hover:to-ani/90 transition-all duration-300 transform hover:scale-105" 
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Logging in..." : "Log In"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Button 
            variant="link" 
            onClick={() => setMode("register")}
          >
            Need an account? Register your wallet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}