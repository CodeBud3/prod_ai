import { createSelector } from '@reduxjs/toolkit'

// Basic selectors
export const selectUser = (state) => state.user
export const selectUserPreferences = (state) => state.user.preferences
export const selectTheme = (state) => state.user.preferences.theme
export const selectIsOnboarded = (state) => state.user.onboarded
export const selectFocusMode = (state) => state.user.preferences.focusMode
export const selectUserRole = (state) => state.user.role

// Memoized selector
export const selectUserDisplayName = createSelector(
    [selectUser],
    (user) => user.name || 'User'
)
