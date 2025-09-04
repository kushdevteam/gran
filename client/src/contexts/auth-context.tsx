import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "../lib/queryClient";

interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  login: (user: any) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check session-based authentication on app start
    checkAuthSession();
  }, []);

  const checkAuthSession = async () => {
    try {
      setIsLoading(true);
      // Try to fetch user from session-based endpoint
      const userData = await apiRequest("GET", "/api/auth/user");
      setUser(userData);
      localStorage.setItem("walletUser", JSON.stringify(userData));
    } catch (error) {
      // If server session fails, clear any stale localStorage data
      console.log("No valid session found, redirecting to login");
      localStorage.removeItem("walletUser");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: any) => {
    // Don't set user immediately - wait for session verification
    localStorage.setItem("walletUser", JSON.stringify(userData));
    
    // Wait for session to be saved, then verify it works
    setTimeout(async () => {
      try {
        setIsLoading(true);
        const verifiedUser = await apiRequest("GET", "/api/auth/user");
        setUser(verifiedUser);
        console.log("Session verified successfully, user authenticated");
      } catch (error) {
        console.error("Session verification failed:", error);
        localStorage.removeItem("walletUser");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }, 1000); // Longer delay to ensure session cookie is transmitted
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("walletUser");
  };

  const isAuthenticated = !!user;

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}