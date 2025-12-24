import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { processBrainDump } from '../../services/ai';

/**
 * Async thunk for processing brain dump with AI
 */
export const processBrainDumpAsync = createAsyncThunk(
    'brainDump/process',
    async (rawInput, { rejectWithValue, getState }) => {
        try {
            // Get existing projects from state to use as context
            const state = getState();
            const tasks = state.tasks?.items || [];
            const existingProjects = [...new Set(tasks.map(t => t.project).filter(Boolean))];

            const result = await processBrainDump(rawInput, existingProjects);
            return result;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    // Modal state
    isOpen: false,

    // Input
    rawInput: '',

    // Processing
    isProcessing: false,
    error: null,

    // Results
    stagedTasks: [],
    usedFallback: false,

    // View state
    currentView: 'input', // 'input' | 'staging'
};

const brainDumpSlice = createSlice({
    name: 'brainDump',
    initialState,
    reducers: {
        openBrainDump: (state) => {
            state.isOpen = true;
            state.currentView = 'input';
            state.rawInput = '';
            state.stagedTasks = [];
            state.error = null;
            state.usedFallback = false;
        },

        closeBrainDump: (state) => {
            state.isOpen = false;
            state.currentView = 'input';
            state.rawInput = '';
            state.stagedTasks = [];
            state.error = null;
        },

        setRawInput: (state, action) => {
            state.rawInput = action.payload;
        },

        updateStagedTask: (state, action) => {
            const { id, updates } = action.payload;
            const index = state.stagedTasks.findIndex(t => t.id === id);
            if (index !== -1) {
                state.stagedTasks[index] = { ...state.stagedTasks[index], ...updates };
            }
        },

        removeStagedTask: (state, action) => {
            state.stagedTasks = state.stagedTasks.filter(t => t.id !== action.payload);
        },

        goBackToInput: (state) => {
            state.currentView = 'input';
        },

        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(processBrainDumpAsync.pending, (state) => {
                state.isProcessing = true;
                state.error = null;
            })
            .addCase(processBrainDumpAsync.fulfilled, (state, action) => {
                state.isProcessing = false;
                state.stagedTasks = action.payload.tasks;
                state.usedFallback = action.payload.usedFallback;
                state.currentView = 'staging';
                state.error = action.payload.error; // May contain warning even on success
            })
            .addCase(processBrainDumpAsync.rejected, (state, action) => {
                state.isProcessing = false;
                state.error = action.payload || 'Processing failed';
            });
    }
});

export const {
    openBrainDump,
    closeBrainDump,
    setRawInput,
    updateStagedTask,
    removeStagedTask,
    goBackToInput,
    clearError
} = brainDumpSlice.actions;

export default brainDumpSlice.reducer;
