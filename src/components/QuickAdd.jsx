import React, { useState, useRef } from 'react';

export function QuickAdd({ onAdd }) {
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState('none'); // none, low, medium, high
    const [dueDate, setDueDate] = useState('');
    const titleInputRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        onAdd({
            title: title.trim(),
            priority,
            dueDate: dueDate || null
        });

        // Reset and keep focus
        setTitle('');
        setPriority('none');
        setDueDate('');
        titleInputRef.current?.focus();
    };

    const setDateShortcut = (days) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        setDueDate(date.toISOString().split('T')[0]);
    };

    const setNextWeek = () => {
        const date = new Date();
        date.setDate(date.getDate() + (8 - date.getDay())); // Next Monday
        setDueDate(date.toISOString().split('T')[0]);
    };

    const priorityConfig = [
        { id: 'none', color: 'rgba(255,255,255,0.2)', label: 'No Priority' },
        { id: 'low', color: 'var(--accent-warning)', label: 'Low Priority' },
        { id: 'medium', color: '#f97316', label: 'Medium Priority' },
        { id: 'high', color: 'var(--accent-danger)', label: 'High Priority' }
    ];

    return (
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
                <input
                    ref={titleInputRef}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Add a new task..."
                    style={{ flex: 1, background: 'transparent', border: 'none', padding: '8px', color: 'var(--text-primary)', fontSize: '16px' }}
                    autoFocus
                />
                <button type="submit" className="btn-primary" style={{ padding: '8px 24px', fontSize: '14px' }}>
                    Add
                </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                {/* Priority Selector - Keyboard Accessible */}
                <div role="radiogroup" aria-label="Priority" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginRight: '4px' }}>Priority:</span>
                    {priorityConfig.map(p => (
                        <button
                            key={p.id}
                            type="button"
                            role="radio"
                            aria-checked={priority === p.id}
                            aria-label={p.label}
                            onClick={() => setPriority(p.id)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setPriority(p.id);
                                }
                            }}
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                border: priority === p.id ? '3px solid white' : '2px solid transparent',
                                background: p.color,
                                cursor: 'pointer',
                                padding: 0,
                                transition: 'transform 0.2s',
                                outlineOffset: '4px'
                            }}
                            className="priority-btn"
                        />
                    ))}
                </div>

                {/* Date Controls */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button type="button" onClick={() => setDateShortcut(0)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>Today</button>
                        <button type="button" onClick={() => setDateShortcut(1)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>Tmrw</button>
                        <button type="button" onClick={setNextWeek} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>Mon</button>
                    </div>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        style={{
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--text-secondary)',
                            padding: '6px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            width: 'auto'
                        }}
                    />
                </div>
            </div>
            <style>{`
                .priority-btn:focus-visible {
                    outline: 2px solid var(--accent-primary);
                    transform: scale(1.1);
                }
                .priority-btn:hover {
                    transform: scale(1.1);
                }
            `}</style>
        </form>
    );
}
