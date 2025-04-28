import { supabase } from './supabase';

/**
 * Tests the connection to Supabase
 * @returns Promise<boolean> indicating if the connection was successful
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    // Use a simple health check rather than querying a specific table
    // This will work even before we run the migrations
    const { error } = await supabase.from('_pgsodium_key_status').select('health_status').limit(1);
    
    // If we get an error about the table not existing, try a fallback check
    if (error && error.message.includes('does not exist')) {
      const { error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.error('Supabase connection test failed:', authError.message);
        return false;
      }
      
      console.log('Supabase connection test successful via auth check');
      return true;
    }
    
    if (error) {
      console.error('Supabase connection test failed:', error.message);
      return false;
    }
    
    console.log('Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return false;
  }
}

/**
 * Utility function to handle common Supabase errors
 * @param error Error from Supabase operation
 * @returns Formatted error message
 */
export function handleSupabaseError(error: unknown): string {
  if (!error) return 'Unknown error';
  
  // Log the error for debugging
  console.error('Supabase error:', error);
  
  // Return user-friendly message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return (error as { message: string }).message;
  } else if (typeof error === 'string') {
    return error;
  } else {
    return 'An unknown error occurred';
  }
} 