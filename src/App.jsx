import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Wizard } from './features/onboarding';
import { Dashboard } from './features/dashboard';
import { selectUser, selectIsOnboarded } from './features/user/userSelectors';
import { completeOnboarding } from './features/user/userSlice';
import { bulkAddTasks } from './features/tasks/tasksSlice';
import { selectAllTasks } from './features/tasks/tasksSelectors';
import { BrainDumpModal, openBrainDump, selectBrainDumpIsOpen, selectBrainDumpHasBeenDismissed } from './features/brainDump';
import { selectIsAuthenticated, selectAuthUser, selectIsGuest } from './features/auth/authSelectors';
import { checkSession, setAuthUser, setGuest } from './features/auth/authSlice';
import { initializeSync, fetchTasks } from './features/tasks/tasksSlice';
import { SyncService } from './services/SyncService';
import { onAuthStateChange, isSupabaseConfigured } from './lib/supabase';
function App() {
  const dispatch = useDispatch();

  // All state is now in Redux!
  const user = useSelector(selectUser);
  const isOnboarded = useSelector(selectIsOnboarded);
  const tasks = useSelector(selectAllTasks);
  const isBrainDumpOpen = useSelector(selectBrainDumpIsOpen);
  const hasBeenDismissed = useSelector(selectBrainDumpHasBeenDismissed);

  // Auth state
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isGuest = useSelector(selectIsGuest);
  const authUser = useSelector(selectAuthUser);

  // Restore auth session on app startup and listen for changes
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // Check existing session on startup
    dispatch(checkSession());

    // Listen for auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      if (event === 'SIGNED_IN' && session?.user) {
        dispatch(setAuthUser({ user: session.user, session }));
      } else if (event === 'SIGNED_OUT') {
        dispatch(setGuest());
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        dispatch(setAuthUser({ user: session.user, session }));
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [dispatch]);

  // Auto-complete onboarding for authenticated users
  useEffect(() => {
    if (isAuthenticated && authUser && !isOnboarded) {
      // Use the auth user's name or email as the onboarding name
      const userName = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User';
      dispatch(completeOnboarding({
        name: userName,
        role: 'Authenticated User'
      }));
    }
  }, [isAuthenticated, authUser, isOnboarded, dispatch]);

  // Auto-open brain dump for first-time users with no tasks (non-mandatory)
  useEffect(() => {
    // Only open if: onboarded, no tasks, not already open, AND user hasn't dismissed it
    if (isOnboarded && tasks.length === 0 && !isBrainDumpOpen && !hasBeenDismissed) {
      // Small delay to let the UI settle
      const timer = setTimeout(() => {
        dispatch(openBrainDump());
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOnboarded, tasks.length, isBrainDumpOpen, hasBeenDismissed, dispatch]);

  // Sync initialization
  useEffect(() => {
    if (isAuthenticated && authUser?.id) {
      dispatch(initializeSync(authUser.id));
    }
  }, [isAuthenticated, authUser?.id, dispatch]);

  // Real-time sync subscription
  useEffect(() => {
    if (isAuthenticated && authUser?.id) {
      const subscription = SyncService.subscribeToChanges(authUser.id, () => {
        dispatch(fetchTasks(authUser.id));
      });

      return () => {
        subscription?.unsubscribe();
      };
    }
  }, [isAuthenticated, authUser?.id, dispatch]);

  // Apply theme from Redux user state
  useEffect(() => {
    const theme = user.preferences.theme || 'dark';
    document.body.dataset.theme = theme;
  }, [user.preferences.theme]);

  const handleOnboardingComplete = ({ user: newUser, tasks: newTasks }) => {
    // Update user in Redux
    dispatch(completeOnboarding({
      name: newUser.name,
      role: newUser.role
    }));

    // Add tasks to Redux
    dispatch(bulkAddTasks(newTasks));
  };

  // Determine if we should show onboarding
  // Skip onboarding for authenticated users (they get auto-onboarded above)
  const shouldShowOnboarding = !isOnboarded && !isAuthenticated;

  return (
    <div id="app">
      {shouldShowOnboarding ? (
        <Wizard onComplete={handleOnboardingComplete} />
      ) : (
        <Dashboard />
      )}

      {/* Brain Dump Modal - available globally */}
      <BrainDumpModal />
    </div>
  );
}

export default App;
