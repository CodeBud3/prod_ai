import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AiEngine } from '../../../services/AiEngine';
import { QuickAdd, EditTaskModal, TaskItem, PrioritizationStudio } from '../../tasks';
import { GoblinMode } from '../../tasks/components/GoblinMode';
import { BoredDice } from '../../tasks/components/BoredDice';
import { UserSettingsModal } from '../../user/components/UserSettingsModal';
import { NotificationPanel } from '../../notifications';
import { CircularProgress, FunnyTooltip } from '../../../components/ui';
import { ExecutiveSummary } from './ExecutiveSummary';
import { selectUser, selectTheme, selectFocusMode } from '../../user/userSelectors';
import { toggleFocusMode } from '../../user/userSlice';
import { selectAllTasks, selectMyTasks, selectDelegatedTasks } from '../../tasks/tasksSelectors';
import { addTask, updateTask, deleteTask, toggleTask, setReminder, dismissReminder, setFocusColor, checkReminders, generateTaskPlan, TASK_CATEGORIES } from '../../tasks/tasksSlice';
import { selectPlanSummary, selectHasPlan } from '../../plan/planSelectors';
import { clearPlan } from '../../plan/planSlice';
import { addNotification, removeNotification, clearAllNotifications } from '../../notifications/notificationsSlice';
import { selectAllNotifications } from '../../notifications/notificationsSelectors';

