'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function withAuth(Component, requiredRole = null) {
  return function ProtectedPage(props) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!user) {
          router.replace('/login');
        } else if (requiredRole && user.role !== requiredRole) {
          router.replace(user.role === 'admin' ? '/admin' : '/dashboard');
        }
      }
    }, [user, loading, router]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!user) return null;
    if (requiredRole && user.role !== requiredRole) return null;

    return <Component {...props} />;
  };
}
