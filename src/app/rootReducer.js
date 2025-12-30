import { combineReducers } from '@reduxjs/toolkit'
import userReducer from '../features/user/userSlice'
import tasksReducer from '../features/tasks/tasksSlice'
import planReducer from '../features/plan/planSlice'
import notificationsReducer from '../features/notifications/notificationsSlice'
import brainDumpReducer from '../features/brainDump/brainDumpSlice'
import authReducer from '../features/auth/authSlice'

const rootReducer = combineReducers({
    user: userReducer,
    tasks: tasksReducer,
    plan: planReducer,
    notifications: notificationsReducer,
    brainDump: brainDumpReducer,
    auth: authReducer
})

export default rootReducer

