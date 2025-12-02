import React from 'react';

export function NotificationPanel({ notifications, onDismiss, onSnooze, onComplete }) {
    if (!notifications || notifications.length === 0) return null;

    return (
        <div className="fade-in" style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            bottom: '20px',
            width: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            zIndex: 1000,
            pointerEvents: 'none' // Allow clicking through empty space
        }}>
            <div style={{
                pointerEvents: 'auto',
                display: 'flex',
                justifyContent: 'flex-end',
                paddingRight: '8px'
            }}>
                <span style={{
                    background: 'var(--accent-primary)',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                    {notifications.length} Notification{notifications.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                paddingRight: '4px',
                pointerEvents: 'auto'
            }}>
                {notifications.map(notification => (
                    <div key={notification.id} className="glass-panel" style={{
                        padding: '16px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(24, 27, 33, 0.95)',
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        animation: 'slideInRight 0.3s ease-out'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '16px' }}>🔔</span>
                                <strong style={{ fontSize: '13px', color: 'var(--accent-warning)' }}>Follow Up Due</strong>
                            </div>
                            <button
                                onClick={() => onDismiss(notification.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    opacity: 0.7,
                                    transition: 'opacity 0.2s'
                                }}
                                title="Dismiss"
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '12px', lineHeight: '1.4' }}>
                            {notification.message}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => onComplete(notification.taskId, notification.id)}
                                className="btn-primary"
                                style={{ padding: '6px 12px', fontSize: '12px', flex: 1 }}
                            >
                                Complete
                            </button>
                            <button
                                onClick={() => onSnooze(notification.taskId, notification.id)}
                                className="btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '12px', flex: 1 }}
                            >
                                Snooze 1h
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
