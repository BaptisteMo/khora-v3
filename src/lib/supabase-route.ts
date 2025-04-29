import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database.types';
import { cookies } from 'next/headers';

// Pass the cookies function, not the result
export const createRouteSupabaseClient = () => 
  createRouteHandlerClient<Database>({ cookies });