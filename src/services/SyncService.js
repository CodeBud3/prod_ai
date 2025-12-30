
import { supabase } from '../lib/supabase';

// SyncService handles data synchronization between the local Redux store and Supabase.
// It uses a strategy where the Redux store is the single source of truth for the UI,
// and this service keeps the cloud database in sync.

export const SyncService = {
    /**
     * Migrates local guest data to Supabase upon sign-up/sign-in.
     * Uses the 'content' JSONB column to store the full task object strictly.
     * 
     * @param {Array} localTasks - Array of task objects from Redux store
     * @param {string} userId - UUID of the authenticated user
     */
    async migrateGuestData(localTasks, userId) {
        if (!userId || !localTasks || localTasks.length === 0) return;

        console.log('SyncService: Migrating', localTasks.length, 'tasks for user', userId);

        const records = localTasks.map(task => ({
            id: String(task.id), // Ensure ID is string for DB
            user_id: userId,
            content: task,       // Store full object in JSONB
            created_at: new Date(task.createdAt || Date.now()).toISOString(),
            updated_at: new Date().toISOString(),
            // Promoted columns for easier querying/filtering if needed later
            status: task.status,
            priority: task.priority
        }));

        const { error } = await supabase
            .from('tasks')
            .upsert(records, { onConflict: 'id' });

        if (error) {
            console.error('SyncService: Migration failed', error);
            throw error;
        }

        console.log('SyncService: Migration successful');
    },

    /**
     * Pushes local changes to Supabase.
     * Can accept a single task or array of tasks.
     */
    async pushChanges(tasks, userId) {
        if (!userId) return;

        const tasksArray = Array.isArray(tasks) ? tasks : [tasks];
        if (tasksArray.length === 0) return;

        const records = tasksArray.map(task => ({
            id: String(task.id),
            user_id: userId,
            content: task,
            updated_at: new Date().toISOString(),
            status: task.status,
            priority: task.priority
        }));

        const { error } = await supabase
            .from('tasks')
            .upsert(records, { onConflict: 'id' });

        if (error) {
            console.error('SyncService: Push failed', error);
            throw error;
        }
    },

    /**
     * Pulls all tasks from Supabase for the user.
     * Returns the raw task objects (from the content column).
     */
    async pullChanges(userId) {
        if (!userId) return { data: null, error: 'No user ID' };

        const { data, error } = await supabase
            .from('tasks')
            .select('content')
            .eq('user_id', userId);

        if (error) {
            console.error('SyncService: Pull failed', error);
            return { data: null, error };
        }

        // Extract the original task objects
        const tasks = data.map(record => record.content);
        return { data: tasks, error: null };
    },

    /**
     * Deletes a task from Supabase.
     */
    async deleteTask(taskId, userId) {
        if (!userId || !taskId) return;

        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', String(taskId))
            .eq('user_id', userId);

        if (error) {
            console.error('SyncService: Delete failed', error);
            throw error;
        }
    }
};
