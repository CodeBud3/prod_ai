import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectDeletedTasks } from '../tasksSelectors';
import { restoreTask, permanentlyDeleteTask, emptyTrash } from '../tasksSlice';
import { ConfirmationModal } from '../../../components/ui';

export function TrashView({ onClose }) {
    const dispatch = useDispatch();
    const deletedTasks = useSelector(selectDeletedTasks);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDangerous: false,
        confirmLabel: 'Confirm'
    });

    // Prevent background scrolling when open
    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, []);

    const handleRestore = (taskId) => {
        dispatch(restoreTask(taskId));
    };

    const handlePermanentDelete = (taskId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Permanently?',
            message: 'Are you sure you want to permanently delete this task? This cannot be undone.',
            confirmLabel: 'Delete',
            isDangerous: true,
            onConfirm: () => dispatch(permanentlyDeleteTask(taskId))
        });
    };

    const handleEmptyTrash = () => {
        if (deletedTasks.length === 0) return;
        setConfirmModal({
            isOpen: true,
            title: 'Empty Trash?',
            message: `Are you sure you want to permanently delete ${deletedTasks.length} task(s)? This cannot be undone.`,
            confirmLabel: 'Empty Trash',
            isDangerous: true,
            onConfirm: () => dispatch(emptyTrash())
        });
    };

    const closeConfirm = () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    const formatDeletedTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'just now';
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(10px)',
                zIndex: 2000,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px'
            }}
        >
            <div
                style={{
                    background: 'var(--surface-primary)',
                    borderRadius: '16px',
                    width: '100%',
                    maxWidth: '600px',
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
                            🗑️ Trash
                        </h2>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {deletedTasks.length} deleted task{deletedTasks.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {deletedTasks.length > 0 && (
                            <button
                                onClick={handleEmptyTrash}
                                style={{
                                    padding: '8px 16px',
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '8px',
                                    color: '#ef4444',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                Empty Trash
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            style={{
                                padding: '8px 16px',
                                background: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                cursor: 'pointer'
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Task List */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px 24px'
                }}>
                    {deletedTasks.length === 0 ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '60px 20px',
                            color: 'var(--text-muted)'
                        }}>
                            <span style={{ fontSize: '48px', marginBottom: '16px' }}>🧹</span>
                            <p style={{ fontSize: '16px', margin: 0 }}>Trash is empty</p>
                            <p style={{ fontSize: '13px', margin: '8px 0 0', color: 'var(--text-secondary)' }}>
                                Deleted tasks will appear here
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {deletedTasks.map(task => (
                                <div
                                    key={task.id}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{
                                                margin: 0,
                                                fontSize: '14px',
                                                fontWeight: 500,
                                                color: 'var(--text-primary)',
                                                textDecoration: 'line-through',
                                                opacity: 0.7
                                            }}>
                                                {task.title}
                                            </h3>
                                            <p style={{
                                                margin: '6px 0 0',
                                                fontSize: '12px',
                                                color: 'var(--text-muted)'
                                            }}>
                                                Deleted {formatDeletedTime(task.deletedAt)}
                                                {task.project && <span> • {task.project}</span>}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => handleRestore(task.id)}
                                                title="Restore"
                                                style={{
                                                    padding: '6px 12px',
                                                    background: 'rgba(34, 197, 94, 0.2)',
                                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                                    borderRadius: '6px',
                                                    color: '#22c55e',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    fontWeight: 500
                                                }}
                                            >
                                                ↩ Restore
                                            </button>
                                            <button
                                                onClick={() => handlePermanentDelete(task.id)}
                                                title="Delete Permanently"
                                                style={{
                                                    padding: '6px 12px',
                                                    background: 'rgba(239, 68, 68, 0.2)',
                                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                                    borderRadius: '6px',
                                                    color: '#ef4444',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    fontWeight: 500
                                                }}
                                            >
                                                🗑 Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmLabel={confirmModal.confirmLabel}
                isDangerous={confirmModal.isDangerous}
            />
        </div>
    );
}
