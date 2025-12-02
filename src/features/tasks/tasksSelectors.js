import { createSelector } from '@reduxjs/toolkit'

// Basic selectors
export const selectAllTasks = (state) => state.tasks.items
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
