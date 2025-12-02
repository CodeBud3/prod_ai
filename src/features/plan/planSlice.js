import { createSlice } from '@reduxjs/toolkit'
import { generateTaskPlan } from '../tasks/tasksSlice'

const initialState = {
    summary: null
}

const planSlice = createSlice({
    name: 'plan',
    initialState,
    reducers: {
        setPlan: (state, action) => {
            state.summary = action.payload.summary
        },

        clearPlan: () => {
            return initialState
        }
    },

    extraReducers: (builder) => {
        builder.addCase(generateTaskPlan.fulfilled, (state, action) => {
            state.summary = action.payload.summary
        })
    }
})

export const { setPlan, clearPlan } = planSlice.actions
export default planSlice.reducer
