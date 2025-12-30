import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle as googleSignIn,
    signOut as supabaseSignOut,
    getCurrentUser,
    isSupabaseConfigured
} from '../../lib/supabase';

// Async thunks for auth operations
export const signIn = createAsyncThunk(
    'auth/signIn',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const { data, error } = await signInWithEmail(email, password);
            if (error) throw error;
            return {
                user: data.user,
                session: data.session
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const signUp = createAsyncThunk(
    'auth/signUp',
    async ({ email, password, name, role }, { rejectWithValue }) => {
        try {
            const { data, error } = await signUpWithEmail(email, password, { name, role });
            if (error) throw error;
            return {
                user: data.user,
                session: data.session,
                needsEmailVerification: !data.session
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const signInWithGoogle = createAsyncThunk(
    'auth/signInWithGoogle',
    async (_, { rejectWithValue }) => {
        try {
            const { data, error } = await googleSignIn();
            if (error) throw error;
            // OAuth redirects, so we won't get data back immediately
            return { redirecting: true };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const signOut = createAsyncThunk(
    'auth/signOut',
    async (_, { rejectWithValue }) => {
        try {
            const { error } = await supabaseSignOut();
            if (error) throw error;
            return null;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const checkSession = createAsyncThunk(
    'auth/checkSession',
    async (_, { rejectWithValue }) => {
        try {
            const user = await getCurrentUser();
            return user;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    user: null,
    session: null,
    isAuthenticated: false,
    isGuest: true,
    loading: false,
    error: null,
    initialized: false,
    needsEmailVerification: false,
    isSupabaseAvailable: isSupabaseConfigured()
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setGuest: (state) => {
            state.isGuest = true;
            state.isAuthenticated = false;
            state.user = null;
            state.session = null;
            state.initialized = true;
        },
        setAuthUser: (state, action) => {
            const { user, session } = action.payload;
            state.user = user;
            state.session = session;
            state.isAuthenticated = !!user;
            state.isGuest = !user;
            state.initialized = true;
        },
        clearError: (state) => {
            state.error = null;
        },
        setInitialized: (state) => {
            state.initialized = true;
        }
    },
    extraReducers: (builder) => {
        // Sign In
        builder
            .addCase(signIn.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(signIn.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.session = action.payload.session;
                state.isAuthenticated = true;
                state.isGuest = false;
            })
            .addCase(signIn.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Sign in failed';
            });

        // Sign Up
        builder
            .addCase(signUp.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(signUp.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.session = action.payload.session;
                state.isAuthenticated = !!action.payload.session;
                state.isGuest = !action.payload.session;
                state.needsEmailVerification = action.payload.needsEmailVerification;
            })
            .addCase(signUp.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Sign up failed';
            });

        // Google Sign In
        builder
            .addCase(signInWithGoogle.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(signInWithGoogle.fulfilled, (state) => {
                // OAuth redirects - state will be updated on return
                state.loading = false;
            })
            .addCase(signInWithGoogle.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Google sign in failed';
            });

        // Sign Out
        builder
            .addCase(signOut.pending, (state) => {
                state.loading = true;
            })
            .addCase(signOut.fulfilled, (state) => {
                state.loading = false;
                state.user = null;
                state.session = null;
                state.isAuthenticated = false;
                state.isGuest = true;
            })
            .addCase(signOut.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Sign out failed';
            });

        // Check Session
        builder
            .addCase(checkSession.pending, (state) => {
                state.loading = true;
            })
            .addCase(checkSession.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = !!action.payload;
                state.isGuest = !action.payload;
                state.initialized = true;
            })
            .addCase(checkSession.rejected, (state) => {
                state.loading = false;
                state.initialized = true;
                state.isGuest = true;
            });
    }
});

export const { setGuest, setAuthUser, clearError, setInitialized } = authSlice.actions;
export default authSlice.reducer;
