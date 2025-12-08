import React, { useEffect } from 'react';

export function NotificationToast({ notification, onDismiss, onSnooze, onComplete }) {
    useEffect(() => {
        // Play alarm sound
        const audio = new Audio('/Aircraft_Seatbelt_Sign_Sound_Effect-639486-mobiles24.mp3');
        audio.loop = true;

        // Attempt to play (might be blocked by browser policy if no interaction, but we try)
        audio.play().catch(err => console.warn("Audio playback failed:", err));

        return () => {
            audio.pause();
            audio.currentTime = 0;
        };
    }, []);

    return (
        <div className="fade-in" style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'rgba(24, 27, 33, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--accent-danger)', // Red border for urgency
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            zIndex: 2000,
            maxWidth: '350px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            animation: 'pulse-alarm 1.5s infinite'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>🚨</span>
                    <strong style={{ fontSize: '14px', color: 'var(--accent-danger)' }}>Attention Needed!</strong>
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
                    style={{ padding: '6px 12px', fontSize: '12px', flex: 1, background: 'var(--accent-success)', borderColor: 'var(--accent-success)' }}
                >
                    Complete
                </button>
                <button
                    onClick={onSnooze}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px', flex: 1 }}
                >
                    Snooze 1h
                </button>
            </div>

            <style>{`
                @keyframes pulse-alarm {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
            `}</style>
        </div>
    );
}
