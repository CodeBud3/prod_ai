import React from 'react';

export function TaskProgressCard({ tasks, completed, total }) {
    return (
        <div className="glass-panel" style={{
            padding: '24px',
            borderRadius: '24px',
            background: 'var(--surface-secondary)',
            border: '1px solid rgba(255,255,255,0.08)'
        }}>
            <div style={{ display: 'flex', gap: '24px' }}>
                {/* Left: Progress Counter */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '100px'
                }}>
                    <div style={{
                        fontSize: '14px',
                        color: 'var(--text-muted)',
                        marginBottom: '4px'
                    }}>
                        ≡
                    </div>
                    <div style={{
                        fontSize: '48px',
                        fontWeight: 700,
                        lineHeight: 1,
                        color: 'var(--text-primary)'
                    }}>
                        {completed}/{total}
                    </div>
                    <div style={{
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        marginTop: '4px'
                    }}>
                        tasks done
                    </div>
                </div>

                {/* Right: Task List */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    {tasks.slice(0, 3).map((task, i) => (
                        <div key={task.id || i} style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px'
                        }}>
                            <div style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                border: task.status === 'done'
                                    ? '2px solid var(--accent-success)'
                                    : '2px solid var(--text-muted)',
                                background: task.status === 'done'
                                    ? 'var(--accent-success)'
                                    : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                color: 'white',
                                flexShrink: 0,
                                marginTop: '2px'
                            }}>
                                {task.status === 'done' && '✓'}
                            </div>
                            <div>
                                <div style={{
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: task.status === 'done'
                                        ? 'var(--accent-success)'
                                        : 'var(--text-primary)',
                                    textDecoration: task.status === 'done' ? 'line-through' : 'none'
                                }}>
                                    {task.title}
                                </div>
                                <div style={{
                                    fontSize: '11px',
                                    color: 'var(--text-muted)'
                                }}>
                                    {task.dueDate
                                        ? new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        : 'No time set'}
                                </div>
                            </div>
                        </div>
                    ))}
                    {tasks.length === 0 && (
                        <div style={{
                            fontSize: '13px',
                            color: 'var(--text-muted)',
                            fontStyle: 'italic'
                        }}>
                            No tasks scheduled for today
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