// --- Sorting Helper Functions ---
const calculateSmartScore = (task) => {
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

const getSortedTasks = (taskList, sortBy) => {
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

// --- Reusable Task Section Component ---
const TaskSection = ({ title, icon, tasks, count, onToggleTask, setEditingTask, handleSetReminder, handleDismissReminder, onDeleteTask, getPriorityColor, formatTimestamp, handleSetFocus, onUpdateTask, defaultSort = 'smart', defaultGroup = 'none', sortBy: externalSortBy, setSortBy: externalSetSortBy }) => {
    const [internalSortBy, setInternalSortBy] = useState(defaultSort);
    const [groupBy, setGroupBy] = useState(defaultGroup);
    const [viewFilter, setViewFilter] = useState('all');

    // Use external sortBy if provided (for My Tasks in Focus Mode), otherwise use internal state
    const sortBy = externalSortBy !== undefined ? externalSortBy : internalSortBy;
    const setSortBy = externalSetSortBy || setInternalSortBy;

    // View Filtering
    const getFilteredTasks = (taskList) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const endOfTomorrow = new Date(tomorrow);
        endOfTomorrow.setHours(23, 59, 59, 999);

        switch (viewFilter) {
            case 'todo':
                return taskList.filter(t => t.status !== 'done');
            case 'completed':
                return taskList.filter(t => t.status === 'done');
            case 'focus':
                return taskList.filter(t => {
                    if (t.status === 'done') return false;
                    // High/Critical priority
                    if (t.priority === 'high' || t.priority === 'critical') return true;
                    // Due today
                    if (t.dueDate) {
                        const due = new Date(t.dueDate);
                        return due >= today && due <= endOfToday;
                    }
                    return false;
                });
            case 'tomorrow':
                return taskList.filter(t => {
                    if (t.status === 'done') return false;
                    if (!t.dueDate) return false;
                    const due = new Date(t.dueDate);
                    return due >= tomorrow && due <= endOfTomorrow;
                });
            case 'horizon':
                return taskList.filter(t => {
                    if (t.status === 'done') return false;
                    if (!t.dueDate) return false;
                    const due = new Date(t.dueDate);
                    return due > endOfTomorrow;
                });
            case 'all':
            default:
                return taskList;
        }
    };

    const renderTaskList = (taskList) => {
        const filtered = getFilteredTasks(taskList);
        const sorted = getSortedTasks(filtered, sortBy);

        if (sorted.length === 0) {
            return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>No tasks found.</div>;
        }

        if (groupBy === 'tags') {
            return Object.entries(sorted.reduce((groups, task) => {
                const taskTags = task.tags && task.tags.length > 0 ? task.tags : ['Untagged'];
                taskTags.forEach(tag => {
                    if (!groups[tag]) groups[tag] = [];
                    groups[tag].push(task);
                });
                return groups;
            }, {})).map(([tag, groupTasks]) => (
                <div key={tag} style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                        {tag} <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>{groupTasks.length}</span>
                    </h3>
                    {groupTasks.map(task => (
                        <TaskItem
                            key={`${tag}-${task.id}`}
                            task={task}
                            toggleTask={onToggleTask}
                            setEditingTask={setEditingTask}
                            handleSetReminder={handleSetReminder}
                            handleDismissReminder={handleDismissReminder}
                            onDeleteTask={onDeleteTask}
                            getPriorityColor={getPriorityColor}
                            formatTimestamp={formatTimestamp}
                            handleSetFocus={handleSetFocus}
                            onUpdateTask={(id, updates) => dispatch(updateTask({ id, updates }))}
                        />
                    ))}
                </div>
            ));
        } else if (groupBy === 'date') {
            const buckets = { 'Today': [], 'Next 3 Days': [], 'Next Week': [], 'Upcoming': [], 'No Date': [] };
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            sorted.forEach(task => {
                if (!task.dueDate) { buckets['No Date'].push(task); return; }
                const dueDate = new Date(task.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                const diffTime = dueDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays <= 0) buckets['Today'].push(task);
                else if (diffDays <= 3) buckets['Next 3 Days'].push(task);
                else if (diffDays <= 7) buckets['Next Week'].push(task);
                else buckets['Upcoming'].push(task);
            });

            return Object.entries(buckets).map(([bucket, tasks]) => {
                if (tasks.length === 0) return null;
                return (
                    <div key={bucket} style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '12px', color: bucket === 'Today' ? 'var(--accent-primary)' : 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                            {bucket} <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>{tasks.length}</span>
                        </h3>
                        {tasks.map(task => (
                            <TaskItem
                                key={`${bucket}-${task.id}`}
                                task={task}
                                toggleTask={onToggleTask}
                                setEditingTask={setEditingTask}
                                handleSetReminder={handleSetReminder}
                                handleDismissReminder={handleDismissReminder}
                                onDeleteTask={onDeleteTask}
                                getPriorityColor={getPriorityColor}
                                formatTimestamp={formatTimestamp}
                                handleSetFocus={handleSetFocus}
                                onUpdateTask={onUpdateTask}
                            />
                        ))}
                    </div>
                );
            });
        } else if (groupBy === 'project') {
            return Object.entries(sorted.reduce((groups, task) => {
                const project = task.project || 'No Project';
                if (!groups[project]) groups[project] = [];
                groups[project].push(task);
                return groups;
            }, {})).map(([project, groupTasks]) => (
                <div key={project} style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                        {project} <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>{groupTasks.length}</span>
                    </h3>
                    {groupTasks.map(task => (
                        <TaskItem
                            key={`${project}-${task.id}`}
                            task={task}
                            toggleTask={onToggleTask}
                            setEditingTask={setEditingTask}
                            handleSetReminder={handleSetReminder}
                            handleDismissReminder={handleDismissReminder}
                            onDeleteTask={onDeleteTask}
                            getPriorityColor={getPriorityColor}
                            formatTimestamp={formatTimestamp}
                            handleSetFocus={handleSetFocus}
                            onUpdateTask={onUpdateTask}
                        />
                    ))}
                </div>
            ));
        } else if (groupBy === 'assignee') {
            return Object.entries(sorted.reduce((groups, task) => {
                const assignee = task.assignee || 'Unassigned';
                if (!groups[assignee]) groups[assignee] = [];
                groups[assignee].push(task);
                return groups;
            }, {})).map(([assignee, groupTasks]) => (
                <div key={assignee} style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                        {assignee} <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>{groupTasks.length}</span>
                    </h3>
                    {groupTasks.map(task => (
                        <TaskItem
                            key={`${assignee}-${task.id}`}
                            task={task}
                            toggleTask={onToggleTask}
                            setEditingTask={setEditingTask}
                            handleSetReminder={handleSetReminder}
                            handleDismissReminder={handleDismissReminder}
                            onDeleteTask={onDeleteTask}
                            getPriorityColor={getPriorityColor}
                            formatTimestamp={formatTimestamp}
                            handleSetFocus={handleSetFocus}
                            onUpdateTask={onUpdateTask}
                        />
                    ))}
                </div>
            ));
        }

        // Default list
        return sorted.map(task => (
            <TaskItem
                key={task.id}
                task={task}
                toggleTask={onToggleTask}
                setEditingTask={setEditingTask}
                handleSetReminder={handleSetReminder}
                handleDismissReminder={handleDismissReminder}
                onDeleteTask={onDeleteTask}
                getPriorityColor={getPriorityColor}
                formatTimestamp={formatTimestamp}
                handleSetFocus={handleSetFocus}
                onUpdateTask={onUpdateTask}
            />
        ));
    };

    return (
        <div className="glass-panel" style={{ padding: '20px', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <span>{icon}</span> {title}
                    <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                        {count}
                    </span>
                </h2>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {['all', 'todo', 'focus', 'tomorrow', 'horizon', 'completed'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setViewFilter(filter)}
                            style={{
                                padding: '4px 8px',
                                fontSize: '10px',
                                borderRadius: '4px',
                                border: 'none',
                                background: viewFilter === filter ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                                color: viewFilter === filter ? 'white' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                textTransform: 'capitalize'
                            }}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FunnyTooltip context="sort">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'var(--text-secondary)',
                                fontSize: '10px',
                                padding: '4px',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="smart">Sort: Smart</option>
                            <option value="priority">Sort: Priority</option>
                            <option value="due_date">Sort: Due Date</option>
                            <option value="date_added">Sort: Added</option>
                        </select>
                    </FunnyTooltip>

                    <FunnyTooltip context="group">
                        <select
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value)}
                            style={{
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'var(--text-secondary)',
                                fontSize: '10px',
                                padding: '4px',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="none">Group: None</option>
                            <option value="tags">Group: Tags</option>
                            <option value="date">Group: Date</option>
                            <option value="project">Group: Project</option>
                            <option value="assignee">Group: Assignee</option>
                        </select>
                    </FunnyTooltip>
                </div>
            </div>

            {renderTaskList(tasks)}
        </div>
    );
};

export function Dashboard() {
    const dispatch = useDispatch();

    // Get all state from Redux
    const user = useSelector(selectUser);
    const tasks = useSelector(selectAllTasks);
    const planSummary = useSelector(selectPlanSummary);
    const hasPlan = useSelector(selectHasPlan);
    const theme = useSelector(selectTheme);
    const isFocusMode = useSelector(selectFocusMode);
    const notifications = useSelector(selectAllNotifications);

    const [loading, setLoading] = useState(!hasPlan && tasks.length > 0);
    const [editingTask, setEditingTask] = useState(null);
    const [showPrioritization, setShowPrioritization] = useState(false);
    const [myTasksSort, setMyTasksSort] = useState('smart'); // Lifted state for My Tasks sort
    const [activeFilter, setActiveFilter] = useState(null); // Sidebar filter: 'yesterday', 'today', 'actions', 'delegations', 'decisions', 'tomorrow', 'horizon'
    const [activeBucket, setActiveBucket] = useState(null); // Bucket filter: 'work', 'personal', 'errands'
    const [showGoblinMode, setShowGoblinMode] = useState(false); // Goblin Mode (panic button)
    const [showBoredDice, setShowBoredDice] = useState(false); // I'm Bored Dice
    const [showSettings, setShowSettings] = useState(false); // User Settings Modal

    // Check for reminders
    useEffect(() => {
        const interval = setInterval(() => {
            dispatch(checkReminders());

            // Check for follow-ups
            const now = Date.now();
            const followUpDueTasks = tasks.filter(task => {
                const isDue = task.followUp?.dueAt &&
                    task.followUp.dueAt <= now &&
                    task.followUp.status === 'pending';

                if (!isDue) return false;
                return true;
            });

            if (followUpDueTasks.length > 0) {
                followUpDueTasks.forEach(task => {
                    // Check if already notified
                    if (!notifications.some(n => n.taskId === task.id)) {
                        dispatch(addNotification({
                            taskId: task.id,
                            message: `${task.title} ${task.assignee ? `(${task.assignee})` : ''}`
                        }));
                    }
                });
            }

            // Check for active reminders (re-trigger notification if missing, e.g. after reload)
            const activeReminders = tasks.filter(task => task.reminding);
            if (activeReminders.length > 0) {
                activeReminders.forEach(task => {
                    if (!notifications.some(n => n.taskId === task.id)) {
                        dispatch(addNotification({
                            taskId: task.id,
                            message: `${task.title} (Reminder)`
                        }));
                    }
                });
            }
        }, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, [dispatch, tasks, notifications]);

    useEffect(() => {
        if (!hasPlan && tasks.length > 0) {
            dispatch(generateTaskPlan({ tasks, role: user.role }))
                .unwrap()
                .then(() => setLoading(false))
                .catch(() => setLoading(false));
        }
    }, [dispatch, hasPlan, tasks, user.role]);

    const handleAddTask = async (newTask) => {
        const task = {
            id: Date.now() + Math.random(),
            status: 'todo',
            createdAt: Date.now(),
            ...newTask
        };
        dispatch(addTask(task));
    };

    const handleSaveTask = (updatedTask) => {
        dispatch(updateTask({ id: updatedTask.id, updates: updatedTask }));
        setEditingTask(null);
    };

    const handleDeleteTask = (taskId) => {
        dispatch(deleteTask(taskId));
    };

    const handleSetReminder = (taskId, minutes) => {
        dispatch(setReminder({ taskId, minutes }));
    };

    const handleDismissReminder = (taskId) => {
        dispatch(dismissReminder(taskId));
    };

    const handleSetFocus = (taskId, color) => {
        dispatch(setFocusColor({ taskId, color }));
    };

    const handleToggleTask = (id) => {
        dispatch(toggleTask(id));
    };

    const formatTimestamp = (timestamp) => {
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

    if (loading) {
        return (
            <div className="glass-panel fade-in" style={{ padding: '40px', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '16px' }}>Analyzing your workload...</h2>
                <div className="loader"></div>
                <p style={{ color: 'var(--text-secondary)' }}>Applying {user.role} context...</p>
            </div>
        );
    }

    const myTasks = tasks.filter(t => !t.assignee || t.assignee.trim() === '');
    const delegatedTasks = tasks.filter(t => t.assignee && t.assignee.trim() !== '');

    // Apply sidebar filter
    const getFilteredTasks = (taskList, isDelegated = false) => {
        let filtered = taskList;

        // Apply Bucket Filter
        if (activeBucket) {
            filtered = filtered.filter(t => t.category === activeBucket);
        }

        if (!activeFilter) return filtered;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

        switch (activeFilter) {
            case 'yesterday':
                // Tasks completed yesterday
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                return taskList.filter(t => {
                    if (t.status !== 'done' || !t.completedAt) return false;
                    const completedDate = new Date(t.completedAt);
                    return completedDate >= yesterday && completedDate < today;
                });
            case 'today':
                // Top priority tasks for today (critical/high priority or due today)
                return taskList.filter(t => {
                    if (t.status === 'done') return false;
                    if (t.priority === 'critical' || t.priority === 'high') return true;
                    if (t.dueDate) {
                        const dueDate = new Date(t.dueDate);
                        return dueDate >= today && dueDate < tomorrow;
                    }
                    return false;
                });
            case 'actions':
                // Only my tasks (already filtered)
                return isDelegated ? [] : taskList.filter(t => t.status !== 'done');
            case 'delegations':
                // Only delegated tasks
                return isDelegated ? taskList.filter(t => t.status !== 'done') : [];
            case 'decisions':
                // Tasks marked as decisions
                return taskList.filter(t => t.status !== 'done' && t.project?.toLowerCase().includes('decision'));
            case 'tomorrow':
                // Tasks due tomorrow
                return taskList.filter(t => {
                    if (t.status === 'done' || !t.dueDate) return false;
                    const dueDate = new Date(t.dueDate);
                    return dueDate >= tomorrow && dueDate < dayAfterTomorrow;
                });
            case 'horizon':
                // Tasks due after tomorrow
                return taskList.filter(t => {
                    if (t.status === 'done' || !t.dueDate) return false;
                    const dueDate = new Date(t.dueDate);
                    return dueDate >= dayAfterTomorrow;
                });
            default:
                return taskList;
        }
    };

    const filteredMyTasks = getFilteredTasks(myTasks, false);
    const filteredDelegatedTasks = getFilteredTasks(delegatedTasks, true);

    // Get sorted my tasks for Focus Mode
    const sortedMyTasks = getSortedTasks(myTasks.filter(t => t.status !== 'done'), myTasksSort);
    const currentTask = sortedMyTasks[0]; // Use first task from sorted list

    if (isFocusMode && currentTask) {
        return (
            <div className="glass-panel fade-in" style={{ padding: '60px', textAlign: 'center', maxWidth: '800px', width: '100%' }}>
                <div style={{ marginBottom: '24px', color: 'var(--accent-primary)', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
                    Current Focus
                </div>
                <h1 style={{ fontSize: '48px', marginBottom: '40px', lineHeight: 1.2 }}>
                    {currentTask.title}
                </h1>
                {currentTask.description && (
                    <div style={{ marginBottom: '32px', color: 'var(--text-secondary)', fontSize: '18px', lineHeight: '1.6' }}>
                        {currentTask.description}
                    </div>
                )}
                {currentTask.dueDate && (
                    <div style={{ marginBottom: '32px', color: 'var(--accent-warning)' }}>
                        Due: {currentTask.dueDate}
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                    <button onClick={() => handleToggleTask(currentTask.id)} className="btn-primary" style={{ fontSize: '18px', padding: '16px 32px' }}>
                        Mark Complete
                    </button>
                    <button onClick={() => dispatch(toggleFocusMode(false))} className="btn-secondary">
                        Exit Focus
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', maxWidth: '98%', padding: '20px', display: 'flex', gap: '32px', alignItems: 'flex-start', margin: '0 auto' }}>
            {/* Hidden iframe to unlock Chrome autoplay - plays silent audio on page load */}
            <iframe
                src="/silence.mp3"
                allow="autoplay"
                style={{ display: 'none' }}
                title="Audio unlock"
            />

            {/* Left Sidebar */}
            <div style={{ width: '300px', flexShrink: 0, position: 'sticky', top: '20px' }}>
                {/* Bucket Filter */}
                <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px', letterSpacing: '1px' }}>
                        Life Buckets
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                            onClick={() => setActiveBucket(null)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: 'none',
                                background: !activeBucket ? 'rgba(255,255,255,0.1)' : 'transparent',
                                color: !activeBucket ? 'white' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                textAlign: 'left'
                            }}
                        >
                            <span>🌍</span> All Tasks
                        </button>
                        {Object.values(TASK_CATEGORIES).map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveBucket(activeBucket === cat.id ? null : cat.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: activeBucket === cat.id ? cat.color : 'transparent',
                                    color: activeBucket === cat.id ? 'white' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    textAlign: 'left'
                                }}
                            >
                                <span>{cat.icon}</span> {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                <ExecutiveSummary
                    vertical={true}
                    activeFilter={activeFilter}
                    onFilterChange={(filter) => setActiveFilter(activeFilter === filter ? null : filter)}
                />
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>
                            Good Morning, <span
                                onClick={() => setShowSettings(true)}
                                style={{ cursor: 'pointer', borderBottom: '2px dashed rgba(255,255,255,0.3)', transition: 'all 0.2s' }}
                                title="Click to edit your profile"
                            >{user.name}</span>
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>{planSummary || 'Here is your executive summary.'}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ position: 'relative' }}>
                            <span style={{ fontSize: '20px', cursor: 'pointer' }}>🔔</span>
                            {notifications.length > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-5px',
                                    right: '-5px',
                                    background: 'var(--accent-danger)',
                                    color: 'white',
                                    fontSize: '10px',
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold'
                                }}>
                                    {notifications.length}
                                </span>
                            )}
                        </div>
                        <button onClick={() => dispatch(toggleFocusMode(true))} className="btn-primary" disabled={!tasks.some(t => t.status !== 'done')}>
                            Enter Focus Mode
                        </button>
                        <button
                            onClick={() => setShowGoblinMode(true)}
                            className="btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            disabled={!tasks.some(t => t.status !== 'done')}
                            title="Panic Button - Just one task"
                        >
                            👹 Goblin Mode
                        </button>
                        <button
                            onClick={() => setShowBoredDice(true)}
                            className="btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            disabled={!tasks.some(t => t.status !== 'done')}
                            title="Can't decide? Roll the dice!"
                        >
                            🎲 I'm Bored
                        </button>
                        <button
                            onClick={() => setShowPrioritization(true)}
                            className="btn-secondary"
                        >
                            Help me prioritize
                        </button>
                    </div>
                </header>

                <QuickAdd onAdd={handleAddTask} />

                {/* Split View Grid */}
                {activeFilter && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '16px',
                        padding: '12px 16px',
                        background: 'rgba(139, 92, 246, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid var(--accent-primary)'
                    }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            Filtering: <strong style={{ color: 'var(--accent-primary)' }}>{activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}</strong>
                        </span>
                        <button
                            onClick={() => setActiveFilter(null)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: '16px',
                                padding: '0 4px'
                            }}
                            title="Clear filter"
                        >
                            ✕
                        </button>
                    </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* My Tasks Column */}
                    <TaskSection
                        title={activeFilter ? `My Tasks (${filteredMyTasks.length} filtered)` : "My Tasks"}
                        icon="👤"
                        tasks={filteredMyTasks}
                        count={filteredMyTasks.length}
                        onToggleTask={handleToggleTask}
                        setEditingTask={setEditingTask}
                        handleSetReminder={handleSetReminder}
                        handleDismissReminder={handleDismissReminder}
                        onDeleteTask={handleDeleteTask}
                        getPriorityColor={getPriorityColor}
                        formatTimestamp={formatTimestamp}
                        handleSetFocus={handleSetFocus}
                        onUpdateTask={(id, updates) => dispatch(updateTask({ id, updates }))}
                        defaultSort="smart"
                        defaultGroup="project"
                        sortBy={myTasksSort}
                        setSortBy={setMyTasksSort}
                    />

                    {/* Assigned to Others Column */}
                    <TaskSection
                        title={activeFilter ? `Assigned to Others (${filteredDelegatedTasks.length} filtered)` : "Assigned to Others"}
                        icon="👥"
                        tasks={filteredDelegatedTasks}
                        count={filteredDelegatedTasks.length}
                        onToggleTask={handleToggleTask}
                        setEditingTask={setEditingTask}
                        handleSetReminder={handleSetReminder}
                        handleDismissReminder={handleDismissReminder}
                        onDeleteTask={handleDeleteTask}
                        getPriorityColor={getPriorityColor}
                        formatTimestamp={formatTimestamp}
                        handleSetFocus={handleSetFocus}
                        onUpdateTask={(id, updates) => dispatch(updateTask({ id, updates }))}
                        defaultSort="smart"
                        defaultGroup="assignee"
                    />
                </div>
            </div>

            {editingTask && (
                <EditTaskModal
                    task={editingTask}
                    onSave={handleSaveTask}
                    onCancel={() => setEditingTask(null)}
                />
            )}

            <NotificationPanel
                notifications={notifications}
                onDismiss={(notificationId) => {
                    dispatch(removeNotification(notificationId));
                }}
                onSnooze={(taskId, notificationId) => {
                    const task = tasks.find(t => t.id === taskId);
                    if (task) {
                        dispatch(updateTask({
                            id: task.id,
                            updates: {
                                reminding: false,
                                followUp: task.assignee ? {
                                    ...(task.followUp || {}),
                                    dueAt: Date.now() + 60 * 60 * 1000, // 1 hour
                                    startedAt: Date.now(),
                                    status: 'pending'
                                } : task.followUp,
                                remindAt: !task.assignee ? Date.now() + 60 * 60 * 1000 : task.remindAt,
                                reminderStartedAt: !task.assignee ? Date.now() : task.reminderStartedAt
                            }
                        }));
                    }
                    dispatch(removeNotification(notificationId));
                }}
                onComplete={(taskId, notificationId) => {
                    const task = tasks.find(t => t.id === taskId);
                    if (task) {
                        dispatch(updateTask({
                            id: task.id,
                            updates: {
                                reminding: false,
                                followUp: task.assignee ? {
                                    ...(task.followUp || {}),
                                    status: 'completed',
                                    dueAt: null
                                } : task.followUp,
                                remindAt: !task.assignee ? null : task.remindAt,
                                reminderStartedAt: !task.assignee ? null : task.reminderStartedAt
                            }
                        }));
                    }
                    dispatch(removeNotification(notificationId));
                }}
            />

            {showPrioritization && (
                <PrioritizationStudio
                    onClose={() => setShowPrioritization(false)}
                />
            )}
            {/* Storage Status Footer */}
            <div style={{
                position: 'fixed',
                bottom: '10px',
                right: '10px',
                fontSize: '10px',
                color: 'var(--text-muted)',
                opacity: 0.5,
                pointerEvents: 'none',
                display: 'flex',
                gap: '8px',
                zIndex: 1000
            }}>
                <span>Storage: {window.indexedDB ? 'IndexedDB (Active)' : 'LocalStorage (Fallback)'}</span>
                <span>v1.2</span>
            </div>

            {/* Goblin Mode */}
            {showGoblinMode && (
                <GoblinMode onExit={() => setShowGoblinMode(false)} />
            )}

            {/* I'm Bored Dice */}
            {showBoredDice && (
                <BoredDice onClose={() => setShowBoredDice(false)} />
            )}

            {/* User Settings */}
            {showSettings && (
                <UserSettingsModal onClose={() => setShowSettings(false)} />
            )}
        </div>
    );
}

function getPriorityColor(p) {
    if (p === 'critical') return 'var(--accent-danger)';
    if (p === 'high') return '#f97316';
    if (p === 'medium') return 'var(--accent-warning)';
    if (p === 'low') return '#f9f116ff';
    return 'var(--text-muted)';
}
