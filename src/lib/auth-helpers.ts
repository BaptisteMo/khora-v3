import { createRouteSupabaseClient } from './supabase-route';

export async function getUserFromRequest(_req: Request, supabase: ReturnType<typeof createRouteSupabaseClient>) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
} 