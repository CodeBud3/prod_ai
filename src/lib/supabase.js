import { createClient } from '@supabase/supabase-js';

// Supabase client configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate configuration
const isConfigured = supabaseUrl && supabaseAnonKey &&
    !supabaseUrl.includes('your-project') &&
    !supabaseAnonKey.includes('your-anon');

// Create client only if configured
export const supabase = isConfigured
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    })
    : null;

// Helper to check if Supabase is available
export const isSupabaseConfigured = () => isConfigured;

// Auth helpers
export const signInWithEmail = async (email, password) => {
    if (!supabase) throw new Error('Supabase not configured');
    return supabase.auth.signInWithPassword({ email, password });
};

export const signUpWithEmail = async (email, password, metadata = {}) => {
    if (!supabase) throw new Error('Supabase not configured');
    return supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
    });
};

export const signInWithGoogle = async () => {
    if (!supabase) throw new Error('Supabase not configured');
    return supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/`
        }
    });
};

export const signOut = async () => {
    if (!supabase) throw new Error('Supabase not configured');
    return supabase.auth.signOut();
};

export const getCurrentUser = async () => {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};

export const getSession = async () => {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session;
};

// Listen to auth state changes
export const onAuthStateChange = (callback) => {
    if (!supabase) return { data: { subscription: { unsubscribe: () => { } } } };
    return supabase.auth.onAuthStateChange(callback);
};
