import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage' // Fallback
import createIndexedDBStorage from 'redux-persist-indexeddb-storage'
import rootReducer from './rootReducer'
import { syncMiddleware } from '../features/tasks/syncMiddleware'

// Create IndexedDB storage with fallback to localStorage
// Create IndexedDB storage with fallback to localStorage
const createStorage = () => {
    try {
        console.log('Initializing IndexedDB storage...');
        const idbStorage = createIndexedDBStorage({
            name: 'prodai-db',
            storeName: 'redux-store'
        });

        // Debug wrapper to log storage operations
        const debugStorage = {
            getItem: async (key) => {
                console.log(`[Storage] Reading ${key}...`);
                try {
                    const val = await idbStorage.getItem(key);
                    console.log(`[Storage] Read success for ${key}`, val ? '(found)' : '(null)');
                    return val;
                } catch (err) {
                    console.error(`[Storage] Read error for ${key}:`, err);
                    throw err;
                }
            },
            setItem: async (key, value) => {
                console.log(`[Storage] Writing ${key}... (Length: ${value?.length})`);
                try {
                    await idbStorage.setItem(key, value);
                    console.log(`[Storage] Write success for ${key}`);
                } catch (err) {
                    console.error(`[Storage] Write error for ${key}:`, err);
                    throw err;
                }
            },
            removeItem: async (key) => {
                console.log(`[Storage] Removing ${key}...`);
                try {
                    await idbStorage.removeItem(key);
                    console.log(`[Storage] Remove success for ${key}`);
                } catch (err) {
                    console.error(`[Storage] Remove error for ${key}:`, err);
                    throw err;
                }
            }
        };

        console.log('IndexedDB storage initialized with debug wrapper');
        return debugStorage;
    } catch (error) {
        console.warn('IndexedDB unavailable, falling back to localStorage:', error);
        return storage;
    }
}

const persistConfig = {
    key: 'prodai-redux-root',
    storage: createStorage(),
    whitelist: ['user', 'tasks', 'plan', 'auth'] // notifications are ephemeral
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
        }).concat(syncMiddleware),
    devTools: process.env.NODE_ENV !== 'production'
})

export const persistor = persistStore(store)
