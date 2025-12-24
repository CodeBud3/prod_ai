import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Wizard } from './features/onboarding';
import { Dashboard } from './features/dashboard';
import { selectUser, selectIsOnboarded } from './features/user/userSelectors';
import { completeOnboarding } from './features/user/userSlice';
import { bulkAddTasks } from './features/tasks/tasksSlice';
import { selectAllTasks } from './features/tasks/tasksSelectors';
import { BrainDumpModal, openBrainDump, selectBrainDumpIsOpen } from './features/brainDump';


function App() {
  const dispatch = useDispatch();

  // All state is now in Redux!
  const user = useSelector(selectUser);
  const isOnboarded = useSelector(selectIsOnboarded);
  const tasks = useSelector(selectAllTasks);
  const isBrainDumpOpen = useSelector(selectBrainDumpIsOpen);

  // Auto-open brain dump for first-time users with no tasks
  useEffect(() => {
    if (isOnboarded && tasks.length === 0 && !isBrainDumpOpen) {
      // Small delay to let the UI settle
      const timer = setTimeout(() => {
        dispatch(openBrainDump());
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOnboarded, tasks.length, isBrainDumpOpen, dispatch]);

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

  return (
    <div id="app">
      {!isOnboarded ? (
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

