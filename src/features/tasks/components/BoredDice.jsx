import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectAllTasks } from '../tasksSelectors';
import { toggleTask } from '../tasksSlice';
import confetti from 'canvas-confetti';

// "I'm Bored" Dice: Randomly pick a task based on energy level
export function BoredDice({ onClose }) {
    const dispatch = useDispatch();
    const tasks = useSelector(selectAllTasks);
    const [energyLevel, setEnergyLevel] = useState('any'); // 'low', 'medium', 'high', 'any'
    const [isRolling, setIsRolling] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [diceEmoji, setDiceEmoji] = useState('🎲');

    // Filter incomplete tasks
    const incompleteTasks = tasks.filter(t => t.status !== 'done');

    // Filter by energy level (based on priority - low energy = low priority tasks)
    const getFilteredTasks = () => {
        if (energyLevel === 'any') return incompleteTasks;

        const priorityMap = {
            low: ['low', 'none'], // Low energy = easy tasks
            medium: ['medium'],
            high: ['high', 'critical'] // High energy = hard tasks
        };

        return incompleteTasks.filter(t =>
            priorityMap[energyLevel].includes(t.priority || 'none')
        );
    };

    const rollDice = () => {
        const eligible = getFilteredTasks();
        if (eligible.length === 0) {
            setSelectedTask(null);
            return;
        }

        setIsRolling(true);
        setSelectedTask(null);

        // Dice rolling animation
        const diceFrames = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        let frameIndex = 0;
        const rollInterval = setInterval(() => {
            setDiceEmoji(diceFrames[frameIndex % diceFrames.length]);
            frameIndex++;
        }, 100);

        // Stop rolling after animation
        setTimeout(() => {
            clearInterval(rollInterval);
            setDiceEmoji('🎲');
            setIsRolling(false);

            // Pick a random task
            const randomIndex = Math.floor(Math.random() * eligible.length);
            setSelectedTask(eligible[randomIndex]);

            // Mini confetti
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 },
                colors: ['#a855f7', '#3b82f6', '#10b981']
            });
        }, 1000);
    };

    const handleComplete = () => {
        if (!selectedTask) return;

        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']
        });

        dispatch(toggleTask(selectedTask.id));
        setSelectedTask(null);
    };

    const energyOptions = [
        { id: 'low', label: '🦥 Low Energy', description: 'Easy, mindless tasks' },
        { id: 'medium', label: '⚡ Medium', description: 'Moderate effort' },
        { id: 'high', label: '🔥 High Energy', description: 'Challenging tasks' },
        { id: 'any', label: '🎰 Surprise Me', description: 'Any task!' }
    ];

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            animation: 'fadeIn 0.3s ease'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                borderRadius: '24px',
                padding: '40px',
                maxWidth: '500px',
                width: '90%',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: '24px',
                        cursor: 'pointer'
                    }}
                >
                    ✕
                </button>

                {/* Header */}
                <h2 style={{ fontSize: '28px', marginBottom: '8px', color: 'white' }}>
                    🎲 I'm Bored Dice
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '32px' }}>
                    Can't decide what to do? Let fate choose!
                </p>

                {/* Energy Level Selection */}
                <div style={{ marginBottom: '32px' }}>
                    <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '12px', fontSize: '14px' }}>
                        How much energy do you have?
                    </p>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {energyOptions.map(option => (
                            <button
                                key={option.id}
                                onClick={() => setEnergyLevel(option.id)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    background: energyLevel === option.id
                                        ? 'linear-gradient(135deg, var(--accent-primary) 0%, #7c3aed 100%)'
                                        : 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'all 0.2s',
                                    boxShadow: energyLevel === option.id
                                        ? '0 4px 15px rgba(139, 92, 246, 0.4)'
                                        : 'none'
                                }}
                                title={option.description}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Dice */}
                <div
                    onClick={!isRolling ? rollDice : undefined}
                    style={{
                        fontSize: '120px',
                        cursor: isRolling ? 'default' : 'pointer',
                        marginBottom: '24px',
                        transition: 'transform 0.2s',
                        animation: isRolling ? 'shake 0.1s infinite' : 'none',
                        userSelect: 'none'
                    }}
                >
                    {diceEmoji}
                </div>

                {!selectedTask && !isRolling && (
                    <button
                        onClick={rollDice}
                        disabled={incompleteTasks.length === 0}
                        style={{
                            padding: '16px 40px',
                            fontSize: '18px',
                            fontWeight: 600,
                            background: 'linear-gradient(135deg, var(--accent-primary) 0%, #7c3aed 100%)',
                            border: 'none',
                            borderRadius: '12px',
                            color: 'white',
                            cursor: incompleteTasks.length === 0 ? 'not-allowed' : 'pointer',
                            opacity: incompleteTasks.length === 0 ? 0.5 : 1,
                            boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)'
                        }}
                    >
                        🎲 Roll the Dice!
                    </button>
                )}

                {isRolling && (
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px' }}>
                        Rolling...
                    </p>
                )}

                {/* Selected Task */}
                {selectedTask && !isRolling && (
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '16px',
                        padding: '24px',
                        marginTop: '16px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Your Mission:
                        </p>
                        <h3 style={{ fontSize: '24px', color: 'white', marginBottom: '16px' }}>
                            {selectedTask.title}
                        </h3>
                        {selectedTask.description && (
                            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
                                {selectedTask.description}
                            </p>
                        )}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                onClick={handleComplete}
                                style={{
                                    padding: '12px 24px',
                                    fontSize: '16px',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    border: 'none',
                                    borderRadius: '10px',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                ✓ Done!
                            </button>
                            <button
                                onClick={rollDice}
                                style={{
                                    padding: '12px 24px',
                                    fontSize: '16px',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    borderRadius: '10px',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                🎲 Re-roll
                            </button>
                        </div>
                    </div>
                )}

                {incompleteTasks.length === 0 && (
                    <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '16px' }}>
                        No tasks to roll! Add some tasks first.
                    </p>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes shake {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-15deg); }
                    75% { transform: rotate(15deg); }
                }
            `}</style>
        </div>
    );
}
