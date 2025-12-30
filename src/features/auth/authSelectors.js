// Auth selectors
export const selectAuth = (state) => state.auth;
export const selectIsAuthenticated = (state) => state.auth?.isAuthenticated ?? false;
export const selectIsGuest = (state) => state.auth?.isGuest ?? true;
export const selectAuthUser = (state) => state.auth?.user ?? null;
export const selectAuthLoading = (state) => state.auth?.loading ?? false;
export const selectAuthError = (state) => state.auth?.error ?? null;
export const selectAuthInitialized = (state) => state.auth?.initialized ?? false;
export const selectIsSupabaseAvailable = (state) => state.auth?.isSupabaseAvailable ?? false;
export const selectNeedsEmailVerification = (state) => state.auth?.needsEmailVerification ?? false;
