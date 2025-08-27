/**
 * User utility functions
 */

import { SupabaseClientService } from '@/services/supabase-client.service';

export interface CurrentUser {
  id: string;
  email?: string;
}

/**
 * Get current authenticated user
 */
export const getCurrentUser = async (): Promise<CurrentUser | null> => {
  try {
    const client = SupabaseClientService.getInstance().getCurrentClient();
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email
    };
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
};