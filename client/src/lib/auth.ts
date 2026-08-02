import { authApi } from './api';

export interface User {
  id: string;
  username: string;
  role: string;
}

/**
 * Check if the user is authenticated by calling /api/auth/me.
 * Returns the user object if authenticated, null otherwise.
 */
export async function getUser(): Promise<User | null> {
  try {
    const res = await authApi.me();
    return res.data.user;
  } catch {
    return null;
  }
}

/**
 * Perform logout — clears the server session and redirects to login.
 */
export async function logout(): Promise<void> {
  try {
    await authApi.logout();
  } finally {
    window.location.href = '/login';
  }
}
