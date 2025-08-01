/**
 * Environment utility functions
 */

/**
 * Check if the application is running in development mode
 */
export const isDevelopment = (): boolean => {
  return import.meta.env.DEV;
};

/**
 * Check if the application is running in production mode
 */
export const isProduction = (): boolean => {
  return import.meta.env.PROD;
};

/**
 * Get the current environment name
 */
export const getEnvironment = (): "development" | "production" => {
  return import.meta.env.DEV ? "development" : "production";
};
