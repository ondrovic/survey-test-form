/**
 * Authentication Type Definitions
 * 
 * Types for authentication context, user management, and authentication
 * state handling throughout the application.
 */

/**
 * Authentication context interface
 */
export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => boolean;
}

/**
 * Singleton class for managing authentication initialization state
 * Prevents double initialization in React StrictMode
 */
export class AuthInitializationState {
  private static instance: AuthInitializationState;
  private _inProgress = false;
  
  static getInstance(): AuthInitializationState {
    if (!AuthInitializationState.instance) {
      AuthInitializationState.instance = new AuthInitializationState();
    }
    return AuthInitializationState.instance;
  }
  
  get inProgress(): boolean {
    return this._inProgress;
  }
  
  set inProgress(value: boolean) {
    this._inProgress = value;
  }
}