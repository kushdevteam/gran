import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Shield, User, Hash } from "lucide-react";

// Registration schema
const registerSchema = z.object({
  profileName: z.string().min(2, "Profile name must be at least 2 characters"),
  solanaAddress: z.string().min(32, "Invalid Solana address format"),
  pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
  confirmPin: z.string(),
  faction: z.enum(["grok", "ani"]),
}).refine((data) => data.pin === data.confirmPin, {
  message: "PINs don't match",
  path: ["confirmPin"],
});

// Login schema
const loginSchema = z.object({
  solanaAddress: z.string().min(32, "Invalid Solana address format"),
  pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
});

type RegisterForm = z.infer<typeof registerSchema>;
type LoginForm = z.infer<typeof loginSchema>;

interface WalletAuthProps {
  onSuccess: (user: any) => void;
}

export function WalletAuth({ onSuccess }: WalletAuthProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const { toast } = useToast();

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      profileName: "",
      solanaAddress: "",
      pin: "",
      confirmPin: "",
      faction: "grok",
    },
  });

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      solanaAddress: "",
      pin: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const response = await apiRequest("POST", "/api/wallet/register", {
        profileName: data.profileName,
        solanaAddress: data.solanaAddress,
        pin: data.pin,
        faction: data.faction,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Registration Successful!",
        description: "Your wallet has been registered. You can now log in.",
      });
      setMode("login");
      loginForm.setValue("solanaAddress", registerForm.getValues("solanaAddress"));
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
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("POST", "/api/wallet/login", {
        solanaAddress: data.solanaAddress,
        pin: data.pin,
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

  const onRegisterSubmit = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  const onLoginSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  if (mode === "register") {
    return (
      <Card className="w-full max-w-md mx-auto" data-testid="card-wallet-register">
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
          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
              <FormField
                control={registerForm.control}
                name="profileName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Name</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Enter your display name" 
                        data-testid="input-profile-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="solanaAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Solana Address</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Enter your Solana wallet address" 
                        data-testid="input-solana-address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="faction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Choose Your Faction</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-faction">
                          <SelectValue placeholder="Select a faction" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="grok">🔵 Grok (Logic & Analysis)</SelectItem>
                        <SelectItem value="ani">🟣 Ani (Emotion & Creativity)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="pin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Create 4-Digit PIN</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="password" 
                        placeholder="Enter 4-digit PIN" 
                        maxLength={4}
                        data-testid="input-pin"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="confirmPin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm PIN</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="password" 
                        placeholder="Confirm your PIN" 
                        maxLength={4}
                        data-testid="input-confirm-pin"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={registerMutation.isPending}
                data-testid="button-register"
              >
                {registerMutation.isPending ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center">
            <Button 
              variant="link" 
              onClick={() => setMode("login")}
              data-testid="link-login"
            >
              Already have an account? Log in
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="card-wallet-login">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle>Wallet Login</CardTitle>
        <CardDescription>
          Enter your Solana address and PIN to access your account. No wallet connection required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...loginForm}>
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
            <FormField
              control={loginForm.control}
              name="solanaAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Solana Address</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Enter your Solana wallet address" 
                      data-testid="input-login-address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={loginForm.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PIN</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="password" 
                      placeholder="Enter your 4-digit PIN" 
                      maxLength={4}
                      data-testid="input-login-pin"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loginMutation.isPending}
              data-testid="button-login"
            >
              {loginMutation.isPending ? "Logging in..." : "Log In"}
            </Button>
          </form>
        </Form>

        <div className="mt-4 text-center">
          <Button 
            variant="link" 
            onClick={() => setMode("register")}
            data-testid="link-register"
          >
            Need an account? Register your wallet
          </Button>
        </div>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Your wallet address is used for identification only. No connection or signatures required.</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}