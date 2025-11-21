import React, { useState, useEffect } from 'react';
import { AiEngine } from '../services/AiEngine';
import { QuickAdd } from './QuickAdd';
import { EditTaskModal } from './EditTaskModal';
import { CircularProgress } from './CircularProgress';

export function Dashboard({ user, tasks, plan, onUpdateUser, onUpdateTasks, onUpdatePlan, onDeleteTask, onEditTask }) {
    const [loading, setLoading] = useState(!plan && tasks.length > 0);
    const [sortBy, setSortBy] = useState('smart'); // smart, date_added, priority, due_date
    const [editingTask, setEditingTask] = useState(null);
    const [viewFilter, setViewFilter] = useState('all'); // all, todo, completed

    // Check for reminders
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const needsUpdate = tasks.some(task => {
                return task.remindAt && task.remindAt <= now && !task.reminding;
            });

            if (needsUpdate) {
                const updatedTasks = tasks.map(task => {
                    if (task.remindAt && task.remindAt <= now && !task.reminding) {
                        return { ...task, reminding: true };
                    }
                    return task;
                });
                onUpdateTasks(updatedTasks);

                // Also update plan
                if (plan) {
                    const updatedPlan = {
                        ...plan,
                        tasks: plan.tasks.map(task => {
                            if (task.remindAt && task.remindAt <= now && !task.reminding) {
                                return { ...task, reminding: true };
                            }
                            return task;
                        })
                    };
                    onUpdatePlan(updatedPlan);
                }
            }
        }, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, [tasks, plan, onUpdateTasks, onUpdatePlan]);

    useEffect(() => {
        if (!plan && tasks.length > 0) {
            AiEngine.generatePlan(tasks, user.role).then(newPlan => {
                onUpdatePlan(newPlan);
                onUpdateTasks(newPlan.tasks);
                setLoading(false);
            });
        }
    }, [plan, tasks, user.role]);

    const handleAddTask = async (newTask) => {
        const task = {
            id: Date.now(),
            createdAt: Date.now(),
            status: 'todo',
            quadrant: null, // Will be set by AI
            ...newTask
        };

        const updatedTasks = [...tasks, task];
        onUpdateTasks(updatedTasks);

        // Re-run AI to sort
        const newPlan = await AiEngine.generatePlan(updatedTasks, user.role);
        onUpdatePlan(newPlan);
        onUpdateTasks(newPlan.tasks);
    };

    const handleSaveTask = (updatedTask) => {
        onEditTask(updatedTask);
        setEditingTask(null);
    };

    const handleSetReminder = (taskId, minutes) => {
        const now = Date.now();
        const remindAt = now + (minutes * 60 * 1000);
        const updatedTasks = tasks.map(t =>
            t.id === taskId ? { ...t, remindAt, reminderStartedAt: now } : t
        );
        onUpdateTasks(updatedTasks);

        if (plan) {
            const updatedPlan = {
                ...plan,
                tasks: plan.tasks.map(t =>
                    t.id === taskId ? { ...t, remindAt, reminderStartedAt: now } : t
                )
            };
            onUpdatePlan(updatedPlan);
        }
    };

    const handleDismissReminder = (taskId) => {
        const updatedTasks = tasks.map(t =>
            t.id === taskId ? { ...t, reminding: false, remindAt: null, reminderStartedAt: null } : t
        );
        onUpdateTasks(updatedTasks);

        if (plan) {
            const updatedPlan = {
                ...plan,
                tasks: plan.tasks.map(t =>
                    t.id === taskId ? { ...t, reminding: false, remindAt: null, reminderStartedAt: null } : t
                )
            };
            onUpdatePlan(updatedPlan);
        }
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
    const sourceTasks = plan ? plan.tasks : tasks;

    // View Filtering
    const getFilteredTasks = () => {
        switch (viewFilter) {
            case 'todo':
                return sourceTasks.filter(t => t.status !== 'done');
            case 'completed':
                return sourceTasks.filter(t => t.status === 'done');
            case 'all':
            default:
                return sourceTasks;
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

    const isFocusMode = user.preferences.focusMode;
    const currentTask = displayTasks.find(t => t.status !== 'done');

    const toggleTask = (id) => {
        const newTasks = tasks.map(t => {
            if (t.id === id) {
                const isDone = t.status === 'done';
                return {
                    ...t,
                    status: isDone ? 'todo' : 'done',
                    completedAt: isDone ? null : Date.now()
                };
            }
            return t;
        });
        onUpdateTasks(newTasks);

        if (plan) {
            const newPlan = {
                ...plan,
                tasks: plan.tasks.map(t => {
                    if (t.id === id) {
                        const isDone = t.status === 'done';
                        return {
                            ...t,
                            status: isDone ? 'todo' : 'done',
                            completedAt: isDone ? null : Date.now()
                        };
                    }
                    return t;
                })
            };
            onUpdatePlan(newPlan);
        }
    };

    const toggleFocusMode = (active) => {
        onUpdateUser({
            ...user,
            preferences: { ...user.preferences, focusMode: active }
        });
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
                    <button onClick={() => toggleTask(currentTask.id)} className="btn-primary" style={{ fontSize: '18px', padding: '16px 32px' }}>
                        Mark Complete
                    </button>
                    <button onClick={() => toggleFocusMode(false)} className="btn-secondary">
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
                    <p style={{ color: 'var(--text-secondary)' }}>{plan ? plan.summary : 'Ready to plan.'}</p>
                </div>
                <button onClick={() => toggleFocusMode(true)} className="btn-primary" disabled={!displayTasks.some(t => t.status !== 'done')}>
                    Enter Focus Mode
                </button>
            </header>

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
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sort:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--text-primary)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px'
                        }}
                    >
                        <option value="smart">Smart (AI)</option>
                        <option value="priority">Priority</option>
                        <option value="due_date">Due Date</option>
                        <option value="date_added">Date Added</option>
                    </select>
                </div>
            </div>

            <div className="task-list">
                {displayTasks.map(task => (
                    <div
                        key={task.id}
                        className={`task-item ${task.status === 'done' ? 'done' : ''} ${task.reminding ? 'reminding' : ''}`}
                        onDoubleClick={() => setEditingTask(task)}
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            padding: '16px',
                            background: 'rgba(255,255,255,0.03)',
                            marginBottom: '8px',
                            borderRadius: 'var(--radius-md)',
                            borderLeft: `4px solid ${getPriorityColor(task.priority) || 'var(--text-muted)'}`,
                            cursor: 'default',
                            position: 'relative'
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={task.status === 'done'}
                            onChange={() => toggleTask(task.id)}
                            style={{ width: '20px', height: '20px', marginRight: '16px', marginTop: '4px', cursor: 'pointer' }}
                        />

                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 500, textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? 'var(--text-muted)' : 'inherit' }}>
                                        {task.title}
                                    </div>
                                    {/* Glassy Blur Description */}
                                    {task.description && (
                                        <div style={{
                                            fontSize: '14px',
                                            color: 'var(--text-secondary)',
                                            marginTop: '4px',
                                            maxHeight: '3em',
                                            overflow: 'hidden',
                                            maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                                            WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                                            opacity: 0.8
                                        }}>
                                            {task.description}
                                        </div>
                                    )}
                                    {/* Completion Timestamp */}
                                    {task.status === 'done' && task.completedAt && (
                                        <div style={{ fontSize: '12px', color: 'var(--accent-success)', marginTop: '4px', fontStyle: 'italic' }}>
                                            ✓ Completed {formatTimestamp(task.completedAt)}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
                                    {task.dueDate && (
                                        <div style={{ fontSize: '12px', color: 'var(--accent-warning)', whiteSpace: 'nowrap' }}>
                                            {task.dueDate}
                                        </div>
                                    )}


                                    {/* Reminder Button/Dropdown */}
                                    {task.reminding ? (
                                        <button
                                            onClick={() => handleDismissReminder(task.id)}
                                            style={{
                                                background: 'var(--accent-primary)',
                                                border: 'none',
                                                color: 'white',
                                                cursor: 'pointer',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                fontWeight: 600
                                            }}
                                            title="Dismiss Reminder"
                                        >
                                            Dismiss
                                        </button>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <select
                                                value={task.remindAt ? 'active' : ''}
                                                onChange={(e) => {
                                                    if (e.target.value && e.target.value !== 'active') {
                                                        handleSetReminder(task.id, parseInt(e.target.value));
                                                        e.target.value = '';
                                                    }
                                                }}
                                                style={{
                                                    background: 'transparent',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    color: 'var(--text-muted)',
                                                    padding: '4px',
                                                    fontSize: '11px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                                title="Set Reminder"
                                            >
                                                <option value="">⏰ Remind</option>
                                                <option value="active" disabled hidden>Active</option>
                                                <option value="1">1 min</option>
                                                <option value="5">5 min</option>
                                                <option value="15">15 min</option>
                                                <option value="30">30 min</option>
                                                <option value="60">1 hour</option>
                                                <option value="120">2 hours</option>
                                            </select>
                                            {task.remindAt && task.reminderStartedAt && (
                                                <CircularProgress
                                                    startTime={task.reminderStartedAt}
                                                    endTime={task.remindAt}
                                                    size={20}
                                                />
                                            )}
                                        </div>
                                    )}


                                    <button
                                        onClick={() => setEditingTask(task)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--text-muted)',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                        title="Edit Task"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => onDeleteTask(task.id)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--text-muted)',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                        title="Delete Task"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                {task.priority !== 'none' ? `Priority: ${task.priority}` : 'No Priority'} • {task.quadrant?.toUpperCase()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {editingTask && (
                <EditTaskModal
                    task={editingTask}
                    onSave={handleSaveTask}
                    onCancel={() => setEditingTask(null)}
                />
            )}
        </div>
    );
}

function getPriorityColor(p) {
    if (p === 'high') return 'var(--accent-danger)';
    if (p === 'medium') return '#f97316';
    if (p === 'low') return 'var(--accent-warning)';
    return 'var(--text-muted)'; // Explicit gray for none
}
