import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';

// Create a Supabase client for use in server components
export const createServerSupabaseClient = () => 
  createServerComponentClient<Database>({ cookies }); 