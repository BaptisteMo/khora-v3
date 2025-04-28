'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';

import { Profile } from './supabase';
import { supabase } from './supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: { session: Session | null; user: User | null } | null;
  }>;
  signUp: (email: string, password: string) => Promise<{
    error: Error | null;
    data: { session: Session | null; user: User | null } | null;
  }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateProfile: (profileData: Partial<Profile>) => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Determine if user is authenticated
  const isAuthenticated = useMemo(() => !!user && !!session, [user, session]);

  useEffect(() => {
    // Get session on load
    const getSession = async () => {
      setIsLoading(true);
      
      // Get current session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      // Set the session and user if session exists
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
      }
      
      setIsLoading(false);
    };

    getSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (
        event: AuthChangeEvent,
        currentSession: Session | null
      ) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);
      }
    );

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch user profile from profiles table
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      if (data) {
        setProfile(data as Profile);
      } else {
        // Profile doesn't exist yet, create it with basic info
        if (user) {
          await createUserProfile(userId);
        }
      }
    } catch (err: unknown) {
      console.error('Error fetching user profile:', err);
    }
  };

  useEffect(() => {
    if (user && !profile) {
      fetchUserProfile(user.id);
    }
  }, [user, profile]);

  // Create a new user profile
  const createUserProfile = async (userId: string) => {
    try {
      const newProfile = {
        id: userId,
        username: user?.email?.split('@')[0] || `user_${userId.slice(0, 8)}`,
        avatar_url: null,
        games_played: 0,
        games_won: 0,
        games_lost: 0,
        is_active: true
      };
      
      const { data, error } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();
        
      if (error) throw error;
      
      setProfile(data as Profile);
    } catch (err: unknown) {
      console.error('Error creating user profile:', err);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (result.error) {
        setError(result.error.message);
        return { error: result.error, data: null };
      }
      
      return { error: null, data: result.data };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error.message);
      return { error, data: null };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (result.error) {
        setError(result.error.message);
        return { error: result.error, data: null };
      }
      
      return { error: null, data: result.data };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error.message);
      return { error, data: null };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setError(error.message);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh the current session
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;
      
      setSession(data.session);
      setUser(data.session?.user || null);
    } catch (err: unknown) {
      console.error('Session refresh error:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh session');
    }
  };

  // Update user profile
  const updateProfile = async (profileData: Partial<Profile>) => {
    if (!user || !profile) {
      setError('User not authenticated');
      throw new Error('User not authenticated');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id)
        .select()
        .single();
        
      if (error) throw error;
      
      setProfile(data as Profile);
    } catch (err: unknown) {
      console.error('Profile update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    refreshSession,
    updateProfile,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  
  return context;
} 