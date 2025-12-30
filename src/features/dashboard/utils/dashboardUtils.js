/**
 * Dashboard utility functions for task sorting and scoring.
 */

/**
 * Calculate a smart priority score for a task.
 * Higher scores = higher priority in the task list.
 * 
 * Scoring factors (in order of weight):
 * 1. Focus pointer (manual user focus)
 * 2. Priority level (critical/high)
 * 3. Deadline proximity (overdue > due today > has deadline)
 * 4. Active reminders
 * 5. Quick wins (low effort, high impact)
 * 6. Recency (tie-breaker)
 * 
 * @param {Object} task - Task object
 * @returns {number} Priority score
 */
export const calculateSmartScore = (task) => {
    let score = 0;
    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Focus Pointer (Highest Priority)
    if (task.focusColor) score += 1000;

    // 2. Criticality / Eisenhower
    if (task.priority === 'critical' || task.eisenhowerQuadrant === 'q1') score += 500;
    if (task.priority === 'high') score += 200;

    // 3. Deadlines
    if (task.dueDate) {
        const due = new Date(task.dueDate);
        if (due < now) score += 400; // Overdue
        else if (due <= endOfToday) score += 300; // Due Today
        else score += 50; // Has deadline
    }

    // 4. Reminders
    if (task.reminding) score += 150;
    if (task.remindAt && task.remindAt <= now) score += 100;

    // 5. Effort / Impact (Quick Wins)
    if (task.impactEffortQuadrant === 'quick_wins') score += 50;

    // 6. Recency (Tie-breaker)
    score += (task.createdAt / 10000000000);

    return score;
};

/**
 * Sort tasks based on the specified sort method.
 * 
 * @param {Array} taskList - Array of task objects
 * @param {string} sortBy - Sort method: 'smart' | 'date_added' | 'priority' | 'due_date'
 * @returns {Array} Sorted task array
 */
export const getSortedTasks = (taskList, sortBy) => {
    let sorted = [...taskList];
    switch (sortBy) {
        case 'date_added':
            return sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        case 'priority':
            const pMap = { critical: 4, high: 3, medium: 2, low: 1, none: 0 };
            return sorted.sort((a, b) => pMap[b.priority || 'none'] - pMap[a.priority || 'none']);
        case 'due_date':
            return sorted.sort((a, b) => {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            });
        case 'smart':
        default:
            return sorted.sort((a, b) => calculateSmartScore(b) - calculateSmartScore(a));
    }
};

/**
 * Format a timestamp into a human-readable relative time string.
 * 
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted string like "2h ago" or "just now"
 */
export const formatTimestamp = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
};

/**
 * Get priority color for visual indicators.
 * 
 * @param {string} priority - Priority level
 * @returns {string} CSS color value
 */
export const getPriorityColor = (priority) => {
    switch (priority) {
        case 'critical': return 'var(--accent-danger)';
        case 'high': return 'var(--accent-warning)';
        case 'medium': return 'var(--accent-primary)';
        case 'low': return 'var(--text-secondary)';
        default: return 'var(--text-muted)';
    }
};
