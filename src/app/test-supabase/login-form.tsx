'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function LoginForm() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [status, setStatus] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState<boolean>(false);

  const { signIn, signUp, signOut, isAuthenticated, user, error, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Processing...');

    try {
      if (isSignUp) {
        // Sign up
        const { error } = await signUp(email, password);
        if (error) throw error;
        setStatus('Sign up successful! Check your email to confirm your account');
      } else {
        // Sign in
        const { error } = await signIn(email, password);
        if (error) throw error;
        setStatus('Signed in successfully!');
      }
    } catch {
      setStatus(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setStatus('Signed out successfully!');
    } catch {
      setStatus(null);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h2 className="font-semibold mb-4">{isSignUp ? 'Sign Up' : 'Login'}</h2>
      {isAuthenticated ? (
        <div>
          <div className="mb-2">Logged in as: <span className="font-mono">{user?.email}</span></div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            disabled={isLoading}
          >
            Sign Out
          </button>
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block mb-1">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block mb-1">Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div className="flex justify-between">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={isLoading}
          >
            {isSignUp ? 'Sign Up' : 'Login'}
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            {isSignUp ? 'Already have an account?' : 'Need an account?'}
          </button>
        </div>
      </form>
      )}
      {status && (
        <div className="mt-4 p-2 bg-green-100 text-green-800 rounded">
          {status}
        </div>
      )}
      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-800 rounded">
          Error: {error}
        </div>
      )}
    </div>
  );
} 