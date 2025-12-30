import React from 'react';

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isDangerous = false
}) {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(4px)',
                zIndex: 3000,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px'
            }}
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'var(--surface-primary)',
                    borderRadius: '12px',
                    width: '100%',
                    maxWidth: '400px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    overflow: 'hidden',
                    animation: 'modal-pop 0.2s ease-out'
                }}
            >
                <div style={{ padding: '24px' }}>
                    <h3 style={{
                        margin: '0 0 8px 0',
                        fontSize: '18px',
                        fontWeight: 600,
                        color: 'var(--text-primary)'
                    }}>
                        {title}
                    </h3>
                    <p style={{
                        margin: 0,
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.5'
                    }}>
                        {message}
                    </p>
                </div>

                <div style={{
                    padding: '16px 24px',
                    background: 'rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 16px',
                            background: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        style={{
                            padding: '8px 16px',
                            background: isDangerous ? 'var(--accent-danger)' : 'var(--accent-primary)',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            boxShadow: isDangerous
                                ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                                : '0 4px 12px rgba(59, 130, 246, 0.3)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
