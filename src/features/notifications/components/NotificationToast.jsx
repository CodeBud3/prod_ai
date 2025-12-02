import React, { useEffect } from 'react';

export function NotificationToast({ notification, onDismiss, onSnooze, onComplete }) {
    useEffect(() => {
        // Auto-dismiss after 10 seconds if no action
        const timer = setTimeout(() => {
            onDismiss();
        }, 10000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div className="fade-in" style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'rgba(24, 27, 33, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--accent-primary)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            zIndex: 2000,
            maxWidth: '350px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>🔔</span>
                    <strong style={{ fontSize: '14px' }}>Follow Up Due</strong>
                </div>
                <button
                    onClick={onDismiss}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}
                >
                    ✕
                </button>
            </div>

            <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                {notification.message}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                    onClick={onComplete}
                    className="btn-primary"
                    style={{ padding: '6px 12px', fontSize: '12px', flex: 1 }}
                >
                    Mark Complete
                </button>
                <button
                    onClick={onSnooze}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px', flex: 1 }}
                >
                    Snooze 1h
                </button>
            </div>
        </div>
    );
}
