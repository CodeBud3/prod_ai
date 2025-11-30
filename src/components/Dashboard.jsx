import React, { useState, useEffect } from 'react';
import { AiEngine } from '../services/AiEngine';
import { QuickAdd } from './QuickAdd';
import { EditTaskModal } from './EditTaskModal';
import { CircularProgress } from './CircularProgress';
import { TaskItem } from './TaskItem';
import { NotificationPanel } from './NotificationPanel';

export function Dashboard({ user, tasks, plan, onUpdateUser, onUpdateTasks, onUpdatePlan, onDeleteTask, onEditTask }) {
    const [loading, setLoading] = useState(!plan && tasks.length > 0);
    const [sortBy, setSortBy] = useState('smart'); // smart, date_added, priority, due_date
    const [editingTask, setEditingTask] = useState(null);
    const [viewFilter, setViewFilter] = useState('all'); // all, todo, completed
    const [groupBy, setGroupBy] = useState('none'); // none, tags
    const [viewMode, setViewMode] = useState('my_tasks'); // my_tasks, assigned
    const [notifications, setNotifications] = useState([]);

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
            // Check for follow-ups
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
                setNotifications(prev => {
                    const newNotifications = [...prev];
                    followUpDueTasks.forEach(task => {
                        // Check if already notified
                        if (!newNotifications.some(n => n.taskId === task.id)) {
                            newNotifications.push({
                                id: Date.now() + Math.random(),
                                taskId: task.id,
                                message: `${task.title} ${task.assignee ? `(${task.assignee})` : ''}`,
                                timestamp: Date.now()
                            });
                        }
                    });
                    return newNotifications;
                });
            }
        }, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, [tasks, plan, onUpdateTasks, onUpdatePlan, viewMode]);

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

            {/* View Mode Toggle */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
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
                    </div>

                    {/* Sorting */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sort:</span>
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
                                    toggleTask={toggleTask}
                                    setEditingTask={setEditingTask}
                                    handleSetReminder={handleSetReminder}
                                    handleDismissReminder={handleDismissReminder}
                                    onDeleteTask={onDeleteTask}
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
                                            toggleTask={toggleTask}
                                            setEditingTask={setEditingTask}
                                            handleSetReminder={handleSetReminder}
                                            handleDismissReminder={handleDismissReminder}
                                            onDeleteTask={onDeleteTask}
                                            getPriorityColor={getPriorityColor}
                                            formatTimestamp={formatTimestamp}
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
                                    toggleTask={toggleTask}
                                    setEditingTask={setEditingTask}
                                    handleSetReminder={handleSetReminder}
                                    handleDismissReminder={handleDismissReminder}
                                    onDeleteTask={onDeleteTask}
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
                                    toggleTask={toggleTask}
                                    setEditingTask={setEditingTask}
                                    handleSetReminder={handleSetReminder}
                                    handleDismissReminder={handleDismissReminder}
                                    onDeleteTask={onDeleteTask}
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
                            toggleTask={toggleTask}
                            setEditingTask={setEditingTask}
                            handleSetReminder={handleSetReminder}
                            handleDismissReminder={handleDismissReminder}
                            onDeleteTask={onDeleteTask}
                            getPriorityColor={getPriorityColor}
                            formatTimestamp={formatTimestamp}
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
                    setNotifications(prev => prev.filter(n => n.id !== notificationId));
                }}
                onSnooze={(taskId, notificationId) => {
                    // Snooze for 1 hour
                    const task = tasks.find(t => t.id === taskId);
                    if (task) {
                        const updatedTask = {
                            ...task,
                            followUp: {
                                ...task.followUp,
                                dueAt: Date.now() + 60 * 60 * 1000
                            }
                        };
                        onUpdateTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
                    }
                    setNotifications(prev => prev.filter(n => n.id !== notificationId));
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
                        onUpdateTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
                    }
                    setNotifications(prev => prev.filter(n => n.id !== notificationId));
                }}
            />
        </div>
    );
}

function getPriorityColor(p) {
    if (p === 'high') return 'var(--accent-danger)';
    if (p === 'medium') return '#f97316';
    if (p === 'low') return 'var(--accent-warning)';
    return 'var(--text-muted)'; // Explicit gray for none
}
