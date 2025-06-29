const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Solana API methods
  async getBalance(publicKey: string): Promise<ApiResponse<{ balance: number; publicKey: string; timestamp: number }>> {
    return this.request(`/api/solana/balance/${publicKey}`);
  }

  async getAccountInfo(publicKey: string): Promise<ApiResponse<{ accountInfo: any; publicKey: string; timestamp: number }>> {
    return this.request(`/api/solana/account/${publicKey}`);
  }

  async getTransaction(signature: string): Promise<ApiResponse<{ transaction: any; signature: string; timestamp: number }>> {
    return this.request(`/api/solana/transaction/${signature}`);
  }

  async getSolanaStatus(): Promise<ApiResponse<{ solana: any; websocket: any; timestamp: number }>> {
    return this.request('/api/solana/status');
  }

  async clearSolanaCache(): Promise<ApiResponse<{ message: string; timestamp: number }>> {
    return this.request('/api/solana/clear-cache', { method: 'POST' });
  }

  // Contract API methods
  async createContract(contractData: any): Promise<ApiResponse<any>> {
    return this.request('/api/contracts', {
      method: 'POST',
      body: JSON.stringify(contractData),
    });
  }

  async getContract(contractId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/contracts/${contractId}`);
  }

  async signContract(contractId: string, signatureData: any): Promise<ApiResponse<any>> {
    return this.request(`/api/contracts/${contractId}/sign`, {
      method: 'POST',
      body: JSON.stringify(signatureData),
    });
  }

  async getUserContracts(publicKey: string): Promise<ApiResponse<any>> {
    return this.request(`/api/contracts/user/${publicKey}`);
  }

  // User API methods
  async createUser(userData: any): Promise<ApiResponse<any>> {
    return this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUser(publicKey: string): Promise<ApiResponse<any>> {
    return this.request(`/api/users/${publicKey}`);
  }

  // Health check
  async getHealth(): Promise<ApiResponse<any>> {
    return this.request('/api/health');
  }

  // Generic methods for custom requests
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
