import { createSelector } from '@reduxjs/toolkit'

// Raw selector (includes deleted tasks) - for internal use
const selectAllTasksRaw = (state) => state.tasks.items;

// Basic selectors - filters out deleted tasks by default
export const selectAllTasks = createSelector(
    [selectAllTasksRaw],
    (tasks) => tasks.filter(t => !t.deleted)
);

export const selectDeletedTasks = createSelector(
    [selectAllTasksRaw],
    (tasks) => tasks.filter(t => t.deleted)
);

export const selectTasksLoading = (state) => state.tasks.loading
export const selectTasksError = (state) => state.tasks.error

// Memoized selectors for computed values
export const selectActiveTasks = createSelector(
    [selectAllTasks],
    (tasks) => tasks.filter(t => t.status !== 'done')
)

export const selectCompletedTasks = createSelector(
    [selectAllTasks],
    (tasks) => tasks.filter(t => t.status === 'done')
)

export const selectTasksByPriority = createSelector(
    [selectAllTasks],
    (tasks) => {
        const priorityMap = { high: 3, medium: 2, low: 1, none: 0 }
        return [...tasks].sort((a, b) =>
            priorityMap[b.priority || 'none'] - priorityMap[a.priority || 'none']
        )
    }
)

export const selectTasksByDueDate = createSelector(
    [selectAllTasks],
    (tasks) => {
        return [...tasks].sort((a, b) => {
            if (!a.dueDate) return 1
            if (!b.dueDate) return -1
            return new Date(a.dueDate) - new Date(b.dueDate)
        })
    }
)

export const selectRemindingTasks = createSelector(
    [selectAllTasks],
    (tasks) => tasks.filter(t => t.reminding)
)

export const selectTaskById = (taskId) =>
    createSelector(
        [selectAllTasks],
        (tasks) => tasks.find(t => t.id === taskId)
    )

export const selectTasksWithReminders = createSelector(
    [selectAllTasks],
    (tasks) => tasks.filter(t => t.remindAt)
)

export const selectTaskCount = createSelector(
    [selectAllTasks],
    (tasks) => tasks.length
)

export const selectCompletedTaskCount = createSelector(
    [selectCompletedTasks],
    (tasks) => tasks.length
)

// Executive Summary Selectors

export const selectTasksCompletedYesterday = createSelector(
    [selectCompletedTasks],
    (tasks) => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const endOfYesterday = new Date(yesterday);
        endOfYesterday.setHours(23, 59, 59, 999);

        return tasks.filter(t => {
            if (!t.completedAt) return false;
            const completedDate = new Date(t.completedAt);
            return completedDate >= yesterday && completedDate <= endOfYesterday;
        });
    }
)

export const selectTopPrioritiesToday = createSelector(
    [selectActiveTasks],
    (tasks) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);

        return tasks.filter(t => {
            // Due today
            if (t.dueDate) {
                const due = new Date(t.dueDate);
                if (due >= today && due <= endOfToday) return true;
            }
            // Or High/Critical Priority
            return t.priority === 'high' || t.priority === 'critical';
        }).sort((a, b) => {
            // Sort by priority then due date
            const pMap = { critical: 4, high: 3, medium: 2, low: 1, none: 0 };
            const pDiff = pMap[b.priority || 'none'] - pMap[a.priority || 'none'];
            if (pDiff !== 0) return pDiff;
            return (a.dueDate ? new Date(a.dueDate) : Infinity) - (b.dueDate ? new Date(b.dueDate) : Infinity);
        });
    }
)

export const selectTasksForTomorrow = createSelector(
    [selectActiveTasks],
    (tasks) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const endOfTomorrow = new Date(tomorrow);
        endOfTomorrow.setHours(23, 59, 59, 999);

        return tasks.filter(t => {
            if (!t.dueDate) return false;
            const due = new Date(t.dueDate);
            return due >= tomorrow && due <= endOfTomorrow;
        });
    }
)

export const selectUpcomingTasks = createSelector(
    [selectActiveTasks],
    (tasks) => {
        const dayAfterTomorrow = new Date();
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        dayAfterTomorrow.setHours(0, 0, 0, 0);

        return tasks.filter(t => {
            if (!t.dueDate) return false;
            const due = new Date(t.dueDate);
            return due >= dayAfterTomorrow;
        });
    }
)

export const selectDelegatedTasks = createSelector(
    [selectActiveTasks],
    (tasks) => tasks.filter(t => t.assignee && t.assignee.trim() !== '')
)

export const selectMyTasks = createSelector(
    [selectActiveTasks],
    (tasks) => tasks.filter(t => !t.assignee || t.assignee.trim() === '')
)

export const selectDecisionTasks = createSelector(
    [selectActiveTasks],
    (tasks) => tasks.filter(t => t.tags && t.tags.some(tag => tag.toLowerCase() === 'decision'))
)
