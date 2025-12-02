import { createSlice } from '@reduxjs/toolkit'

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState: [],
    reducers: {
        addNotification: (state, action) => {
            // Check if notification already exists
            const exists = state.some(n => n.taskId === action.payload.taskId)
            if (!exists) {
                state.push({
                    id: Date.now() + Math.random(),
                    timestamp: Date.now(),
                    ...action.payload
                })
            }
        },

        removeNotification: (state, action) => {
            return state.filter(n => n.id !== action.payload)
        },

        clearAllNotifications: () => {
            return []
        },

        clearNotificationsByTaskId: (state, action) => {
            return state.filter(n => n.taskId !== action.payload)
        }
    }
})

export const {
    addNotification,
    removeNotification,
    clearAllNotifications,
    clearNotificationsByTaskId
} = notificationsSlice.actions

export default notificationsSlice.reducer
