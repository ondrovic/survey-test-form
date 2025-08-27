import { authHelpers, initializeDatabase, retryDatabaseInitialization } from "@/config/database";
import { logCriticalError } from "@/utils/error-logging.utils";
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

// Global singleton state to prevent double initialization in StrictMode
class AuthInitializationState {
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

const authState = AuthInitializationState.getInstance();

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
        let isMounted = true; // Prevent state updates if component unmounts
        
        const initializeAuth = async () => {
            // Prevent double initialization in React StrictMode
            if (authState.inProgress) {
                console.log("🚀 AuthContext - initializeAuth() already in progress, skipping");
                return;
            }
            
            authState.inProgress = true;
            console.log("🚀 AuthContext - initializeAuth() started");
            try {
                setIsLoading(true);
                setError(null);

                // Initialize database service first with retry logic
                try {
                    await retryDatabaseInitialization();
                } catch (dbError) {
                    console.error("❌ AuthContext - Database initialization failed after retries:", dbError);
                    await logCriticalError(
                        "Database initialization failed after retries in AuthContext", 
                        dbError instanceof Error ? dbError : new Error(String(dbError)),
                        'AuthProvider',
                        'Database initialization'
                    );
                    // Try once more with the regular method in case it's a transient issue
                    await initializeDatabase();
                }

                // Only proceed if component is still mounted
                if (!isMounted) return;

                // Check if admin is already authenticated via cookie
                const hasAdminAuth = checkAuth();
                console.log("🔍 AuthContext - Admin auth check:", { hasAdminAuth });

                if (hasAdminAuth) {
                    console.log("✅ AuthContext - Admin already authenticated, setting isAuthenticated = true");
                    if (isMounted) setIsAuthenticated(true);
                } else {
                    console.log("👤 AuthContext - No admin auth, initializing anonymous auth for regular users");
                    // If not admin authenticated, initialize anonymous auth for regular users
                    // but don't set isAuthenticated to true for admin routes
                    await authHelpers.signInAnonymously();
                    console.log("👤 AuthContext - Anonymous auth initialized, setting isAuthenticated = false");
                    if (isMounted) setIsAuthenticated(false); // Admin routes should not be accessible
                }
            } catch (error) {
                console.error("❌ AuthContext - Failed to initialize:", error);
                
                if (!isMounted) return;
                
                // Provide user-friendly error messages
                if (error instanceof Error) {
                    if (error.message.includes('Database tables not found')) {
                        setError("Database not set up. Please contact administrator.");
                    } else if (error.message.includes('Connection test timeout')) {
                        setError("Database connection timeout. Please check your internet connection.");
                    } else {
                        setError("Authentication failed. Please try refreshing the page.");
                    }
                } else {
                    setError("Authentication failed");
                }
                setIsAuthenticated(false);
            } finally {
                if (isMounted) {
                    console.log("🏁 AuthContext - Setting isLoading = false");
                    setIsLoading(false);
                }
                authState.inProgress = false;
            }
        };

        initializeAuth();
        
        // Cleanup function to prevent state updates if component unmounts
        return () => {
            isMounted = false;
            authState.inProgress = false;
        };
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

    // Only log significant state changes, not every render
    // console.log("🔄 AuthContext - State update:", {
    //     isAuthenticated,
    //     isLoading,
    //     error: error ? error.substring(0, 50) + "..." : null
    // });

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
