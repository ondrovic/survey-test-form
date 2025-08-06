// Cookie utility functions for admin authentication

const ADMIN_AUTH_COOKIE = "admin_authenticated";
const ADMIN_AUTH_EXPIRY_DAYS = 7; // Cookie expires in 7 days

export const cookieUtils = {
  /**
   * Set admin authentication cookie
   */
  setAdminAuth: () => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + ADMIN_AUTH_EXPIRY_DAYS);

    document.cookie = `${ADMIN_AUTH_COOKIE}=true; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
  },

  /**
   * Check if admin is authenticated via cookie
   */
  isAdminAuthenticated: (): boolean => {
    const cookies = document.cookie.split(";");
    const authCookie = cookies.find((cookie) =>
      cookie.trim().startsWith(`${ADMIN_AUTH_COOKIE}=`)
    );
    return authCookie !== undefined;
  },

  /**
   * Remove admin authentication cookie
   */
  clearAdminAuth: () => {
    document.cookie = `${ADMIN_AUTH_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  },
};
