import React, { useState, useEffect } from 'react';
import { Wizard } from './components/Wizard';
import { Dashboard } from './components/Dashboard';

const STORAGE_KEY = 'prodai_state_react';

const defaultState = {
  user: {
    name: '',
    role: '',
    onboarded: false,
    preferences: {
      gamification: false,
      focusMode: false,
      theme: 'dark'
    }
  },
  tasks: [],
  plan: null
};

function App() {
  const [state, setState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultState;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Apply theme
  useEffect(() => {
    const theme = state.user.preferences.theme || 'dark';
    document.body.dataset.theme = theme;
  }, [state.user.preferences.theme]);

  const handleOnboardingComplete = ({ user, tasks }) => {
    setState(prev => ({ ...prev, user, tasks }));
  };

  const handleUpdateUser = (user) => {
    setState(prev => ({ ...prev, user }));
  };

  const handleUpdateTasks = (tasks) => {
    setState(prev => ({ ...prev, tasks }));
  };

  const handleUpdatePlan = (plan) => {
    setState(prev => ({ ...prev, plan }));
  };

  const handleDeleteTask = (taskId) => {
    const newTasks = state.tasks.filter(t => t.id !== taskId);

    // Also remove from plan if it exists
    let newPlan = state.plan;
    if (state.plan) {
      newPlan = {
        ...state.plan,
        tasks: state.plan.tasks.filter(t => t.id !== taskId)
      };
    }

    setState(prev => ({
      ...prev,
      tasks: newTasks,
      plan: newPlan
    }));
  };

  const handleEditTask = (updatedTask) => {
    const newTasks = state.tasks.map(t => t.id === updatedTask.id ? updatedTask : t);

    let newPlan = state.plan;
    if (state.plan) {
      newPlan = {
        ...state.plan,
        tasks: state.plan.tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
      };
    }

    setState(prev => ({
      ...prev,
      tasks: newTasks,
      plan: newPlan
    }));
  };

  return (
    <div id="app">
      {!state.user.onboarded ? (
        <Wizard onComplete={handleOnboardingComplete} />
      ) : (
        <Dashboard
          user={state.user}
          tasks={state.tasks}
          plan={state.plan}
          onUpdateUser={handleUpdateUser}
          onUpdateTasks={handleUpdateTasks}
          onUpdatePlan={handleUpdatePlan}
          onDeleteTask={handleDeleteTask}
          onEditTask={handleEditTask}
        />
      )}
    </div>
  );
}

export default App;
