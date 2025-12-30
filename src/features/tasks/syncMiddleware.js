
import { SyncService } from '../../services/SyncService';

export const syncMiddleware = store => next => action => {
    // Process the action normally first (Optimistic UI)
    const result = next(action);

    // Get updated state
    const state = store.getState();
    const { user, isAuthenticated } = state.auth;

    // Only sync if authenticated and user exists
    if (!isAuthenticated || !user) {
        return result;
    }

    // List of actions that change task data
    const taskActions = [
        'tasks/addTask',
        'tasks/updateTask',
        'tasks/deleteTask', // Soft delete is an update
        'tasks/restoreTask', // Restore is an update
        'tasks/toggleTask',
        'tasks/setReminder',
        'tasks/dismissReminder',
        'tasks/setFocusColor',
        'tasks/bulkAddTasks', // Handle bulk adds
        'tasks/permanentlyDeleteTask'
    ];

    if (taskActions.includes(action.type)) {
        handleTaskSync(action, state, user.id);
    }

    return result;
};

const handleTaskSync = (action, state, userId) => {
    try {
        switch (action.type) {
            case 'tasks/addTask':
                // Payload is the task object
                SyncService.pushChanges(action.payload, userId);
                break;

            case 'tasks/bulkAddTasks':
                // Payload is array of tasks
                SyncService.pushChanges(action.payload, userId);
                break;

            case 'tasks/permanentlyDeleteTask':
                // Payload is taskId
                SyncService.deleteTask(action.payload, userId);
                break;

            case 'tasks/updateTask':
                // Payload: { id, updates }
                {
                    const task = state.tasks.items.find(t => t.id === action.payload.id);
                    if (task) SyncService.pushChanges(task, userId);
                }
                break;

            case 'tasks/deleteTask':
            case 'tasks/restoreTask':
            case 'tasks/toggleTask':
            case 'tasks/dismissReminder':
                // Payload is taskId
                {
                    const task = state.tasks.items.find(t => t.id === action.payload);
                    if (task) SyncService.pushChanges(task, userId);
                }
                break;

            case 'tasks/setReminder':
            case 'tasks/setFocusColor':
                // Payload: { taskId, ... }
                {
                    const task = state.tasks.items.find(t => t.id === action.payload.taskId);
                    if (task) SyncService.pushChanges(task, userId);
                }
                break;

            default:
                break;
        }
    } catch (error) {
        console.error('Middleware Sync Error:', error);
        // Silent fail for now, maybe dispatch a sync error notification later
    }
};
