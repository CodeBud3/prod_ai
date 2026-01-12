import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { AiEngine } from '../../services/AiEngine'
import { generateTaskSuggestions, generateBatchTaskSuggestions } from '../../services/ai'
import { SyncService } from '../../services/SyncService'
import { signOut } from '../auth/authSlice'

const initialState = {
    items: [],
    loading: false,
    error: null
}

// Async thunk for initializing sync (migrate + pull)
// Async thunk moved to bottom to avoid circular dependency


// Helper to calculate the next occurrence date for recurring tasks
const calculateNextOccurrence = (task) => {
    const { recurrence, dueDate } = task;
    if (!recurrence?.enabled || !dueDate) return null;

    const current = new Date(dueDate);
    const interval = recurrence.interval || 1;
    let next = new Date(current);

    switch (recurrence.frequency) {
        case 'daily':
            next.setDate(next.getDate() + interval);
            break;

        case 'weekly':
            // Find the next matching day of week
            const daysOfWeek = recurrence.daysOfWeek || [current.getDay()];
            let daysToAdd = 1;

            for (let i = 1; i <= 7 * interval; i++) {
                const testDate = new Date(current);
                testDate.setDate(testDate.getDate() + i);
                if (daysOfWeek.includes(testDate.getDay())) {
                    const weeksPassed = Math.floor(i / 7);
                    if (weeksPassed < interval || (i % 7 === 0 && weeksPassed === interval)) {
                        daysToAdd = i;
                        break;
                    } else if (weeksPassed >= interval - 1) {
                        daysToAdd = i;
                        break;
                    }
                }
            }
            next.setDate(current.getDate() + daysToAdd);
            break;

        case 'monthly':
            next.setMonth(next.getMonth() + interval);
            const targetDay = recurrence.dayOfMonth || current.getDate();
            const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
            next.setDate(Math.min(targetDay, daysInMonth));
            break;

        default:
            next.setDate(next.getDate() + 1);
    }

    // Apply recurrence time if specified
    if (recurrence.time) {
        const [hours, minutes] = recurrence.time.split(':').map(Number);
        next.setHours(hours, minutes, 0, 0);
    }

    // Check if we've passed the end date
    if (recurrence.endType === 'date' && recurrence.endDate) {
        if (next.getTime() > recurrence.endDate) {
            return null; // No more occurrences
        }
    }

    // Format as datetime-local string
    const year = next.getFullYear();
    const month = String(next.getMonth() + 1).padStart(2, '0');
    const day = String(next.getDate()).padStart(2, '0');
    const hours = String(next.getHours()).padStart(2, '0');
    const minutes = String(next.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
};


// Async thunk for AI-powered task generation
export const generateTaskPlan = createAsyncThunk(
    'tasks/generatePlan',
    async ({ tasks, role }, { rejectWithValue }) => {
        try {
            const plan = await AiEngine.generatePlan(tasks, role)
            return plan
        } catch (error) {
            return rejectWithValue(error.message)
        }
    }
)

// Async thunk for single task suggestion
export const fetchAiSuggestion = createAsyncThunk(
    'tasks/fetchAiSuggestion',
    async (task, { rejectWithValue }) => {
        try {
            const suggestion = await generateTaskSuggestions(task);
            return { taskId: task.id, suggestion };
        } catch (error) {
            console.error('Failed to fetch suggestion:', error);
            // Don't reject for UI smoothness, just return null suggestion
            return { taskId: task.id, suggestion: null };
        }
    }
)

// Async thunk for batch task suggestions
export const fetchBatchAiSuggestions = createAsyncThunk(
    'tasks/fetchBatchAiSuggestions',
    async (tasks, { rejectWithValue }) => {
        try {
            const suggestions = await generateBatchTaskSuggestions(tasks);
            return suggestions; // Returns object { taskId: suggestion, ... }
        } catch (error) {
            console.error('Failed to fetch batch suggestions:', error);
            return rejectWithValue(error.message);
        }
    }
)

// Predefined categories
export const TASK_CATEGORIES = {
    work: { id: 'work', label: 'Work', color: '#3b82f6', icon: '💼' },
    personal: { id: 'personal', label: 'Personal', color: '#10b981', icon: '🏠' },
    errands: { id: 'errands', label: 'Errands', color: '#f59e0b', icon: '🛒' }
};

const tasksSlice = createSlice({
    name: 'tasks',
    initialState,
    reducers: {
        addTask: (state, action) => {
            const task = {
                ...action.payload,
                priority: action.payload.priority || 'none',
                status: action.payload.status || 'todo',
                category: action.payload.category || 'general',
                createdAt: action.payload.createdAt || Date.now()
            };
            state.items.push(task);
        },

        bulkAddTasks: (state, action) => {
            const tasks = action.payload.map(t => ({
                ...t,
                priority: t.priority || 'none',
                status: t.status || 'todo',
                category: t.category || 'general',
                createdAt: t.createdAt || Date.now()
            }));
            state.items = [...state.items, ...tasks];
        },

        updateTask: (state, action) => {
            const { id, updates } = action.payload
            const index = state.items.findIndex(t => t.id === id)
            if (index !== -1) {
                state.items[index] = { ...state.items[index], ...updates }
                // Ensure priority doesn't become undefined if explicitly set to null/undefined in updates (though unlikely)
                if (state.items[index].priority === undefined) {
                    state.items[index].priority = 'none';
                }
            }
        },

        deleteTask: (state, action) => {
            // Soft delete: mark as deleted instead of removing
            const task = state.items.find(t => t.id === action.payload);
            if (task) {
                task.deleted = true;
                task.deletedAt = Date.now();
            }
        },

        restoreTask: (state, action) => {
            const task = state.items.find(t => t.id === action.payload);
            if (task) {
                task.deleted = false;
                task.deletedAt = null;
            }
        },

        permanentlyDeleteTask: (state, action) => {
            state.items = state.items.filter(t => t.id !== action.payload);
        },

        emptyTrash: (state) => {
            state.items = state.items.filter(t => !t.deleted);
        },

        toggleTask: (state, action) => {
            const task = state.items.find(t => t.id === action.payload)
            if (task) {
                const isDone = task.status === 'done'

                // If completing a recurring task, reschedule instead of marking done
                if (!isDone && task.recurrence?.enabled && task.dueDate) {
                    const nextDate = calculateNextOccurrence(task);
                    if (nextDate) {
                        // Update to next occurrence
                        task.dueDate = nextDate;
                        task.completedAt = null;
                        task.lastCompletedAt = Date.now();
                        task.completionCount = (task.completionCount || 0) + 1;

                        // Check if we've reached the end count
                        if (task.recurrence.endType === 'count' &&
                            task.completionCount >= task.recurrence.endCount) {
                            task.recurrence.enabled = false;
                            task.status = 'done';
                            task.completedAt = Date.now();
                        }
                    } else {
                        // No more occurrences, mark as done
                        task.status = 'done'
                        task.completedAt = Date.now()
                    }
                } else {
                    // Normal toggle behavior
                    task.status = isDone ? 'todo' : 'done'
                    task.completedAt = isDone ? null : Date.now()
                }
                task.focusColor = isDone ? task.focusColor : null
            }
        },

        setReminder: (state, action) => {
            const { taskId, minutes } = action.payload
            const task = state.items.find(t => t.id === taskId)
            if (task) {
                const now = Date.now()
                task.remindAt = now + (minutes * 60 * 1000)
                task.reminderStartedAt = now
            }
        },

        dismissReminder: (state, action) => {
            const task = state.items.find(t => t.id === action.payload)
            if (task) {
                task.reminding = false
                task.remindAt = null
                task.reminderStartedAt = null
            }
        },

        setFocusColor: (state, action) => {
            const { taskId, color } = action.payload
            const task = state.items.find(t => t.id === taskId)
            if (task) {
                task.focusColor = color
            }
        },

        checkReminders: (state) => {
            const now = Date.now()
            state.items.forEach(task => {
                // Skip completed or deleted tasks - they should never trigger reminders
                if (task.status === 'done' || task.deleted) return;

                const isRemindDue = task.remindAt && task.remindAt <= now && !task.reminding;
                const isFollowUpDue = task.followUp?.dueAt && task.followUp.dueAt <= now && task.followUp.status === 'pending' && !task.reminding;

                if (isRemindDue || isFollowUpDue) {
                    task.reminding = true
                }
            })
        },

        bulkUpdateTasks: (state, action) => {
            state.items = action.payload
        },

        clearAllTasks: (state) => {
            state.items = []
        }
    },

    extraReducers: (builder) => {
        builder
            .addCase(generateTaskPlan.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(generateTaskPlan.fulfilled, (state, action) => {
                state.loading = false
                // Update tasks with AI-generated data
                state.items = action.payload.tasks
            })
            .addCase(generateTaskPlan.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            // Clear tasks on sign out to prevent data leakage to guest mode
            .addCase(signOut.fulfilled, (state) => {
                state.items = [];
                state.loading = false
                state.error = null
            })
            // AI Suggestion Result
            .addCase(fetchAiSuggestion.fulfilled, (state, action) => {
                const { taskId, suggestion } = action.payload;
                const task = state.items.find(t => t.id === taskId);
                if (task) {
                    task.aiSuggestion = suggestion;
                }
            })
            // Batch AI Suggestion Result
            .addCase(fetchBatchAiSuggestions.fulfilled, (state, action) => {
                const suggestions = action.payload; // { taskId: suggestionString, ... }
                if (suggestions) {
                    Object.entries(suggestions).forEach(([taskId, suggestionString]) => {
                        const task = state.items.find(t => t.id === taskId || t.id === Number(taskId)); // loose matching for ID types
                        if (task) {
                            task.aiSuggestion = suggestionString;
                        }
                    });
                }
            })
    }
})

export const {
    addTask,
    bulkAddTasks,
    updateTask,
    deleteTask,
    restoreTask,
    permanentlyDeleteTask,
    emptyTrash,
    toggleTask,
    setReminder,
    dismissReminder,
    setFocusColor,
    checkReminders,
    bulkUpdateTasks,
    clearAllTasks
} = tasksSlice.actions

export default tasksSlice.reducer

// Async thunk to fetch tasks from cloud (pull only)
export const fetchTasks = createAsyncThunk(
    'tasks/fetchTasks',
    async (userId, { dispatch, rejectWithValue }) => {
        try {
            const { data, error } = await SyncService.pullChanges(userId);
            if (error) throw error;

            if (data) {
                dispatch(tasksSlice.actions.bulkUpdateTasks(data));
            }
            return data;
        } catch (error) {
            console.error('Fetch Tasks Failed:', error);
            return rejectWithValue(error.message);
        }
    }
)

// Async thunk for initializing sync (migrate + pull)
// Defined here to have access to tasksSlice.actions
export const initializeSync = createAsyncThunk(
    'tasks/initializeSync',
    async (userId, { getState, dispatch, rejectWithValue }) => {
        try {
            const state = getState();
            // 1. Migrate local tasks (if any)
            const localTasks = state.tasks?.items || [];
            // Only migrate if we suspect these are guest tasks. 
            // In a real app we'd track "isGuestData" flag, but for now we'll just upsert.
            // Safe because upsert is idempotent.
            if (localTasks.length > 0) {
                await SyncService.migrateGuestData(localTasks, userId);
            }

            // 2. Pull changes from cloud
            await dispatch(fetchTasks(userId));
            return true;
        } catch (error) {
            console.error('Initialize Sync Failed:', error);
            return rejectWithValue(error.message);
        }
    }
)
