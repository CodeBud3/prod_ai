import { combineReducers } from '@reduxjs/toolkit'
import userReducer from '../features/user/userSlice'
import tasksReducer from '../features/tasks/tasksSlice'
import planReducer from '../features/plan/planSlice'
import notificationsReducer from '../features/notifications/notificationsSlice'

const rootReducer = combineReducers({
    user: userReducer,
    tasks: tasksReducer,
    plan: planReducer,
    notifications: notificationsReducer
})

export default rootReducer
