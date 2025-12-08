import React, { useState, useEffect } from 'react';
import { CircularProgress } from '../../../components/ui';
import confetti from 'canvas-confetti';
import { MotivationalPopup } from '../../../components/ui';
import { FunnyTooltip } from '../../../components/ui';

export function TaskItem({ task, toggleTask, setEditingTask, handleSetReminder, handleDismissReminder, onDeleteTask, getPriorityColor, formatTimestamp, handleSetFocus, onUpdateTask }) {
    const focusColors = {
        purple: '#a855f7',
        grey: '#94a3b8',
        red: '#ef4444',
        orange: '#f97316',
        yellow: '#eab308'
    };

    const activeFocusColor = task.focusColor ? focusColors[task.focusColor] : null;
    const [showFocusPicker, setShowFocusPicker] = useState(false);
    const [motivationalMessage, setMotivationalMessage] = useState(null);

    const handleToggle = (e) => {
        const isCompleting = task.status !== 'done';

        if (isCompleting) {
            // Confetti explosion from the checkbox position
            const rect = e.target.getBoundingClientRect();
            const x = (rect.left + rect.width / 2) / window.innerWidth;
            const y = (rect.top + rect.height / 2) / window.innerHeight;

            confetti({
                particleCount: 30,
                spread: 35,
                startVelocity: 48,
                gravity: 2.0,
                decay: 0.92,
                scalar: 0.5,
                origin: { x, y },
                colors: ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
                disableForReducedMotion: true,
                ticks: 80,
            });

            // Motivational Message Logic
            const messages = {
                high: ['Awesome!', 'Major Win!', 'Crushed It!', 'On Fire! 🔥'],
                medium: ['Great Job!', 'Nice Work!', 'Keep it up!', 'Well Done!'],
                low: ['Good!', 'Done!', 'Check!', 'Nice!'],
                none: ['Good!', 'Done!', 'Check!', 'Nice!']
            };

            const priority = task.priority || 'none';
            const pool = messages[priority] || messages.none;
            const randomMsg = pool[Math.floor(Math.random() * pool.length)];
            setMotivationalMessage(randomMsg);
        }

        toggleTask(task.id);
    };

    // Render task with optional spinning border for focused tasks
    const taskContent = (
        <div
            className={`task-item ${task.status === 'done' ? 'done' : ''} ${task.reminding ? 'reminding' : ''}`}
            onDoubleClick={() => setEditingTask(task)}
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                padding: '16px',
                background: activeFocusColor ? '#0a0b0d' : 'rgba(255,255,255,0.03)',
                marginBottom: activeFocusColor ? '0' : '8px',
                borderRadius: 'var(--radius-md)',
                borderLeft: activeFocusColor ? `6px solid ${activeFocusColor}` : `4px solid ${getPriorityColor(task.priority) || 'var(--text-muted)'}`,
                cursor: 'default',
                position: 'relative',
                boxShadow: activeFocusColor ? `0 0 15px ${activeFocusColor}20` : 'none'
            }}
        >
            <div style={{ position: 'relative' }}>
                <input
                    type="checkbox"
                    checked={task.status === 'done'}
                    onChange={handleToggle}
                    style={{ width: '20px', height: '20px', marginRight: '16px', marginTop: '4px', cursor: 'pointer' }}
                />
                {motivationalMessage && (
                    <MotivationalPopup
                        message={motivationalMessage}
                        onComplete={() => setMotivationalMessage(null)}
                    />
                )}
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Title Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    {/* Title */}
                    <div style={{
                        flex: 1,
                        minWidth: 0,
                        fontWeight: 500,
                        textDecoration: task.status === 'done' ? 'line-through' : 'none',
                        color: task.status === 'done' ? 'var(--text-muted)' : 'inherit',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical'
                    }}>
                        {task.title}
                    </div>
                </div>

                {/* Description Row - Full Width */}
                {task.description && (
                    <div style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        maxHeight: '3em',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                        opacity: 0.8
                    }}>
                        {task.description}
                    </div>
                )}

                {/* Metadata Row - Tags, Completion */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && task.tags.map(tag => (
                        <span key={tag} style={{
                            fontSize: '10px',
                            background: 'rgba(255,255,255,0.1)',
                            padding: '2px 6px',
                            borderRadius: '8px',
                            color: 'var(--text-secondary)'
                        }}>
                            #{tag}
                        </span>
                    ))}

                    {/* Completion Timestamp */}
                    {task.status === 'done' && task.completedAt && (
                        <div style={{ fontSize: '12px', color: 'var(--accent-success)', fontStyle: 'italic' }}>
                            ✓ Completed {formatTimestamp(task.completedAt)}
                        </div>
                    )}

                    {/* Priority */}
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {(task.priority && task.priority !== 'none') ? `Priority: ${task.priority}` : 'No Priority'} • {task.quadrant?.toUpperCase()}
                    </div>
                </div>

                {/* Controls Row - Wrappable */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {task.dueDate && (
                        <div style={{ fontSize: '12px', color: 'var(--accent-warning)', whiteSpace: 'nowrap' }}>
                            {task.dueDate}
                        </div>
                    )}

                    {task.project && (
                        <div style={{
                            fontSize: '11px',
                            background: 'rgba(168, 85, 247, 0.2)',
                            color: '#c084fc',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            whiteSpace: 'nowrap'
                        }}>
                            📁 {task.project}
                        </div>
                    )}

                    {task.assignee && (
                        <div style={{
                            fontSize: '11px',
                            background: 'rgba(59, 130, 246, 0.2)',
                            color: '#60a5fa',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap'
                        }}>
                            👤 {task.assignee}
                        </div>
                    )}

                    {/* Unified Action Dropdown (Revisit / Follow Up) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <select
                            value=""
                            onChange={(e) => {
                                const val = e.target.value;
                                if (!val) return;

                                let dueAt = null;
                                const now = Date.now();

                                if (val === 'clear') {
                                    dueAt = null;
                                } else if (!isNaN(val)) {
                                    // Handle minutes (15, 60, etc.)
                                    dueAt = now + (parseInt(val) * 60 * 1000);
                                } else {
                                    // Handle smart strings
                                    const d = new Date();

                                    switch (val) {
                                        case 'tomorrow_morning':
                                            d.setDate(d.getDate() + 1);
                                            d.setHours(9, 0, 0, 0);
                                            break;
                                        case 'tomorrow_eod':
                                            d.setDate(d.getDate() + 1);
                                            d.setHours(17, 0, 0, 0);
                                            break;
                                        case '2d':
                                            d.setDate(d.getDate() + 2);
                                            d.setHours(9, 0, 0, 0);
                                            break;
                                        case '3d':
                                            d.setDate(d.getDate() + 3);
                                            d.setHours(9, 0, 0, 0);
                                            break;
                                        case 'next_monday_morning':
                                            d.setDate(d.getDate() + (8 - d.getDay()) % 7 || 7); // Next Monday
                                            d.setHours(9, 0, 0, 0);
                                            break;
                                        case 'next_monday_afternoon':
                                            d.setDate(d.getDate() + (8 - d.getDay()) % 7 || 7);
                                            d.setHours(14, 0, 0, 0);
                                            break;
                                        case 'next_tuesday_morning':
                                            d.setDate(d.getDate() + (9 - d.getDay()) % 7 || 7); // Next Tuesday
                                            d.setHours(9, 0, 0, 0);
                                            break;
                                        case 'next_tuesday_afternoon':
                                            d.setDate(d.getDate() + (9 - d.getDay()) % 7 || 7);
                                            d.setHours(14, 0, 0, 0);
                                            break;
                                    }
                                    dueAt = d.getTime();

                                    // If calculated time is in the past (e.g. it's 10 AM and we selected 9 AM today), add a day
                                    if (dueAt <= now) {
                                        dueAt += 24 * 60 * 60 * 1000;
                                    }
                                }

                                if (task.assignee) {
                                    // Handle Follow Up
                                    if (onUpdateTask) {
                                        onUpdateTask(task.id, {
                                            followUp: {
                                                ...(task.followUp || {}), // Ensure existing followUp is preserved or initialized
                                                dueAt,
                                                startedAt: dueAt ? now : null,
                                                status: 'pending'
                                            }
                                        });
                                    }
                                } else {
                                    // Handle Revisit (Reminder)
                                    if (val === 'clear') {
                                        handleDismissReminder(task.id);
                                    } else {
                                        handleSetReminder(task.id, parseInt(val));
                                    }
                                }
                            }}
                            style={{
                                background: (task.followUp?.dueAt || task.remindAt) ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                                border: (task.followUp?.dueAt || task.remindAt) ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                                color: (task.followUp?.dueAt || task.remindAt) ? '#fbbf24' : 'var(--text-secondary)',
                                padding: '2px 4px',
                                fontSize: '10px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                            }}
                            title={
                                task.assignee
                                    ? (task.followUp?.dueAt ? `Follow up due: ${new Date(task.followUp.dueAt).toLocaleString()}` : "Set Follow Up")
                                    : (task.remindAt ? `Revisit due: ${new Date(task.remindAt).toLocaleString()}` : "Set Revisit")
                            }
                        >
                            <option value="" disabled hidden>
                                {(task.followUp?.dueAt || task.remindAt) ? '🔔 Active' : (task.assignee ? '🔔 Follow Up' : '🔔 Revisit')}
                            </option>
                            <optgroup label="Quick">
                                <option value="0.5">30s</option>
                                <option value="1">1m</option>
                                <option value="15">15m</option>
                                <option value="60">1h</option>
                                <option value="180">3h</option>
                            </optgroup>
                            <optgroup label="Days">
                                <option value="tomorrow_morning">Tomorrow Morning (9 AM)</option>
                                <option value="tomorrow_eod">Tomorrow EOD (5 PM)</option>
                                <option value="2d">2 Days (9 AM)</option>
                                <option value="3d">3 Days (9 AM)</option>
                            </optgroup>
                            <optgroup label="Next Week">
                                <option value="next_monday_morning">Next Monday Morning</option>
                                <option value="next_monday_afternoon">Next Monday Afternoon</option>
                                <option value="next_tuesday_morning">Next Tuesday Morning</option>
                                <option value="next_tuesday_afternoon">Next Tuesday Afternoon</option>
                            </optgroup>
                            {(task.followUp?.dueAt || task.remindAt) && <option value="clear">❌ Clear</option>}
                        </select>

                        {/* Circular Progress for Revisit/Reminder */}
                        {((!task.assignee && task.remindAt && task.reminderStartedAt) || (task.assignee && task.followUp?.dueAt && task.followUp?.startedAt)) && (
                            <CircularProgress
                                startTime={task.assignee ? task.followUp.startedAt : task.reminderStartedAt}
                                endTime={task.assignee ? task.followUp.dueAt : task.remindAt}
                                size={16}
                            />
                        )}
                    </div>

                    {/* Contextual Reminder Label */}
                    {task.reminding && (
                        <div style={{
                            fontSize: '10px',
                            color: 'white',
                            background: 'var(--accent-primary)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            animation: 'pulse-glow 2s infinite',
                            whiteSpace: 'nowrap'
                        }}>
                            🔔 {
                                task.dueDate && new Date(task.dueDate) < Date.now() ? 'Overdue' :
                                    task.followUp?.dueAt && task.followUp.dueAt <= Date.now() ? 'Follow Up Due' :
                                        task.remindAt && task.remindAt <= Date.now() ? 'Revisit Due' :
                                            'Reminder'
                            }
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDismissReminder(task.id);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    padding: 0,
                                    marginLeft: '4px',
                                    opacity: 0.8
                                }}
                                title="Dismiss"
                            >
                                ×
                            </button>
                        </div>
                    )}

                    {/* Focus Pointer Control */}
                    <div className="focus-control" style={{ position: 'relative' }}>
                        <FunnyTooltip context="focus">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowFocusPicker(!showFocusPicker);
                                }}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: activeFocusColor || 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    fontSize: '14px',
                                    opacity: activeFocusColor || showFocusPicker ? 1 : 0.5
                                }}
                                title="Set Focus Pointer"
                            >
                                ➤
                            </button>
                        </FunnyTooltip>
                        {showFocusPicker && (
                            <div className="focus-picker" style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                background: 'rgba(24, 27, 33, 0.95)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                padding: '8px',
                                display: 'flex',
                                gap: '6px',
                                zIndex: 100,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                backdropFilter: 'blur(12px)'
                            }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSetFocus(task.id, null);
                                        setShowFocusPicker(false);
                                    }}
                                    title="None"
                                    style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1px solid #555', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#aaa' }}
                                >
                                    ✕
                                </button>
                                {Object.entries(focusColors).map(([name, color]) => (
                                    <button
                                        key={name}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSetFocus(task.id, name);
                                            setShowFocusPicker(false);
                                        }}
                                        title={name}
                                        style={{
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            border: 'none',
                                            background: color,
                                            cursor: 'pointer',
                                            boxShadow: task.focusColor === name ? '0 0 0 2px white' : 'none',
                                            transition: 'transform 0.1s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <FunnyTooltip context="edit">
                        <button
                            onClick={() => setEditingTask(task)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
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
                    </FunnyTooltip>

                    <FunnyTooltip context="delete">
                        <button
                            onClick={() => onDeleteTask(task.id)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
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
                    </FunnyTooltip>
                </div>

                {/* Deadline Progress Bar & Phrases */}
                {task.dueDate && <LiveDeadline dueDate={task.dueDate} createdAt={task.createdAt} />}
            </div>
        </div>
    );

    // Wrap focused tasks with spinning conic gradient border
    if (activeFocusColor) {
        return (
            <div
                style={{
                    position: 'relative',
                    display: 'inline-flex',
                    width: '100%',
                    overflow: 'hidden',
                    borderRadius: 'var(--radius-md)',
                    padding: '2px',
                    marginBottom: '8px'
                }}
            >
                <span
                    style={{
                        position: 'absolute',
                        inset: '-1000%',
                        background: 'conic-gradient(from 90deg at 50% 50%, #E2CBFF 0%, #393BB2 50%, #E2CBFF 100%)',
                        animation: 'spin 2s linear infinite'
                    }}
                />
                <span
                    style={{
                        position: 'relative',
                        zIndex: 1,
                        display: 'inline-flex',
                        width: '100%',
                        borderRadius: 'calc(var(--radius-md) - 2px)',
                        background: '#0a0b0d',
                        flexDirection: 'column'
                    }}
                >
                    {taskContent}
                </span>
            </div>
        );
    }

    return taskContent;
}

function LiveDeadline({ dueDate, createdAt }) {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const due = new Date(dueDate).getTime();
    const created = createdAt || now;
    const totalDuration = due - created;
    const elapsed = now - created;
    const progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

    const diff = due - now;
    const isOverdue = diff < 0;
    const absDiff = Math.abs(diff);

    // Calculate time units
    const minutes = Math.floor((absDiff / (1000 * 60)) % 60);
    const hours = Math.floor((absDiff / (1000 * 60 * 60)) % 24);
    const days = Math.floor((absDiff / (1000 * 60 * 60 * 24)) % 7);
    const weeks = Math.floor((absDiff / (1000 * 60 * 60 * 24 * 7)) % 4);
    const months = Math.floor((absDiff / (1000 * 60 * 60 * 24 * 30)) % 12);
    const years = Math.floor(absDiff / (1000 * 60 * 60 * 24 * 365));

    // Construct string
    const parts = [];
    if (years > 0) parts.push(`${years}y`);
    if (months > 0) parts.push(`${months}mo`);
    if (weeks > 0) parts.push(`${weeks}w`);
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    if (parts.length === 0) parts.push('Due now');

    const timeString = parts.join(' ');
    const label = isOverdue ? `${timeString} overdue` : `${timeString} left`;

    // Phrases logic
    const daysTotal = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    const getDeadlinePhrase = (d) => {
        if (d < 0) return "Too little, too late. 💀";
        if (d === 0) return "Panic mode: ON. 🚨";
        if (d <= 1) return "Do it now or regret it later. ⏳";
        if (d <= 3) return "Tick tock, the clock is ticking. ⏰";
        if (d <= 7) return "Don't get too comfortable. 👀";
        return "Future you will thank you. 🌱";
    };

    return (
        <div style={{ marginTop: '8px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                <span style={{ fontStyle: 'italic', opacity: 0.8 }}>{getDeadlinePhrase(daysTotal)}</span>
                <span style={{ fontWeight: 600, color: daysTotal <= 1 ? 'var(--accent-danger)' : 'inherit' }}>
                    {label}
                </span>
            </div>
            <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    background: daysTotal < 0 ? 'var(--accent-danger)' : (daysTotal <= 2 ? 'var(--accent-warning)' : 'linear-gradient(90deg, #3b82f6, #8b5cf6)'),
                    borderRadius: '2px',
                    transition: 'width 1s ease-in-out',
                    boxShadow: '0 0 8px rgba(59, 130, 246, 0.3)'
                }} />
            </div>
        </div>
    );
}
