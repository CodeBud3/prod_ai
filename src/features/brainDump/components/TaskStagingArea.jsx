import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
    selectBrainDumpStagedTasks,
    selectBrainDumpUsedFallback
} from '../brainDumpSelectors';
import {
    goBackToInput,
    closeBrainDump
} from '../brainDumpSlice';
import { bulkAddTasks } from '../../tasks/tasksSlice';
import { StagedTaskCard } from './StagedTaskCard';

export function TaskStagingArea({ onClose }) {
    const dispatch = useDispatch();
    const stagedTasks = useSelector(selectBrainDumpStagedTasks);
    const usedFallback = useSelector(selectBrainDumpUsedFallback);

    const handleAddAll = () => {
        if (stagedTasks.length === 0) return;

        // Dispatch bulk add
        dispatch(bulkAddTasks(stagedTasks));

        // Close modal
        dispatch(closeBrainDump());
    };

    const handleBack = () => {
        dispatch(goBackToInput());
    };

    return (
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 25 }}
            style={{
                width: '100%',
                maxWidth: '900px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h2 style={{
                        fontSize: '28px',
                        fontWeight: 700,
                        marginBottom: '4px'
                    }}>
                        ✅ Review Your Tasks
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {stagedTasks.length} task{stagedTasks.length !== 1 ? 's' : ''} extracted
                        {usedFallback && ' (processed locally)'}
                    </p>
                </div>

                <button
                    onClick={onClose}
                    style={{
                        width: '36px',
                        height: '36px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'var(--text-secondary)',
                        fontSize: '18px',
                        cursor: 'pointer'
                    }}
                >
                    ✕
                </button>
            </div>

            {/* Fallback notice */}
            {usedFallback && (
                <div style={{
                    padding: '12px 16px',
                    background: 'rgba(251, 191, 36, 0.1)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: '8px',
                    color: '#fcd34d',
                    fontSize: '14px'
                }}>
                    ⚡ Processed with local NLP. Add a Gemini API key for smarter parsing.
                </div>
            )}

            {/* Task List */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                paddingRight: '8px'
            }}>
                {stagedTasks.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        color: 'var(--text-muted)'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤔</div>
                        <p>No tasks were extracted. Try adding more detail to your input.</p>
                    </div>
                ) : (
                    stagedTasks.map((task, index) => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <StagedTaskCard task={task} />
                        </motion.div>
                    ))
                )}
            </div>

            {/* Actions */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <button
                    onClick={handleBack}
                    style={{
                        padding: '12px 24px',
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: 'var(--text-secondary)',
                        fontSize: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    ← Back to Edit
                </button>

                <button
                    onClick={handleAddAll}
                    disabled={stagedTasks.length === 0}
                    style={{
                        padding: '14px 32px',
                        background: stagedTasks.length > 0
                            ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                            : 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: 600,
                        cursor: stagedTasks.length > 0 ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    ✅ Add All {stagedTasks.length} Tasks
                </button>
            </div>
        </motion.div>
    );
}
