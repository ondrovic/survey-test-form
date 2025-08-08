import { authHelpers } from "@/config/firebase";
import { cookieUtils } from "@/utils/cookie.utils";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (password: string) => Promise<boolean>;
    logout: () => void;
    checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check for existing admin authentication
    const checkAuth = (): boolean => {
        const isAuth = cookieUtils.isAdminAuthenticated();
        console.log("🔐 AuthContext - checkAuth():", { isAuth });
        return isAuth;
    };

    // Initialize authentication
    useEffect(() => {
        const initializeAuth = async () => {
            console.log("🚀 AuthContext - initializeAuth() started");
            try {
                setIsLoading(true);
                setError(null);

                // Check if admin is already authenticated via cookie
                const hasAdminAuth = checkAuth();
                console.log("🔍 AuthContext - Admin auth check:", { hasAdminAuth });

                if (hasAdminAuth) {
                    console.log("✅ AuthContext - Admin already authenticated, setting isAuthenticated = true");
                    setIsAuthenticated(true);
                } else {
                    console.log("👤 AuthContext - No admin auth, initializing anonymous auth for regular users");
                    // If not admin authenticated, initialize anonymous auth for regular users
                    // but don't set isAuthenticated to true for admin routes
                    await authHelpers.signInAnonymously();
                    console.log("👤 AuthContext - Anonymous auth initialized, setting isAuthenticated = false");
                    setIsAuthenticated(false); // Admin routes should not be accessible
                }
            } catch (error) {
                console.error("❌ AuthContext - Failed to sign in anonymously:", error);
                setError("Authentication failed");
                setIsAuthenticated(false);
            } finally {
                console.log("🏁 AuthContext - Setting isLoading = false");
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = async (password: string): Promise<boolean> => {
        console.log("🔑 AuthContext - login() called");
        try {
            setIsLoading(true);
            setError(null);

            const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
            console.log("🔑 AuthContext - Checking password against:", {
                hasPassword: !!adminPassword,
                passwordLength: adminPassword?.length
            });

            if (password === adminPassword) {
                console.log("✅ AuthContext - Password correct, setting admin auth");
                cookieUtils.setAdminAuth();
                setIsAuthenticated(true);
                return true;
            } else {
                console.log("❌ AuthContext - Invalid password");
                setError("Invalid password");
                return false;
            }
        } catch (error) {
            console.error("❌ AuthContext - Login failed:", error);
            setError("Login failed");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        console.log("🚪 AuthContext - logout() called");
        cookieUtils.clearAdminAuth();
        setIsAuthenticated(false);
        setError(null);
    };

    const contextValue: AuthContextType = {
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        checkAuth,
    };

    console.log("🔄 AuthContext - State update:", {
        isAuthenticated,
        isLoading,
        error: error ? error.substring(0, 50) + "..." : null
    });

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
