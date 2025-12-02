import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AiEngine } from '../../../services/AiEngine';
import { QuickAdd, EditTaskModal, TaskItem, PrioritizationStudio } from '../../tasks';
import { NotificationPanel } from '../../notifications';
import { CircularProgress, FunnyTooltip } from '../../../components/ui';
import { selectUser, selectTheme, selectFocusMode } from '../../user/userSelectors';
import { setTheme, toggleFocusMode } from '../../user/userSlice';
import { selectAllTasks } from '../../tasks/tasksSelectors';
import { addTask, updateTask, deleteTask, toggleTask, setReminder, dismissReminder, setFocusColor, checkReminders, generateTaskPlan } from '../../tasks/tasksSlice';
import { selectPlanSummary, selectHasPlan } from '../../plan/planSelectors';
import { clearPlan } from '../../plan/planSlice';
import { addNotification, removeNotification, clearAllNotifications } from '../../notifications/notificationsSlice';
import { selectAllNotifications } from '../../notifications/notificationsSelectors';

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
    const [sortBy, setSortBy] = useState('smart');
    const [editingTask, setEditingTask] = useState(null);
    const [viewFilter, setViewFilter] = useState('all');
    const [groupBy, setGroupBy] = useState('none');
    const [viewMode, setViewMode] = useState('my_tasks');
    const [showPrioritization, setShowPrioritization] = useState(false);

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

                // Filter based on view mode
                if (viewMode === 'my_tasks' && task.assignee) return false;

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
        }, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, [dispatch, tasks, viewMode, notifications]);

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

    if (loading) {
        return (
            <div className="glass-panel fade-in" style={{ padding: '40px', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '16px' }}>Analyzing your workload...</h2>
                <div className="loader"></div>
                <p style={{ color: 'var(--text-secondary)' }}>Applying {user.role} context...</p>
            </div>
        );
    }

    // If no plan and no tasks, show empty state or just QuickAdd
    const sourceTasks = tasks;

    // View Filtering
    const getFilteredTasks = () => {
        let filtered = sourceTasks;

        // Filter by View Mode (My Tasks vs Assigned)
        if (viewMode === 'assigned') {
            filtered = filtered.filter(t => t.assignee && t.assignee.trim() !== '');
        } else {
            // My Tasks: tasks without assignee OR assigned to me (if we had current user name check, but for now just unassigned)
            // User requirement: "Assigned to others" view. So "My Tasks" implies everything else? 
            // Or should "My Tasks" be everything? 
            // Let's make "Assigned" strictly show tasks with an assignee. 
            // "My Tasks" shows everything for now, or maybe exclude assigned?
            // "Assigned to others" implies separation. Let's exclude assigned from "My Tasks" to make it distinct.
            filtered = filtered.filter(t => !t.assignee || t.assignee.trim() === '');
        }

        switch (viewFilter) {
            case 'todo':
                return filtered.filter(t => t.status !== 'done');
            case 'completed':
                return filtered.filter(t => t.status === 'done');
            case 'all':
            default:
                return filtered;
        }
    };

    // Sorting Logic
    const getSortedTasks = () => {
        let sorted = [...getFilteredTasks()];
        switch (sortBy) {
            case 'date_added':
                return sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            case 'priority':
                const pMap = { high: 3, medium: 2, low: 1, none: 0 };
                return sorted.sort((a, b) => pMap[b.priority || 'none'] - pMap[a.priority || 'none']);
            case 'due_date':
                return sorted.sort((a, b) => {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });
            case 'smart':
            default:
                return sorted; // Already sorted by AI/Plan
        }
    };

    const displayTasks = getSortedTasks();

    const currentTask = displayTasks.find(t => t.status !== 'done');

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
        <div style={{ width: '100%', maxWidth: '800px', padding: '20px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Good Morning, {user.name}</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>{planSummary || 'Ready to plan.'}</p>
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
                    <button onClick={() => dispatch(toggleFocusMode(true))} className="btn-primary" disabled={!displayTasks.some(t => t.status !== 'done')}>
                        Enter Focus Mode
                    </button>
                    <button
                        onClick={() => setShowPrioritization(true)}
                        className="btn-secondary"
                    >
                        Help me prioritize
                    </button>
                </div>
            </header>

            {/* Theme Switcher */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px', gap: '8px', background: 'var(--bg-glass)', padding: '4px', borderRadius: '12px', width: 'fit-content', margin: '0 auto 32px auto', border: '1px solid var(--glass-border)' }}>
                {[
                    { id: 'dark', icon: '🌙', label: 'Dark' },
                    { id: 'light', icon: '☀️', label: 'Light' },
                    { id: 'glass', icon: '🔮', label: 'Glass' }
                ].map(theme => (
                    <button
                        key={theme.id}
                        onClick={() => dispatch(setTheme(theme.id))}
                        style={{
                            background: (user.preferences.theme || 'dark') === theme.id ? 'var(--accent-primary)' : 'transparent',
                            color: (user.preferences.theme || 'dark') === theme.id ? 'white' : 'var(--text-secondary)',
                            border: 'none',
                            padding: '6px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <FunnyTooltip context="theme">
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{theme.icon}</span>
                                {theme.label}
                            </span>
                        </FunnyTooltip>
                    </button>
                ))}
            </div>

            {/* View Mode Toggle */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
                <FunnyTooltip context="default">
                    <button
                        onClick={() => setViewMode('my_tasks')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: viewMode === 'my_tasks' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            fontSize: '16px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: '8px 0',
                            position: 'relative'
                        }}
                    >
                        My Tasks
                        {viewMode === 'my_tasks' && (
                            <div style={{ position: 'absolute', bottom: -17, left: 0, right: 0, height: '2px', background: 'var(--accent-primary)' }} />
                        )}
                    </button>
                </FunnyTooltip>
                <FunnyTooltip context="default">
                    <button
                        onClick={() => setViewMode('assigned')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: viewMode === 'assigned' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            fontSize: '16px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: '8px 0',
                            position: 'relative'
                        }}
                    >
                        Assigned to Others
                        {viewMode === 'assigned' && (
                            <div style={{ position: 'absolute', bottom: -17, left: 0, right: 0, height: '2px', background: 'var(--accent-primary)' }} />
                        )}
                    </button>
                </FunnyTooltip>
            </div>

            <QuickAdd onAdd={handleAddTask} />

            {/* View Filter and Sort Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
                {/* View Filter */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    {['all', 'todo', 'completed'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setViewFilter(filter)}
                            style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                borderRadius: '6px',
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

                {/* Sort Controls */}
                {/* Sort Controls */}
                {/* Sort & Group Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    {/* Grouping */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Group:</span>
                        <FunnyTooltip context="group">
                            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '2px' }}>
                                {[
                                    { id: 'none', label: 'None' },
                                    { id: 'tags', label: 'Tags' },
                                    { id: 'date', label: 'Date' },
                                    { id: 'assignee', label: 'Assignee' },
                                    { id: 'project', label: 'Project' }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setGroupBy(opt.id)}
                                        style={{
                                            background: groupBy === opt.id ? 'var(--accent-primary)' : 'transparent',
                                            color: groupBy === opt.id ? 'white' : 'var(--text-secondary)',
                                            border: 'none',
                                            padding: '4px 12px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </FunnyTooltip>
                    </div>

                    {/* Sorting */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sort:</span>
                        <FunnyTooltip context="sort">
                            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '2px' }}>
                                {[
                                    { id: 'smart', label: 'Smart' },
                                    { id: 'priority', label: 'Priority' },
                                    { id: 'due_date', label: 'Due' },
                                    { id: 'date_added', label: 'Added' }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setSortBy(opt.id)}
                                        style={{
                                            background: sortBy === opt.id ? 'var(--accent-primary)' : 'transparent',
                                            color: sortBy === opt.id ? 'white' : 'var(--text-secondary)',
                                            border: 'none',
                                            padding: '4px 12px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </FunnyTooltip>
                    </div>
                </div>
            </div>

            <div className="task-list">
                {groupBy === 'tags' ? (
                    Object.entries(displayTasks.reduce((groups, task) => {
                        const taskTags = task.tags && task.tags.length > 0 ? task.tags : ['Untagged'];
                        taskTags.forEach(tag => {
                            if (!groups[tag]) groups[tag] = [];
                            groups[tag].push(task);
                        });
                        return groups;
                    }, {})).map(([tag, groupTasks]) => (
                        <div key={tag} style={{ marginBottom: '24px' }}>
                            <h3 style={{
                                fontSize: '14px',
                                color: 'var(--text-secondary)',
                                marginBottom: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                fontWeight: 600
                            }}>
                                {tag} <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>{groupTasks.length}</span>
                            </h3>
                            {groupTasks.map(task => (
                                <TaskItem
                                    key={`${tag}-${task.id}`}
                                    task={task}
                                    toggleTask={handleToggleTask}
                                    setEditingTask={setEditingTask}
                                    handleSetReminder={handleSetReminder}
                                    handleDismissReminder={handleDismissReminder}
                                    onDeleteTask={handleDeleteTask}
                                    getPriorityColor={getPriorityColor}
                                    formatTimestamp={formatTimestamp}
                                />
                            ))}
                        </div>
                    ))
                ) : groupBy === 'date' ? (
                    (() => {
                        const buckets = {
                            'Today': [],
                            'Next 3 Days': [],
                            'Next Week': [],
                            'Upcoming': [],
                            'No Date': []
                        };

                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        displayTasks.forEach(task => {
                            if (!task.dueDate) {
                                buckets['No Date'].push(task);
                                return;
                            }

                            const dueDate = new Date(task.dueDate);
                            dueDate.setHours(0, 0, 0, 0);

                            const diffTime = dueDate - today;
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                            if (diffDays <= 0) {
                                buckets['Today'].push(task);
                            } else if (diffDays <= 3) {
                                buckets['Next 3 Days'].push(task);
                            } else if (diffDays <= 7) {
                                buckets['Next Week'].push(task);
                            } else {
                                buckets['Upcoming'].push(task);
                            }
                        });

                        return Object.entries(buckets).map(([bucket, tasks]) => {
                            if (tasks.length === 0) return null;
                            return (
                                <div key={bucket} style={{ marginBottom: '24px' }}>
                                    <h3 style={{
                                        fontSize: '14px',
                                        color: bucket === 'Today' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                        marginBottom: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        fontWeight: 600
                                    }}>
                                        {bucket} <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '10px', fontSize: '10px', color: 'var(--text-primary)' }}>{tasks.length}</span>
                                    </h3>
                                    {tasks.map(task => (
                                        <TaskItem
                                            key={`${bucket}-${task.id}`}
                                            task={task}
                                            toggleTask={handleToggleTask}
                                            setEditingTask={setEditingTask}
                                            handleSetReminder={handleSetReminder}
                                            handleDismissReminder={handleDismissReminder}
                                            onDeleteTask={handleDeleteTask}
                                            getPriorityColor={getPriorityColor}
                                            formatTimestamp={formatTimestamp}
                                            handleSetFocus={handleSetFocus}
                                        />
                                    ))}
                                </div>
                            );
                        });
                    })()
                ) : groupBy === 'assignee' ? (
                    Object.entries(displayTasks.reduce((groups, task) => {
                        const assignee = task.assignee || 'Unassigned';
                        if (!groups[assignee]) groups[assignee] = [];
                        groups[assignee].push(task);
                        return groups;
                    }, {})).map(([assignee, groupTasks]) => (
                        <div key={assignee} style={{ marginBottom: '24px' }}>
                            <h3 style={{
                                fontSize: '14px',
                                color: 'var(--text-secondary)',
                                marginBottom: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                fontWeight: 600
                            }}>
                                {assignee} <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>{groupTasks.length}</span>
                            </h3>
                            {groupTasks.map(task => (
                                <TaskItem
                                    key={`${assignee}-${task.id}`}
                                    task={task}
                                    toggleTask={handleToggleTask}
                                    setEditingTask={setEditingTask}
                                    handleSetReminder={handleSetReminder}
                                    handleDismissReminder={handleDismissReminder}
                                    onDeleteTask={handleDeleteTask}
                                    getPriorityColor={getPriorityColor}
                                    formatTimestamp={formatTimestamp}
                                />
                            ))}
                        </div>
                    ))
                ) : groupBy === 'project' ? (
                    Object.entries(displayTasks.reduce((groups, task) => {
                        const project = task.project || 'No Project';
                        if (!groups[project]) groups[project] = [];
                        groups[project].push(task);
                        return groups;
                    }, {})).map(([project, groupTasks]) => (
                        <div key={project} style={{ marginBottom: '24px' }}>
                            <h3 style={{
                                fontSize: '14px',
                                color: 'var(--text-secondary)',
                                marginBottom: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                fontWeight: 600
                            }}>
                                {project} <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>{groupTasks.length}</span>
                            </h3>
                            {groupTasks.map(task => (
                                <TaskItem
                                    key={`${project}-${task.id}`}
                                    task={task}
                                    toggleTask={handleToggleTask}
                                    setEditingTask={setEditingTask}
                                    handleSetReminder={handleSetReminder}
                                    handleDismissReminder={handleDismissReminder}
                                    onDeleteTask={handleDeleteTask}
                                    getPriorityColor={getPriorityColor}
                                    formatTimestamp={formatTimestamp}
                                />
                            ))}
                        </div>
                    ))
                ) : (
                    displayTasks.map(task => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            toggleTask={handleToggleTask}
                            setEditingTask={setEditingTask}
                            handleSetReminder={handleSetReminder}
                            handleDismissReminder={handleDismissReminder}
                            onDeleteTask={handleDeleteTask}
                            getPriorityColor={getPriorityColor}
                            formatTimestamp={formatTimestamp}
                            handleSetFocus={handleSetFocus}
                        />
                    ))
                )}
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
                    // Snooze for 1 hour
                    const task = tasks.find(t => t.id === taskId);
                    if (task) {
                        const updatedTask = {
                            ...task,
                            followUp: {
                                ...task.followUp,
                                dueAt: Date.now() + 60 * 60 * 1000 // 1 hour from now
                            }
                        };
                        dispatch(updateTask({ id: task.id, updates: updatedTask }));
                    }
                    dispatch(removeNotification(notificationId));
                }}
                onComplete={(taskId, notificationId) => {
                    const task = tasks.find(t => t.id === taskId);
                    if (task) {
                        const updatedTask = {
                            ...task,
                            followUp: {
                                ...task.followUp,
                                status: 'completed'
                            }
                        };
                        dispatch(updateTask({ id: task.id, updates: updatedTask }));
                    }
                    dispatch(removeNotification(notificationId));
                }}
            />

            {showPrioritization && (
                <PrioritizationStudio
                    onClose={() => setShowPrioritization(false)}
                />
            )}
        </div>
    );
}

function getPriorityColor(p) {
    if (p === 'critical') return 'var(--accent-danger)';
    if (p === 'high') return '#f97316';
    if (p === 'medium') return 'var(--accent-warning)';
    if (p === 'low') return '#f9f116ff';
    return 'var(--text-muted)'; // Explicit gray for none
}
