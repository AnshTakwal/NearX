import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * useAuth — shortcut to access auth context.
 * Returns { user, profile, role, loading, login, register, logout }
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
