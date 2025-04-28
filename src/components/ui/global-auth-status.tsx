'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';

export function GlobalAuthStatus() {
  const { user, error, isLoading } = useAuth();
  const [showStatus, setShowStatus] = useState(false);
  
  useEffect(() => {
    // Show status message when auth state changes
    if (!isLoading) {
      setShowStatus(true);
      const timer = setTimeout(() => setShowStatus(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [user, error, isLoading]);

  if (!showStatus) return null;

  return (
    <div className="fixed top-5 right-5 z-50 max-w-md">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md">
          <div className="flex">
            <p><strong>Auth Error:</strong> {error}</p>
          </div>
        </div>
      )}
      
      {!error && !isLoading && (
        <div className={`px-4 py-3 rounded shadow-md ${user ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-yellow-100 border border-yellow-400 text-yellow-700'}`}>
          <div className="flex">
            <p>
              <strong>Auth Status:</strong> {user ? `Signed in as ${user.email}` : 'Not signed in'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 