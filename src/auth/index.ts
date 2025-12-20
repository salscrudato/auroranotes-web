/**
 * Auth module exports
 * Import from 'src/auth' for cleaner imports
 */

// Provider component
export { AuthProvider } from './AuthProvider';

// Hook and utilities (from separate file for React fast refresh compatibility)
export { useAuth, getUserInitials } from './useAuth';

// Types
export type { AuthUser, AuthError, AuthContextValue, TokenGetter } from './useAuth';

