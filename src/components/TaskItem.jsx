import React from 'react';
import { CircularProgress } from './CircularProgress';

export function TaskItem({ task, toggleTask, setEditingTask, handleSetReminder, handleDismissReminder, onDeleteTask, getPriorityColor, formatTimestamp }) {
    return (
        <div
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
                                title: `Follow up due: ${new Date(task.followUp.dueAt).toLocaleString()}`
                            }}>
                                🔔
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
    );
}
