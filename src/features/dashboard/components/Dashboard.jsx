import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AiEngine } from '../../../services/AiEngine';
import { QuickAdd, EditTaskModal, TaskItem, PrioritizationStudio } from '../../tasks';
import { NotificationPanel } from '../../notifications';
import { CircularProgress, FunnyTooltip } from '../../../components/ui';
import { ExecutiveSummary } from './ExecutiveSummary';
import { selectUser, selectTheme, selectFocusMode } from '../../user/userSelectors';
import { setTheme, toggleFocusMode } from '../../user/userSlice';
import { selectAllTasks, selectMyTasks, selectDelegatedTasks } from '../../tasks/tasksSelectors';
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

    // View Filtering
    const getFilteredTasks = (taskList) => {
        switch (viewFilter) {
            case 'todo':
                return taskList.filter(t => t.status !== 'done');
            case 'completed':
                return taskList.filter(t => t.status === 'done');
            case 'all':
            default:
                return taskList;
        }
    };

    // Smart Sort Algorithm
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

    // Sorting Logic
    const getSortedTasks = (taskList) => {
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

    const renderTaskList = (taskList) => {
        const filtered = getFilteredTasks(taskList);
        const sorted = getSortedTasks(filtered);

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
            ));
        }

        // Default list
        return sorted.map(task => (
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
        ));
    };

    const myTasks = tasks.filter(t => !t.assignee || t.assignee.trim() === '');
    const delegatedTasks = tasks.filter(t => t.assignee && t.assignee.trim() !== '');

    const currentTask = tasks.find(t => t.status !== 'done'); // Simplified for focus mode check

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
        <div style={{ width: '100%', maxWidth: '1400px', padding: '20px', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>

            {/* Left Sidebar */}
            <div style={{ width: '300px', flexShrink: 0, position: 'sticky', top: '20px' }}>
                {/* Theme Switcher */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', gap: '8px', background: 'var(--bg-glass)', padding: '4px', borderRadius: '12px', width: '100%', border: '1px solid var(--glass-border)' }}>
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
                                padding: '6px 12px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s',
                                flex: 1,
                                justifyContent: 'center'
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

                <ExecutiveSummary vertical={true} />
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Good Morning, {user.name}</h1>
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
                            onClick={() => setShowPrioritization(true)}
                            className="btn-secondary"
                        >
                            Help me prioritize
                        </button>
                    </div>
                </header>

                <QuickAdd onAdd={handleAddTask} />

                {/* Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
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

                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>Group:</span>
                        <FunnyTooltip context="group">
                            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '2px' }}>
                                {[
                                    { id: 'none', label: 'None' },
                                    { id: 'tags', label: 'Tags' },
                                    { id: 'date', label: 'Date' },
                                    { id: 'project', label: 'Project' },
                                    { id: 'assignee', label: 'Assignee' }
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
                </div>

                {/* Split View Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* My Tasks Column */}
                    <div className="glass-panel" style={{ padding: '20px', minHeight: '400px' }}>
                        <h2 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>👤</span> My Tasks
                            <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                                {getFilteredTasks(myTasks).length}
                            </span>
                        </h2>
                        {renderTaskList(myTasks)}
                    </div>

                    {/* Assigned to Others Column */}
                    <div className="glass-panel" style={{ padding: '20px', minHeight: '400px' }}>
                        <h2 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>👥</span> Assigned to Others
                            <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                                {getFilteredTasks(delegatedTasks).length}
                            </span>
                        </h2>
                        {renderTaskList(delegatedTasks)}
                    </div>
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
                        const updatedTask = {
                            ...task,
                            followUp: {
                                ...task.followUp,
                                dueAt: Date.now() + 60 * 60 * 1000 // 1 hour
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
    return 'var(--text-muted)';
}
