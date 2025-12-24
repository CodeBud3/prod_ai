import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
    selectBrainDumpIsOpen,
    selectBrainDumpRawInput,
    selectBrainDumpIsProcessing,
    selectBrainDumpError,
    selectBrainDumpCurrentView,
    selectBrainDumpUsedFallback
} from '../brainDumpSelectors';
import {
    setRawInput,
    closeBrainDump,
    processBrainDumpAsync
} from '../brainDumpSlice';
import { TaskStagingArea } from './TaskStagingArea';

export function BrainDumpModal() {
    const dispatch = useDispatch();
    const isOpen = useSelector(selectBrainDumpIsOpen);
    const rawInput = useSelector(selectBrainDumpRawInput);
    const isProcessing = useSelector(selectBrainDumpIsProcessing);
    const error = useSelector(selectBrainDumpError);
    const currentView = useSelector(selectBrainDumpCurrentView);
    const usedFallback = useSelector(selectBrainDumpUsedFallback);

    const [charCount, setCharCount] = useState(0);

    useEffect(() => {
        setCharCount(rawInput.length);
    }, [rawInput]);

    useEffect(() => {
        if (!isOpen) return;
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        dispatch(setRawInput(e.target.value));
    };

    const handleProcess = () => {
        if (rawInput.trim().length < 3) return;
        dispatch(processBrainDumpAsync(rawInput));
    };

    const handleClose = () => {
        dispatch(closeBrainDump());
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            handleClose();
        }
        if (e.key === 'Enter' && e.metaKey) {
            handleProcess();
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.9)',
                    backdropFilter: 'blur(20px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px'
                }}
                onKeyDown={handleKeyDown}
            >
                {currentView === 'input' ? (
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 25 }}
                        style={{
                            width: '100%',
                            maxWidth: '800px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '24px'
                        }}
                    >
                        {/* Header */}
                        <div style={{ textAlign: 'center' }}>
                            <h1 style={{
                                fontSize: '48px',
                                fontWeight: 700,
                                marginBottom: '12px',
                                background: 'linear-gradient(135deg, #818cf8, #c084fc)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>
                                🧠 Brain Dump
                            </h1>
                            <p style={{
                                fontSize: '18px',
                                color: 'var(--text-secondary)',
                                maxWidth: '500px',
                                margin: '0 auto'
                            }}>
                                Unload everything on your mind. We'll organize it for you.
                            </p>
                        </div>

                        {/* Main Input */}
                        <div style={{ position: 'relative' }}>
                            <textarea
                                value={rawInput}
                                onChange={handleInputChange}
                                placeholder={`Just type freely...

Examples:
• Buy groceries tomorrow
• Call John about the project @john #MARS
• Finish quarterly report by Friday !critical
• Ask Sarah to review the deck ~30m
• Meeting with client next Monday at 2pm`}
                                autoFocus
                                style={{
                                    width: '100%',
                                    minHeight: '300px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '2px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    color: 'var(--text-primary)',
                                    fontSize: '18px',
                                    lineHeight: '1.6',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                            />

                            {/* Character count */}
                            <div style={{
                                position: 'absolute',
                                bottom: '12px',
                                right: '16px',
                                fontSize: '12px',
                                color: 'var(--text-muted)'
                            }}>
                                {charCount} characters
                            </div>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div style={{
                                padding: '12px 16px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '8px',
                                color: '#fca5a5',
                                fontSize: '14px'
                            }}>
                                ⚠️ {error}
                            </div>
                        )}

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
                                ⚡ Processed locally. Connect to AI for smarter parsing.
                            </div>
                        )}

                        {/* Actions */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <button
                                onClick={handleClose}
                                style={{
                                    padding: '12px 24px',
                                    background: 'transparent',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '8px',
                                    color: 'var(--text-secondary)',
                                    fontSize: '16px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    ⌘ + Enter
                                </span>
                                <button
                                    onClick={handleProcess}
                                    disabled={rawInput.trim().length < 3 || isProcessing}
                                    style={{
                                        padding: '14px 32px',
                                        background: rawInput.trim().length >= 3
                                            ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                            : 'rgba(255, 255, 255, 0.1)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        cursor: rawInput.trim().length >= 3 ? 'pointer' : 'not-allowed',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        opacity: isProcessing ? 0.7 : 1
                                    }}
                                >
                                    {isProcessing ? (
                                        <>
                                            <span className="spinner" style={{
                                                width: '16px',
                                                height: '16px',
                                                border: '2px solid rgba(255,255,255,0.3)',
                                                borderTopColor: 'white',
                                                borderRadius: '50%',
                                                animation: 'spin 1s linear infinite'
                                            }} />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            ✨ Process with AI
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Tips */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '24px',
                            fontSize: '12px',
                            color: 'var(--text-muted)'
                        }}>
                            <span>@name → assignee</span>
                            <span>#project → project</span>
                            <span>!priority → urgency</span>
                            <span>~30m → duration</span>
                        </div>
                    </motion.div>
                ) : (
                    <TaskStagingArea onClose={handleClose} />
                )}

                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </motion.div>
        </AnimatePresence>
    );
}
