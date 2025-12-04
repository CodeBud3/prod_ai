import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage' // Fallback
import createIndexedDBStorage from 'redux-persist-indexeddb-storage'
import rootReducer from './rootReducer'

// Create IndexedDB storage with fallback to localStorage
const createStorage = () => {
    try {
        console.log('Initializing IndexedDB storage...');
        const idbStorage = createIndexedDBStorage({
            name: 'prodai-db',
            storeName: 'redux-store'
        });
        console.log('IndexedDB storage initialized:', idbStorage);
        return idbStorage;
    } catch (error) {
        console.warn('IndexedDB unavailable, falling back to localStorage:', error);
        return storage;
    }
}

const persistConfig = {
    key: 'prodai-redux-root',
    storage: createStorage(),
    whitelist: ['user', 'tasks', 'plan'] // notifications are ephemeral
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
        }).concat(store => next => action => {
            if (action.type.startsWith('persist/')) {
                console.log('Redux Persist Action:', action.type, action);
                if (action.type === 'persist/REHYDRATE' && action.payload) {
                    console.log('Rehydrated State Payload:', action.payload);
                    console.log('Tasks in Payload:', action.payload.tasks);
                }
            }
            return next(action);
        }),
    devTools: process.env.NODE_ENV !== 'production'
})

export const persistor = persistStore(store)
