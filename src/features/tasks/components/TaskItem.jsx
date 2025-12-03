import React, { useState } from 'react';
import { CircularProgress } from '../../../components/ui';
import confetti from 'canvas-confetti';
import { MotivationalPopup } from '../../../components/ui';
import { FunnyTooltip } from '../../../components/ui';

export function TaskItem({ task, toggleTask, setEditingTask, handleSetReminder, handleDismissReminder, onDeleteTask, getPriorityColor, formatTimestamp, handleSetFocus }) {
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
                spread: 40,
                startVelocity: 45,
                gravity: 1.5,
                decay: 0.85,
                scalar: 0.6,
                origin: { x, y },
                colors: ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
                disableForReducedMotion: true,
                zIndex: 1000,
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
                // background: activeFocusColor ? 'transparent' : 'rgba(255,255,255,0.03)',
                background: activeFocusColor ? `linear-gradient(90deg, ${activeFocusColor}15 0%, rgba(255,255,255,0.03) 100%)` : 'rgba(255,255,255,0.03)',
                marginBottom: activeFocusColor ? '0' : '8px',
                borderRadius: 'var(--radius-md)',
                borderLeft: activeFocusColor ? `6px solid ${activeFocusColor}` : `4px solid ${getPriorityColor(task.priority) || 'var(--text-muted)'}`,
                cursor: 'default',
                position: 'relative',
                boxShadow: activeFocusColor ? `0 0 15px ${activeFocusColor}20` : 'none',
                transition: 'all 0.3s ease'
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
                        {/* Tags Display */}
                        {task.tags && task.tags.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                                {task.tags.map(tag => (
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
                                letterSpacing: '0.5px'
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
                                gap: '4px'
                            }}>
                                👤 {task.assignee}
                            </div>
                        )}

                        {task.followUp?.dueAt && (
                            <div style={{
                                fontSize: '11px',
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                title: `Review due: ${new Date(task.followUp.dueAt).toLocaleString()}`
                            }}>
                                🔔
                            </div>
                        )}


                        {/* Reminder Button/Dropdown */}
                        {task.reminding ? (
                            <FunnyTooltip context="reminder">
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
                            </FunnyTooltip>
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
                                        color: activeFocusColor || 'var(--text-muted)',
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
                        </FunnyTooltip>
                        <FunnyTooltip context="delete">
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
                        </FunnyTooltip>
                    </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {task.priority !== 'none' ? `Priority: ${task.priority}` : 'No Priority'} • {task.quadrant?.toUpperCase()}
                </div>
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
                        display: 'inline-flex',
                        width: '100%',
                        height: '100%',
                        borderRadius: 'var(--radius-md)',
                        // background: 'var(--bg-glass)',
                        background: 'black',
                        backdropFilter: 'blur(var(--glass-blur))'
                    }}
                >
                    {taskContent}
                </span>
            </div>
        );
    }

    return taskContent;
}
