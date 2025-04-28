'use client';

import { ReactNode } from 'react';
import { AuthProvider as AuthContextProvider } from '@/lib/auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthContextProvider>{children}</AuthContextProvider>;
} 