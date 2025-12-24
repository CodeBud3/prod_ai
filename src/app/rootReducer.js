import { combineReducers } from '@reduxjs/toolkit'
import userReducer from '../features/user/userSlice'
import tasksReducer from '../features/tasks/tasksSlice'
import planReducer from '../features/plan/planSlice'
import notificationsReducer from '../features/notifications/notificationsSlice'
import brainDumpReducer from '../features/brainDump/brainDumpSlice'

const rootReducer = combineReducers({
    user: userReducer,
    tasks: tasksReducer,
    plan: planReducer,
    notifications: notificationsReducer,
    brainDump: brainDumpReducer
})

export default rootReducer
