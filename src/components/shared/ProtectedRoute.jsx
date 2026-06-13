import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const ROLE_HOME = {
  customer: '/home',
  store_owner: '/store/dashboard',
  delivery_partner: '/delivery/dashboard',
};

/**
 * ProtectedRoute — wraps routes that require authentication and a specific role.
 *
 * Usage:
 *   <ProtectedRoute role="customer">
 *     <CustomerHome />
 *   </ProtectedRoute>
 */
export default function ProtectedRoute({ children, role }) {
  const { user, profile, loading } = useContext(AuthContext);
  const location = useLocation();

  // Show nothing while auth is resolving
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFEFF]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#00BCD4] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role mismatch → redirect to correct dashboard
  if (role && profile?.role && profile.role !== role) {
    const correctPath = ROLE_HOME[profile.role] || '/';
    return <Navigate to={correctPath} replace />;
  }

  return children;
}
