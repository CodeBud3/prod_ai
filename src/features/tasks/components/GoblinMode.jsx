import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectAllTasks } from '../tasksSelectors';
import { toggleTask, dismissReminder } from '../tasksSlice';
import confetti from 'canvas-confetti';

// Goblin Mode: A distraction-free "panic button" view
// Shows ONLY the most critical or easiest task
export function GoblinMode({ onExit }) {
    const dispatch = useDispatch();
    const tasks = useSelector(selectAllTasks);
    const [mode, setMode] = useState('critical'); // 'critical' or 'easy'
    const [showCompleteAnimation, setShowCompleteAnimation] = useState(false);

    // Lock body scroll when component mounts
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto'; // or ''
        };
    }, []);

    // Filter incomplete tasks
    const incompleteTasks = tasks.filter(t => t.status !== 'done');

    // Get the most critical task (highest priority, soonest deadline)
    const getMostCriticalTask = () => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1, none: 0 };
        return [...incompleteTasks]
            .sort((a, b) => {
                // First by priority
                const pDiff = priorityOrder[b.priority || 'none'] - priorityOrder[a.priority || 'none'];
                if (pDiff !== 0) return pDiff;
                // Then by due date
                if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
                if (a.dueDate) return -1;
                if (b.dueDate) return 1;
                return 0;
            })[0];
    };

    // Get the easiest task (low priority, no deadline, short title)
    const getEasiestTask = () => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1, none: 0 };
        return [...incompleteTasks]
            .sort((a, b) => {
                // Prefer tasks without deadlines
                if (!a.dueDate && b.dueDate) return -1;
                if (a.dueDate && !b.dueDate) return 1;
                // Prefer lower priority
                const pDiff = priorityOrder[a.priority || 'none'] - priorityOrder[b.priority || 'none'];
                if (pDiff !== 0) return pDiff;
                // Prefer shorter titles (presumably simpler tasks)
                return (a.title?.length || 0) - (b.title?.length || 0);
            })[0];
    };

    const currentTask = mode === 'critical' ? getMostCriticalTask() : getEasiestTask();

    const handleComplete = () => {
        if (!currentTask) return;

        // Confetti explosion
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']
        });

        setShowCompleteAnimation(true);
        dispatch(toggleTask(currentTask.id));

        // Wait for animation, then check for next task
        setTimeout(() => {
            setShowCompleteAnimation(false);
        }, 1500);
    };

    const motivationalPhrases = [
        "You've got this. Just one thing.",
        "Small steps lead to big wins.",
        "Future you will be grateful.",
        "One task at a time.",
        "Just this. Nothing else matters right now."
    ];

    const randomPhrase = motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)];

    if (incompleteTasks.length === 0) {
        return (
            <div style={{
                position: 'fixed',
                inset: 0,
                background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                color: 'white'
            }}>
                <div style={{ fontSize: '80px', marginBottom: '24px' }}>🎉</div>
                <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>You're All Done!</h1>
                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '40px' }}>No tasks left. Go rest.</p>
                <button
                    onClick={onExit}
                    style={{
                        padding: '16px 32px',
                        fontSize: '18px',
                        background: 'var(--accent-primary)',
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                >
                    Exit Goblin Mode
                </button>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '40px',
            animation: 'fadeIn 0.3s ease'
        }}>
            {/* Exit Button */}
            <button
                onClick={onExit}
                style={{
                    position: 'absolute',
                    top: '24px',
                    right: '24px',
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    fontSize: '20px',
                    transition: 'all 0.2s'
                }}
                title="Exit Goblin Mode"
            >
                ✕
            </button>

            {/* Mode Toggle */}
            <div style={{
                position: 'absolute',
                top: '24px',
                left: '24px',
                display: 'flex',
                gap: '8px'
            }}>
                <button
                    onClick={() => setMode('critical')}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: 'none',
                        background: mode === 'critical' ? 'var(--accent-danger)' : 'rgba(255,255,255,0.1)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'all 0.2s'
                    }}
                >
                    🔥 Most Critical
                </button>
                <button
                    onClick={() => setMode('easy')}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: 'none',
                        background: mode === 'easy' ? 'var(--accent-success)' : 'rgba(255,255,255,0.1)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'all 0.2s'
                    }}
                >
                    🦥 Easiest First
                </button>
            </div>

            {/* Goblin Icon */}
            <div style={{ fontSize: '64px', marginBottom: '24px', opacity: 0.8 }}>
                👹
            </div>

            {/* Motivational Phrase */}
            <p style={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: '16px',
                marginBottom: '32px',
                fontStyle: 'italic'
            }}>
                {randomPhrase}
            </p>

            {/* The Task */}
            {showCompleteAnimation ? (
                <div style={{
                    fontSize: '80px',
                    animation: 'pulse 0.5s ease'
                }}>
                    ✓
                </div>
            ) : currentTask ? (
                <div style={{
                    textAlign: 'center',
                    maxWidth: '700px'
                }}>
                    <h1 style={{
                        fontSize: '56px',
                        fontWeight: 700,
                        marginBottom: '24px',
                        lineHeight: 1.2,
                        color: 'white',
                        textShadow: '0 4px 20px rgba(0,0,0,0.5)'
                    }}>
                        {currentTask.title}
                    </h1>

                    {currentTask.description && (
                        <p style={{
                            color: 'rgba(255,255,255,0.5)',
                            fontSize: '20px',
                            marginBottom: '24px',
                            lineHeight: 1.6
                        }}>
                            {currentTask.description}
                        </p>
                    )}

                    {/* Task Meta */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '16px',
                        marginBottom: '48px',
                        flexWrap: 'wrap'
                    }}>
                        {currentTask.dueDate && (
                            <span style={{
                                padding: '8px 16px',
                                background: 'rgba(245, 158, 11, 0.2)',
                                color: '#fbbf24',
                                borderRadius: '20px',
                                fontSize: '14px'
                            }}>
                                📅 {currentTask.dueDate}
                            </span>
                        )}
                        {currentTask.priority && currentTask.priority !== 'none' && (
                            <span style={{
                                padding: '8px 16px',
                                background: currentTask.priority === 'critical' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                                color: currentTask.priority === 'critical' ? '#f87171' : '#a78bfa',
                                borderRadius: '20px',
                                fontSize: '14px'
                            }}>
                                {currentTask.priority === 'critical' ? '💀' : '🔥'} {currentTask.priority}
                            </span>
                        )}
                        {currentTask.project && (
                            <span style={{
                                padding: '8px 16px',
                                background: 'rgba(59, 130, 246, 0.2)',
                                color: '#60a5fa',
                                borderRadius: '20px',
                                fontSize: '14px'
                            }}>
                                📁 {currentTask.project}
                            </span>
                        )}
                    </div>

                    {/* Complete Button */}
                    <button
                        onClick={handleComplete}
                        style={{
                            padding: '20px 48px',
                            fontSize: '20px',
                            fontWeight: 600,
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none',
                            borderRadius: '16px',
                            color: 'white',
                            cursor: 'pointer',
                            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)',
                            transition: 'all 0.2s'
                        }}
                    >
                        ✓ Done! Mark Complete
                    </button>
                </div>
            ) : null}

            {/* Remaining Count */}
            <div style={{
                position: 'absolute',
                bottom: '24px',
                color: 'rgba(255,255,255,0.3)',
                fontSize: '14px'
            }}>
                {incompleteTasks.length} task{incompleteTasks.length !== 1 ? 's' : ''} remaining
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                }
            `}</style>
        </div>
    );
}
