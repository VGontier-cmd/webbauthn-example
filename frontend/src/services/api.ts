/**
 * API service for communicating with the backend
 *
 * Centralizes all HTTP requests to the NestJS API.
 * Automatically handles errors and JSON formatting.
 *
 * @module services/api
 */
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/types";

// Backend API URL (from environment variables or localhost by default)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Interface representing a user
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  credentials?: Credential[];
}

/**
 * Interface representing a registered passkey
 */
export interface Credential {
  id: string;
  deviceType: string;
  createdAt: string;
}

/**
 * Data required for registration
 */
export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Data required for password login
 */
export interface LoginData {
  email: string;
  password: string;
}

/**
 * API service singleton
 *
 * Provides methods for all authentication operations:
 * - Classic registration and login
 * - Passkey management (registration, authentication, deletion)
 */
class ApiService {
  /**
   * Generic method to perform HTTP requests
   *
   * @param endpoint - Endpoint path (e.g., "/auth/login")
   * @param options - Fetch request options (method, body, etc.)
   * @returns Promise resolved with JSON data
   * @throws Error if the request fails
   *
   * @private
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    // HTTP error handling
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "An error occurred" }));
      throw new Error(error.message || "Request failed");
    }

    return response.json();
  }

  /**
   * Register a new user
   *
   * @param data - Registration data (email, password, firstName, lastName)
   * @returns Created user (without password)
   */
  async register(data: RegisterData): Promise<User> {
    return this.request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Login with email and password
   *
   * @param data - Email and password
   * @returns Logged in user
   */
  async login(data: LoginData): Promise<User> {
    return this.request<User>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Get user information by ID
   *
   * @param userId - Unique user ID
   * @returns User with registered passkeys
   */
  async getUser(userId: string): Promise<User> {
    return this.request<User>(`/auth/user/${userId}`);
  }

  /**
   * Generate registration options for a new passkey
   *
   * Backend generates a unique challenge and returns the options
   * needed to create a new passkey.
   *
   * @param userId - ID of the user registering the passkey
   * @returns WebAuthn options for registration
   */
  async generateRegistrationOptions(userId: string) {
    return this.request<PublicKeyCredentialCreationOptionsJSON>(
      `/auth/webauthn/register/options/${userId}`,
      {
        method: "POST",
      }
    );
  }

  /**
   * Verify registration of a new passkey
   *
   * After the authenticator has created the passkey and signed the challenge,
   * this method sends the response to the backend for verification.
   *
   * @param userId - User ID
   * @param response - Attestation response from the authenticator
   * @param deviceType - Device type (iOS, Android, Desktop)
   */
  async verifyRegistration(userId: string, response: any, deviceType?: string) {
    return this.request(`/auth/webauthn/register/verify/${userId}`, {
      method: "POST",
      body: JSON.stringify({ response, deviceType }),
    });
  }

  /**
   * Generate authentication options to test a passkey
   * (from the dashboard)
   *
   * @param userId - User ID
   * @returns WebAuthn options for authentication
   */
  async generateAuthenticationOptions(userId: string) {
    return this.request<PublicKeyCredentialRequestOptionsJSON>(
      `/auth/webauthn/authenticate/options/${userId}`,
      {
        method: "POST",
      }
    );
  }

  /**
   * Verify authentication with a passkey (from the dashboard)
   *
   * @param userId - User ID
   * @param response - Assertion response from the authenticator
   */
  async verifyAuthentication(userId: string, response: any) {
    return this.request(`/auth/webauthn/authenticate/verify/${userId}`, {
      method: "POST",
      body: JSON.stringify({ response }),
    });
  }

  /**
   * Delete a registered passkey
   *
   * @param userId - User ID
   * @param credentialId - ID of the passkey to delete
   */
  async deleteCredential(userId: string, credentialId: string) {
    return this.request(`/auth/webauthn/credential/${userId}/${credentialId}`, {
      method: "POST",
    });
  }

  /**
   * Generate authentication options for passkey login
   *
   * Used during login: backend finds the user by email,
   * retrieves their passkeys, and generates a unique challenge.
   *
   * @param email - User email
   * @returns WebAuthn options containing the challenge and authorized credential IDs
   */
  async generateLoginOptions(email: string) {
    return this.request<PublicKeyCredentialRequestOptionsJSON>(
      "/auth/webauthn/login/options",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      }
    );
  }

  /**
   * Verify authentication during passkey login
   *
   * After the authenticator has signed the challenge, this method
   * sends the signature to the backend for verification.
   * Backend verifies the signature with the stored public key.
   *
   * @param email - User email
   * @param response - Assertion response signed by the authenticator
   * @returns Logged in user
   */
  async verifyLogin(email: string, response: any): Promise<User> {
    const result = await this.request<{ verified: boolean; user: User }>(
      "/auth/webauthn/login/verify",
      {
        method: "POST",
        body: JSON.stringify({ email, response }),
      }
    );
    // Extract user from response (which also contains "verified")
    return result.user;
  }
}

// Exported singleton instance
export const api = new ApiService();
