import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import rootReducer from './rootReducer'

const persistConfig = {
    key: 'prodai-redux-root',
    storage,
    whitelist: ['user', 'tasks', 'plan'], // notifications are ephemeral
    blacklist: ['notifications'] // Explicitly don't persist notifications
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore redux-persist actions
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
            }
        }),
    devTools: process.env.NODE_ENV !== 'production'
})

export const persistor = persistStore(store)
