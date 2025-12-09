import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    name: '',
    role: '',
    onboarded: false,
    preferences: {
        gamification: false,
        focusMode: false,
        theme: 'dark'
    }
}

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action) => {
            return { ...state, ...action.payload }
        },
        updatePreferences: (state, action) => {
            state.preferences = { ...state.preferences, ...action.payload }
        },
        setTheme: (state, action) => {
            state.preferences.theme = action.payload
        },
        toggleFocusMode: (state, action) => {
            state.preferences.focusMode = action.payload
        },
        completeOnboarding: (state, action) => {
            state.name = action.payload.name
            state.role = action.payload.role
            state.onboarded = true
        },
        updateName: (state, action) => {
            state.name = action.payload
        },
        updateRole: (state, action) => {
            state.role = action.payload
        }
    }
})

export const {
    setUser,
    updatePreferences,
    setTheme,
    toggleFocusMode,
    completeOnboarding,
    updateName,
    updateRole
} = userSlice.actions

export default userSlice.reducer
