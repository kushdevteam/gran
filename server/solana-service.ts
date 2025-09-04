interface SolanaAccountInfo {
  exists: boolean;
  balance: number; // in SOL
  lamports: number; // raw balance
  owner: string;
  data?: any;
}

export class SolanaService {
  private readonly rpcUrl = "https://api.mainnet-beta.solana.com";

  async validateSolanaAddress(address: string): Promise<boolean> {
    try {
      // Basic format validation (base58, correct length)
      // Solana addresses are typically 32-44 characters long
      if (!address || typeof address !== 'string' || address.length < 32 || address.length > 44) {
        return false;
      }

      // Check if address contains only valid base58 characters (Bitcoin base58 alphabet)
      const base58Pattern = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
      if (!base58Pattern.test(address)) {
        return false;
      }

      // Additional check: most Solana addresses are exactly 44 characters or 43 characters
      if (address.length < 43 || address.length > 44) {
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error validating Solana address:", error);
      return false;
    }
  }

  async getAccountInfo(address: string): Promise<SolanaAccountInfo | null> {
    try {
      if (!this.validateSolanaAddress(address)) {
        return null;
      }

      const response = await fetch(this.rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getAccountInfo",
          params: [
            address,
            {
              encoding: "base64",
              commitment: "confirmed"
            }
          ]
        })
      });

      const data = await response.json();

      if (data.error) {
        console.error("Solana RPC error:", data.error);
        return null;
      }

      const accountInfo = data.result?.value;
      
      if (!accountInfo) {
        // Account doesn't exist, but that's valid for empty wallets
        return {
          exists: false,
          balance: 0,
          lamports: 0,
          owner: "",
          data: null
        };
      }

      const lamports = accountInfo.lamports || 0;
      const balance = lamports / 1_000_000_000; // Convert lamports to SOL

      return {
        exists: true,
        balance,
        lamports,
        owner: accountInfo.owner,
        data: accountInfo.data
      };
    } catch (error) {
      console.error("Error fetching account info:", error);
      return null;
    }
  }

  async getBalance(address: string): Promise<number | null> {
    try {
      if (!this.validateSolanaAddress(address)) {
        return null;
      }

      const response = await fetch(this.rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getBalance",
          params: [address, { commitment: "confirmed" }]
        })
      });

      const data = await response.json();

      if (data.error) {
        console.error("Solana RPC error:", data.error);
        return null;
      }

      const lamports = data.result?.value || 0;
      return lamports / 1_000_000_000; // Convert to SOL
    } catch (error) {
      console.error("Error fetching balance:", error);
      return null;
    }
  }

  async verifyWalletOwnership(address: string): Promise<boolean> {
    try {
      const accountInfo = await this.getAccountInfo(address);
      
      // For now, we just verify the address is valid and can be queried
      // In a production system, you might want to implement signature verification
      return accountInfo !== null;
    } catch (error) {
      console.error("Error verifying wallet ownership:", error);
      return false;
    }
  }
}

export const solanaService = new SolanaService();