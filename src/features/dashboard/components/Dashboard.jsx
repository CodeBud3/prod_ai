import React, { useState, useEffect } from 'react';
import { getMotivationalGreeting } from '../../../utils/greetingLogic';
import { useSelector, useDispatch } from 'react-redux';
import { AiEngine } from '../../../services/AiEngine';
import { QuickAdd, EditTaskModal, TaskItem, PrioritizationStudio, TrashView } from '../../tasks';
import { GoblinMode } from '../../tasks/components/GoblinMode';
import { BoredDice } from '../../tasks/components/BoredDice';
import { UserSettingsModal } from '../../user/components/UserSettingsModal';
import { NotificationPanel } from '../../notifications';
import { CircularProgress, FunnyTooltip } from '../../../components/ui';
import { ExecutiveSummary } from './ExecutiveSummary';
import { PomodoroTimer } from './PomodoroTimer';
import { InsightsPage } from './InsightsPage';
import { TaskSection } from './TaskSection';
import { selectUser, selectTheme, selectFocusMode } from '../../user/userSelectors';
import { toggleFocusMode } from '../../user/userSlice';
import { selectAllTasks, selectMyTasks, selectDelegatedTasks } from '../../tasks/tasksSelectors';
import { addTask, updateTask, deleteTask, toggleTask, setReminder, dismissReminder, setFocusColor, checkReminders, generateTaskPlan, fetchAiSuggestion, fetchBatchAiSuggestions, TASK_CATEGORIES } from '../../tasks/tasksSlice';
import { selectPlanSummary, selectHasPlan } from '../../plan/planSelectors';
import { clearPlan } from '../../plan/planSlice';
import { addNotification, removeNotification, clearAllNotifications } from '../../notifications/notificationsSlice';
import { selectAllNotifications } from '../../notifications/notificationsSelectors';
import { openBrainDump } from '../../brainDump';
import UseAnimations from 'react-useanimations';
import notification from 'react-useanimations/lib/notification';
import { getSortedTasks, formatTimestamp, getPriorityColor } from '../utils/dashboardUtils';
import { UserMenu, AuthModal } from '../../auth';

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
    const [showInsights, setShowInsights] = useState(false); // Insights Page
    const [showAuthModal, setShowAuthModal] = useState(false); // Authentication Modal
    const [showTrash, setShowTrash] = useState(false); // Trash View

    // Calculate today's task stats for the greeting
    const greeting = React.useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayTasks = tasks.filter(t => {
            if (!t.dueDate && !t.completedAt) return false;

            // If completed today
            if (t.completedAt) {
                const completedDate = new Date(t.completedAt);
                return completedDate >= today && completedDate < tomorrow;
            }

            // If due today (and not done)
            if (t.dueDate) {
                const dueDate = new Date(t.dueDate);
                return dueDate >= today && dueDate < tomorrow;
            }
            return false;
        });

        const todayTotal = todayTasks.length;
        const todayCompleted = todayTasks.filter(t => t.status === 'done').length;

        return getMotivationalGreeting(user.name, todayCompleted, todayTotal);
    }, [user.name, tasks]);

    // Check for reminders
    useEffect(() => {
        const interval = setInterval(() => {
            dispatch(checkReminders());

            // Check for tasks due today/overdue
            const now = Date.now();
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);

            // Check for tasks nearing/at/past due date (critical alarm)
            const dueDateTasks = tasks.filter(task => {
                if (task.status === 'done' || !task.dueDate) return false;

                // Skip if task has a future remindAt (snoozed)
                if (task.remindAt && task.remindAt > now) return false;

                // Skip if task was dismissed within the last 1 hour (prevent immediate re-trigger)
                if (task.lastDismissedAt && (now - task.lastDismissedAt) < 60 * 60 * 1000) return false;

                const dueTime = new Date(task.dueDate).getTime();
                // Task is due within 1 hour or already overdue
                const isNearingDue = dueTime <= now + (60 * 60 * 1000) && dueTime >= now;
                const isOverdue = dueTime < now;
                return isNearingDue || isOverdue;
            });

            if (dueDateTasks.length > 0) {
                dueDateTasks.forEach(task => {
                    if (!notifications.some(n => n.taskId === task.id && n.type === 'dueDate')) {
                        const dueTime = new Date(task.dueDate).getTime();
                        const isOverdue = dueTime < now;
                        dispatch(addNotification({
                            taskId: task.id,
                            type: 'dueDate',
                            message: `${isOverdue ? '🚨 OVERDUE: ' : '⏰ DUE NOW: '}${task.title}`
                        }));
                    }
                });
            }

            // Check for follow-ups (intermediate reminder)
            const followUpDueTasks = tasks.filter(task => {
                if (task.status === 'done') return false;

                // Skip if task was dismissed within the last 1 hour
                if (task.lastDismissedAt && (now - task.lastDismissedAt) < 60 * 60 * 1000) return false;

                const isDue =
                    task.followUp &&
                    task.followUp.dueAt &&
                    task.followUp.dueAt <= now &&
                    task.followUp.status === 'pending';

                if (!isDue) return false;
                return true;
            });

            if (followUpDueTasks.length > 0) {
                followUpDueTasks.forEach(task => {
                    if (!notifications.some(n => n.taskId === task.id && n.type === 'followUp')) {
                        dispatch(addNotification({
                            taskId: task.id,
                            type: 'followUp',
                            message: `${task.title} ${task.assignee ? `(${task.assignee})` : ''}`
                        }));
                    }
                });
            }

            // Check for active reminders (revisit task reminders and 'remind me x time before')
            const activeReminders = tasks.filter(task => {
                if (task.lastDismissedAt && (now - task.lastDismissedAt) < 60 * 60 * 1000) return false;
                return task.reminding;
            });
            if (activeReminders.length > 0) {
                activeReminders.forEach(task => {
                    if (!notifications.some(n => n.taskId === task.id && n.type === 'reminder')) {
                        dispatch(addNotification({
                            taskId: task.id,
                            type: 'reminder',
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

    // Scroll to top when filters change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeFilter, activeBucket, showTrash, showInsights, showSettings]);

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

    // Show Insights Page (Conditional Render handled below)

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
        <div style={{ width: '100%', maxWidth: '100%', display: 'flex', alignItems: 'flex-start' }}>
            {/* Hidden iframe to unlock Chrome autoplay - plays silent audio on page load */}
            <iframe
                src="/silence.mp3"
                allow="autoplay"
                style={{ display: 'none' }}
                title="Audio unlock"
            />

            {/* Left Sidebar - Fixed Position */}
            <div style={{
                width: '260px',
                position: 'fixed',
                top: '20px',
                left: '20px',
                bottom: '20px',
                overflowY: 'auto',
                paddingRight: '10px', // For scrollbar breathing room
                zIndex: 100
            }}>
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

                {/* Completed Today Counter */}
                {(() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const completedToday = tasks.filter(t => {
                        if (t.status !== 'done' || !t.completedAt) return false;
                        const completedDate = new Date(t.completedAt);
                        return completedDate >= today && completedDate < tomorrow;
                    }).length;

                    return (
                        <div className="glass-panel" style={{
                            padding: '16px',
                            marginBottom: '20px',
                            background: completedToday > 0 ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(52, 211, 153, 0.1))' : undefined,
                            borderColor: completedToday > 0 ? 'rgba(16, 185, 129, 0.3)' : undefined
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>
                                        Completed Today
                                    </div>
                                    <div style={{ fontSize: '28px', fontWeight: 700, color: completedToday > 0 ? '#34d399' : 'var(--text-secondary)' }}>
                                        {completedToday}
                                    </div>
                                </div>
                                <div style={{ fontSize: '32px', opacity: 0.5 }}>
                                    {completedToday === 0 ? '💤' : completedToday < 3 ? '🔥' : completedToday < 6 ? '🚀' : '⭐'}
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Upcoming Deadlines (Next 3) */}
                {(() => {
                    const now = new Date();
                    const upcomingTasks = tasks
                        .filter(t => t.status !== 'done' && t.dueDate && !t.deleted)
                        .map(t => ({ ...t, dueTime: new Date(t.dueDate).getTime() }))
                        .filter(t => t.dueTime > now.getTime())
                        .sort((a, b) => a.dueTime - b.dueTime)
                        .slice(0, 3);

                    if (upcomingTasks.length === 0) return null;

                    const formatRelativeTime = (dueDate) => {
                        const now = new Date();
                        const due = new Date(dueDate);
                        const diffMs = due.getTime() - now.getTime();
                        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                        if (diffHours < 1) return 'Soon';
                        if (diffHours < 24) return `${diffHours}h`;
                        if (diffDays === 1) return 'Tomorrow';
                        if (diffDays < 7) return `${diffDays}d`;
                        return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    };

                    return (
                        <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px', letterSpacing: '1px' }}>
                                ⏰ Upcoming
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {upcomingTasks.map((t, idx) => (
                                    <div
                                        key={t.id}
                                        onClick={() => setEditingTask(t)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '8px 10px',
                                            background: idx === 0 ? 'rgba(251, 191, 36, 0.1)' : 'rgba(255,255,255,0.03)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            border: idx === 0 ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid transparent'
                                        }}
                                    >
                                        <div style={{
                                            minWidth: '36px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            color: idx === 0 ? '#fbbf24' : 'var(--text-secondary)',
                                            textAlign: 'center'
                                        }}>
                                            {formatRelativeTime(t.dueDate)}
                                        </div>
                                        <div style={{
                                            flex: 1,
                                            fontSize: '12px',
                                            color: 'var(--text-primary)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {t.title}
                                        </div>
                                        {t.recurrence?.enabled && (
                                            <span style={{ fontSize: '10px' }}>🔁</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}

                {/* Pomodoro Timer - Focus Mode Only */}
                {isFocusMode && <PomodoroTimer />}

                {/* View Toggle */}
                <div style={{
                    display: 'flex',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '4px',
                    borderRadius: '12px',
                    marginBottom: '24px'
                }}>
                    <button
                        onClick={() => setShowInsights(false)}
                        style={{
                            flex: 1,
                            padding: '8px',
                            border: 'none',
                            background: !showInsights ? 'var(--surface-primary)' : 'transparent',
                            color: !showInsights ? 'var(--text-primary)' : 'var(--text-secondary)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 500,
                            transition: 'all 0.2s',
                            boxShadow: !showInsights ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
                        }}
                    >
                        ✅ Tasks
                    </button>
                    <button
                        onClick={() => setShowInsights(true)}
                        style={{
                            flex: 1,
                            padding: '8px',
                            border: 'none',
                            background: showInsights ? 'var(--surface-primary)' : 'transparent',
                            color: showInsights ? 'var(--text-primary)' : 'var(--text-secondary)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 500,
                            transition: 'all 0.2s',
                            boxShadow: showInsights ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
                        }}
                    >
                        📊 Insights
                    </button>
                </div>

                <ExecutiveSummary
                    vertical={true}
                    activeFilter={activeFilter}
                    onFilterChange={(filter) => setActiveFilter(activeFilter === filter ? null : filter)}
                />

                {/* Trash Button */}
                <button
                    onClick={() => setShowTrash(true)}
                    style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: 'var(--text-secondary)',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '16px',
                        transition: 'all 0.2s'
                    }}
                >
                    🗑️ Trash
                </button>
            </div>

            {/* Main Content - Offset by Sidebar width + gap */}
            <div style={{ flex: 1, minWidth: 0, marginLeft: '300px', padding: '20px', paddingRight: '40px' }}>
                {showInsights ? (
                    <InsightsPage />
                ) : (
                    <>
                        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <div>
                                <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>
                                    {greeting.split(user.name)[0]}
                                    <span
                                        onClick={() => setShowSettings(true)}
                                        style={{ cursor: 'pointer', borderBottom: '2px dashed rgba(255,255,255,0.3)', transition: 'all 0.2s' }}
                                        title="Click to edit your profile"
                                    >{user.name}</span>
                                    {greeting.split(user.name)[1]}
                                </h1>
                                <p style={{ color: 'var(--text-secondary)' }}>{planSummary || 'Here is your executive summary.'}</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ cursor: 'pointer' }}>
                                        <UseAnimations
                                            animation={notification}
                                            size={28}
                                            strokeColor="white"
                                            fillColor="white"
                                        />
                                    </div>
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
                                <button
                                    onClick={async () => {
                                        // Find all active visible tasks
                                        const visibleTasks = [
                                            ...filteredMyTasks,
                                            ...filteredDelegatedTasks
                                        ].filter(t => t.status !== 'done');

                                        if (visibleTasks.length === 0) return;

                                        // Simple visual feedback
                                        const btn = document.getElementById('ai-plan-btn');
                                        if (btn) {
                                            const originalText = btn.innerHTML;
                                            btn.innerHTML = '<span>🧠</span> Thinking...';
                                            btn.style.opacity = '0.7';
                                            btn.style.cursor = 'wait';
                                            btn.disabled = true;

                                            // Process tasks in a SINGLE batch
                                            try {
                                                await dispatch(fetchBatchAiSuggestions(visibleTasks));
                                            } finally {
                                                // Visual completion feedback
                                                btn.innerHTML = '<span>✅</span> Done!';
                                                btn.disabled = false;
                                                setTimeout(() => {
                                                    btn.innerHTML = originalText;
                                                    btn.style.opacity = '1';
                                                    btn.style.cursor = 'pointer';
                                                }, 2000);
                                            }
                                        }
                                    }}
                                    id="ai-plan-btn"
                                    className="btn-secondary"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        background: 'rgba(99, 102, 241, 0.1)',
                                        border: '1px solid rgba(99, 102, 241, 0.3)',
                                        color: '#818cf8',
                                    }}
                                    title="Generate AI suggested focus/schedule for all visible tasks (Batch)"
                                >
                                    <span>✨</span> AI Plan
                                </button>
                                <button onClick={() => dispatch(toggleFocusMode(true))} className="btn-secondary" disabled={!tasks.some(t => t.status !== 'done')}>
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
                                <button
                                    onClick={() => dispatch(openBrainDump())}
                                    className="btn-secondary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                                    title="Brain Dump - Unload your mind"
                                >
                                    🧠 Brain Dump
                                </button>
                                <UserMenu onSignInClick={() => setShowAuthModal(true)} />
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

                        {editingTask && (
                            <EditTaskModal
                                task={editingTask}
                                onSave={handleSaveTask}
                                onCancel={() => setEditingTask(null)}
                            />
                        )}
                        {showTrash && <TrashView onClose={() => setShowTrash(false)} />}
                    </>
                )}

                <NotificationPanel
                    notifications={notifications}
                    onDismiss={(notificationId) => {
                        // Find the notification to check its type
                        const notification = notifications.find(n => n.id === notificationId);
                        const task = notification ? tasks.find(t => t.id === notification.taskId) : null;

                        if (task) {
                            const updates = {
                                lastDismissedAt: Date.now() // Always track dismissal to prevent immediate re-loop
                            };

                            // For dueDate notifications: dismiss = remind next day
                            if (notification?.type === 'dueDate') {
                                const tomorrow = new Date();
                                tomorrow.setDate(tomorrow.getDate() + 1);
                                tomorrow.setHours(9, 0, 0, 0); // 9 AM next day
                                updates.remindAt = tomorrow.getTime();
                                updates.reminderStartedAt = Date.now();
                            }

                            dispatch(updateTask({
                                id: task.id,
                                updates
                            }));
                        }

                        dispatch(removeNotification(notificationId));
                    }}
                    onSnooze={(taskId, notificationId) => {
                        const task = tasks.find(t => t.id === taskId);
                        if (task) {
                            // Snooze for 1 hour regardless of notification type
                            const oneHourFromNow = Date.now() + 60 * 60 * 1000;

                            dispatch(updateTask({
                                id: task.id,
                                updates: {
                                    reminding: false,
                                    remindAt: oneHourFromNow,
                                    reminderStartedAt: Date.now(),
                                    followUp: task.assignee ? {
                                        ...(task.followUp || {}),
                                        dueAt: oneHourFromNow,
                                        startedAt: Date.now(),
                                        status: 'pending'
                                    } : task.followUp
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

                {/* Auth Modal */}
                <AuthModal
                    isOpen={showAuthModal}
                    onClose={() => setShowAuthModal(false)}
                />
            </div>
        </div >
    );
}
