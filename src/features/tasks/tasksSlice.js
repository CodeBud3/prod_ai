import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { AiEngine } from '../../services/AiEngine'

const initialState = {
    items: [],
    loading: false,
    error: null
}

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

const tasksSlice = createSlice({
    name: 'tasks',
    initialState,
    reducers: {
        addTask: (state, action) => {
            const task = {
                ...action.payload,
                priority: action.payload.priority || 'none',
                status: action.payload.status || 'todo',
                createdAt: action.payload.createdAt || Date.now()
            };
            state.items.push(task);
        },

        bulkAddTasks: (state, action) => {
            const tasks = action.payload.map(t => ({
                ...t,
                priority: t.priority || 'none',
                status: t.status || 'todo',
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
            state.items = state.items.filter(t => t.id !== action.payload)
        },

        toggleTask: (state, action) => {
            const task = state.items.find(t => t.id === action.payload)
            if (task) {
                const isDone = task.status === 'done'
                task.status = isDone ? 'todo' : 'done'
                task.completedAt = isDone ? null : Date.now()
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
    }
})

export const {
    addTask,
    bulkAddTasks,
    updateTask,
    deleteTask,
    toggleTask,
    setReminder,
    dismissReminder,
    setFocusColor,
    checkReminders,
    bulkUpdateTasks,
    clearAllTasks
} = tasksSlice.actions

export default tasksSlice.reducer
