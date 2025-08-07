import { authHelpers } from "@/config/firebase";
import { cookieUtils } from "@/utils/cookie.utils";
import { useEffect, useState } from "react";

interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => boolean;
}

export const useAuth = (): UseAuthReturn => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing admin authentication
  const checkAuth = (): boolean => {
    return cookieUtils.isAdminAuthenticated();
  };

  // Initialize anonymous authentication
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if already authenticated
        if (checkAuth()) {
          setIsAuthenticated(true);
          return;
        }

        // Initialize anonymous auth
        await authHelpers.signInAnonymously();
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Failed to sign in anonymously:", error);
        setError("Authentication failed");
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Listen for auth state changes
    const unsubscribe = authHelpers.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });

    initializeAuth();

    return unsubscribe;
  }, []);

  const login = async (password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
      if (password === adminPassword) {
        cookieUtils.setAdminAuth();
        setIsAuthenticated(true);
        return true;
      } else {
        setError("Invalid password");
        return false;
      }
    } catch (error) {
      setError("Login failed");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    cookieUtils.clearAdminAuth();
    setIsAuthenticated(false);
    setError(null);
  };

  return {
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    checkAuth,
  };
};
