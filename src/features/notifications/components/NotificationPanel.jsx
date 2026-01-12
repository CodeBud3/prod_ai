import React, { useEffect, useRef, useState } from 'react';

// Sound file paths for different notification types
const SOUNDS = {
    dueDate: '/critical_alarm.mp3',           // Critical: tasks nearing/at/past due date
    followUp: '/porsche_seatbelt_chime.mp3',  // Intermediate: follow-up reminders
    reminder: '/Aircraft_Seatbelt_Sign_Sound_Effect-639486-mobiles24.mp3'  // Revisit tasks & 'remind me x time before'
};

import UseAnimations from 'react-useanimations';
import trash2 from 'react-useanimations/lib/trash2';

export function NotificationPanel({ notifications, onDismiss, onSnooze, onComplete }) {
    const audioRef = useRef(null);
    const [soundPlaying, setSoundPlaying] = useState(false);
    const [currentSoundType, setCurrentSoundType] = useState(null);
    const [isMuted, setIsMuted] = useState(() => {
        // Persist mute preference in localStorage
        return localStorage.getItem('notification_muted') === 'true';
    });

    // Helper to immediately stop audio
    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        setSoundPlaying(false);
        setCurrentSoundType(null);
    };

    // Determine which sound to play based on notification priority
    // Priority: dueDate > followUp > reminder
    const getHighestPriorityType = (notifs) => {
        if (notifs.some(n => n.type === 'dueDate')) return 'dueDate';
        if (notifs.some(n => n.type === 'followUp')) return 'followUp';
        if (notifs.some(n => n.type === 'reminder')) return 'reminder';
        return 'reminder'; // Default fallback
    };

    // Audio playback effect
    useEffect(() => {
        // Stop any existing audio first
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }

        if (!notifications || notifications.length === 0) {
            setSoundPlaying(false);
            setCurrentSoundType(null);
            return;
        }

        const priorityType = getHighestPriorityType(notifications);
        setCurrentSoundType(priorityType);

        // Don't play audio if muted
        if (isMuted) {
            console.log('[NotificationPanel] Sound muted, skipping audio');
            setSoundPlaying(false);
            return;
        }

        // Create new audio with appropriate sound
        const soundPath = SOUNDS[priorityType] || SOUNDS.reminder;
        console.log('[NotificationPanel] Playing sound:', soundPath, 'for type:', priorityType);

        const audio = new Audio(soundPath);
        audio.loop = true;
        audioRef.current = audio;

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('[NotificationPanel] Audio playing successfully');
                    setSoundPlaying(true);
                })
                .catch(err => {
                    console.warn('[NotificationPanel] Audio playback failed:', err.message);
                    setSoundPlaying(false);
                });
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };
    }, [notifications?.length, notifications?.map(n => n.type).join(','), isMuted]);

    // Only return null AFTER the audio effect has had a chance to stop the audio
    if (!notifications || notifications.length === 0) return null;

    // Wrapped handlers that stop audio immediately before calling parent
    const handleDismiss = (notificationId) => {
        stopAudio();
        onDismiss(notificationId);
    };

    const handleSnooze = (taskId, notificationId) => {
        stopAudio();
        onSnooze(taskId, notificationId);
    };

    const handleComplete = (taskId, notificationId) => {
        stopAudio();
        onComplete(taskId, notificationId);
    };

    const handleToggleMute = () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        localStorage.setItem('notification_muted', newMuted.toString());
        if (newMuted) {
            stopAudio(); // Immediately stop audio when muting
        }
    };

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
                paddingRight: '8px',
                gap: '8px',
                alignItems: 'center'
            }}>
                {/* Mute/Unmute Toggle Button */}
                <button
                    onClick={handleToggleMute}
                    title={isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
                    style={{
                        background: isMuted ? 'var(--accent-danger)' : 'var(--accent-success)',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        transition: 'all 0.2s ease'
                    }}
                >
                    {isMuted ? '🔇 Muted' : '🔊 Sound On'}
                </button>
                {soundPlaying && !isMuted && (
                    <span style={{
                        background: 'var(--accent-warning)',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        animation: 'pulse 1s infinite'
                    }}>
                        🔔 Alarm Active
                    </span>
                )}
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
                {notifications.map(notification => {
                    // Get display info based on notification type
                    const typeConfig = {
                        dueDate: { icon: '🚨', label: 'Task Due/Overdue', color: 'var(--accent-danger)' },
                        followUp: { icon: '🔔', label: 'Follow Up Due', color: 'var(--accent-warning)' },
                        reminder: { icon: '⏰', label: 'Reminder', color: 'var(--accent-primary)' }
                    };
                    const config = typeConfig[notification.type] || typeConfig.reminder;

                    return (
                        <div key={notification.id} className="glass-panel" style={{
                            padding: '16px',
                            border: notification.type === 'dueDate' ? '1px solid var(--accent-danger)' : '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(24, 27, 33, 0.95)',
                            backdropFilter: 'blur(12px)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                            animation: 'slideInRight 0.3s ease-out'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '16px' }}>{config.icon}</span>
                                    <strong style={{ fontSize: '13px', color: config.color }}>{config.label}</strong>
                                </div>
                                <button
                                    title="Dismiss"
                                    onClick={() => handleDismiss(notification.id)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        opacity: 0.7,
                                        transition: 'opacity 0.2s'
                                    }}
                                >
                                    <UseAnimations
                                        animation={trash2}
                                        size={20}
                                        strokeColor="var(--text-secondary)"
                                    />
                                </button>
                            </div>

                            <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '12px', lineHeight: '1.4' }}>
                                {notification.message}
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => handleComplete(notification.taskId, notification.id)}
                                    className="btn-primary"
                                    style={{ padding: '6px 12px', fontSize: '12px', flex: 1 }}
                                >
                                    Complete
                                </button>
                                <button
                                    onClick={() => handleSnooze(notification.taskId, notification.id)}
                                    className="btn-secondary"
                                    style={{ padding: '6px 12px', fontSize: '12px', flex: 1 }}
                                >
                                    Snooze 1h
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div >
    );
}
