import { authHelpers, initializeDatabase, retryDatabaseInitialization } from "@/config/database";
import { logCriticalError } from "@/utils/error-logging.utils";
import { ErrorLoggingService } from '@/services/error-logging.service';
import { cookieUtils } from "@/utils/cookie.utils";
import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthContextType, AuthInitializationState } from '@/types';

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

const authState = AuthInitializationState.getInstance();

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check for existing admin authentication
    const checkAuth = (): boolean => {
        const isAuth = cookieUtils.isAdminAuthenticated();
        return isAuth;
    };

    // Initialize authentication
    useEffect(() => {
        let isMounted = true; // Prevent state updates if component unmounts
        
        const initializeAuth = async () => {
            // Prevent double initialization in React StrictMode
            if (authState.inProgress) {
                return;
            }
            
            authState.inProgress = true;
            try {
                setIsLoading(true);
                setError(null);

                // Initialize database service first with retry logic
                try {
                    await retryDatabaseInitialization();
                } catch (dbError) {
                    await logCriticalError(
                        "Database initialization failed after retries in AuthContext", 
                        dbError instanceof Error ? dbError : new Error(String(dbError)),
                        'AuthProvider',
                        'Database initialization'
                    );
                    
                    // Add ErrorLoggingService logging for database initialization failure
                    await ErrorLoggingService.logError({
                        severity: 'critical',
                        errorMessage: 'Database initialization failed after retries during auth initialization',
                        stackTrace: dbError instanceof Error ? dbError.stack : String(dbError),
                        componentName: 'AuthContext',
                        functionName: 'initializeAuth',
                        userAction: 'initializing authentication and database',
                        additionalContext: {
                            authInProgress: authState.inProgress,
                            retryAttempted: true,
                            errorType: dbError instanceof Error ? dbError.constructor.name : 'Unknown'
                        },
                        tags: ['authentication', 'auth-context', 'database-initialization', 'critical-failure']
                    });
                    
                    // Try once more with the regular method in case it's a transient issue
                    try {
                        await initializeDatabase();
                    } catch (finalDbError) {
                        // Log the final database initialization failure
                        await ErrorLoggingService.logError({
                            severity: 'critical',
                            errorMessage: 'Final database initialization attempt failed after retry failure',
                            stackTrace: finalDbError instanceof Error ? finalDbError.stack : String(finalDbError),
                            componentName: 'AuthContext',
                            functionName: 'initializeAuth',
                            userAction: 'final database initialization attempt',
                            additionalContext: {
                                authInProgress: authState.inProgress,
                                retryAttempted: true,
                                fallbackAttempted: true,
                                errorType: finalDbError instanceof Error ? finalDbError.constructor.name : 'Unknown',
                                originalError: dbError instanceof Error ? dbError.message : String(dbError)
                            },
                            tags: ['authentication', 'auth-context', 'database-initialization', 'fallback-failure', 'critical']
                        });
                        // Re-throw to be caught by the outer catch block
                        throw finalDbError;
                    }
                }

                // Only proceed if component is still mounted
                if (!isMounted) return;

                // Check if admin is already authenticated via cookie
                const hasAdminAuth = checkAuth();
        
                if (hasAdminAuth) {
                    if (isMounted) setIsAuthenticated(true);
                } else {
                    // If not admin authenticated, initialize anonymous auth for regular users
                    // but don't set isAuthenticated to true for admin routes
                    try {
                        await authHelpers.signInAnonymously();
                        if (isMounted) setIsAuthenticated(false); // Admin routes should not be accessible
                    } catch (anonError) {
                        // Log anonymous authentication failure
                        await ErrorLoggingService.logError({
                            severity: 'medium',
                            errorMessage: 'Anonymous authentication failed during auth initialization',
                            stackTrace: anonError instanceof Error ? anonError.stack : String(anonError),
                            componentName: 'AuthContext',
                            functionName: 'initializeAuth',
                            userAction: 'initializing anonymous authentication for regular users',
                            additionalContext: {
                                authInProgress: authState.inProgress,
                                isMounted,
                                hasAdminAuth: false,
                                errorType: anonError instanceof Error ? anonError.constructor.name : 'Unknown'
                            },
                            tags: ['authentication', 'auth-context', 'anonymous-auth-failure', 'medium-severity']
                        });
                        // Re-throw to be caught by the outer catch block
                        throw anonError;
                    }
                }
            } catch (error) {        
                if (!isMounted) return;
                
                // Add ErrorLoggingService logging for auth initialization failure
                await ErrorLoggingService.logError({
                    severity: 'high',
                    errorMessage: 'Authentication initialization failed',
                    stackTrace: error instanceof Error ? error.stack : String(error),
                    componentName: 'AuthContext',
                    functionName: 'initializeAuth',
                    userAction: 'initializing authentication system',
                    additionalContext: {
                        authInProgress: authState.inProgress,
                        isMounted,
                        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
                        errorMessage: error instanceof Error ? error.message : String(error)
                    },
                    tags: ['authentication', 'auth-context', 'initialization-failure', 'high-severity']
                });
                
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
            // Add ErrorLoggingService logging for login failure
            await ErrorLoggingService.logError({
                severity: 'critical',
                errorMessage: 'Admin login failed',
                stackTrace: error instanceof Error ? error.stack : String(error),
                componentName: 'AuthContext',
                functionName: 'login',
                userAction: 'attempting admin login',
                additionalContext: {
                    hasPassword: !!import.meta.env.VITE_ADMIN_PASSWORD,
                    passwordLength: import.meta.env.VITE_ADMIN_PASSWORD?.length,
                    isLoading: true,
                    errorType: error instanceof Error ? error.constructor.name : 'Unknown'
                },
                tags: ['authentication', 'auth-context', 'login-failure', 'admin-access', 'critical']
            });
            
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

    const contextValue: AuthContextType = {
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        checkAuth,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
