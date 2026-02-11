import { createClient } from '@/lib/supabase/server';

export interface AuthResult {
  userId: string;
  error: null;
}

export interface AuthError {
  userId: null;
  error: string;
}

/**
 * Verify the current user's session and return their user ID.
 * Use this in API routes to ensure requests are authenticated.
 */
export async function verifyAuth(): Promise<AuthResult | AuthError> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { userId: null, error: 'Unauthorized' };
    }

    return { userId: user.id, error: null };
  } catch (e) {
    return { userId: null, error: 'Auth verification failed' };
  }
}

/**
 * Verify auth and check that the authenticated user matches the requested userId.
 * Use this when an API accepts a userId parameter that should match the session.
 */
export async function verifyAuthForUser(requestedUserId: string): Promise<AuthResult | AuthError> {
  const auth = await verifyAuth();

  if (auth.error) {
    return auth;
  }

  if (auth.userId !== requestedUserId) {
    return { userId: null, error: 'Forbidden: User ID mismatch' };
  }

  return auth;
}
