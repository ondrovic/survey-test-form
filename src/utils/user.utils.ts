/**
 * User utility functions
 */

import { SupabaseClientService } from '@/services/supabase-client.service';
import { ErrorLoggingService } from '@/services/error-logging.service';

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
    // Log the error using ErrorLoggingService
    ErrorLoggingService.logError({
      severity: 'low',
      errorMessage: error instanceof Error ? error.message : 'Failed to get current user',
      stackTrace: error instanceof Error ? error.stack : String(error),
      componentName: 'UserUtils',
      functionName: 'getCurrentUser',
      userAction: 'Getting current authenticated user',
      additionalContext: {
        errorType: 'user_retrieval'
      },
      tags: ['utils', 'user', 'authentication']
    });
    
    return null;
  }
};