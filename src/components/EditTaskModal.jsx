import React, { useState, useEffect } from 'react';

export function EditTaskModal({ task, onSave, onCancel }) {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [priority, setPriority] = useState(task.priority || 'none');
    const [dueDate, setDueDate] = useState(task.dueDate || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...task,
            title,
            description,
            priority,
            dueDate
        });
    };

    const priorityConfig = [
        { id: 'none', color: 'rgba(255,255,255,0.2)', label: 'No Priority' },
        { id: 'low', color: 'var(--accent-warning)', label: 'Low Priority' },
        { id: 'medium', color: '#f97316', label: 'Medium Priority' },
        { id: 'high', color: 'var(--accent-danger)', label: 'High Priority' }
    ];

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }} onClick={onCancel}>
            <div
                className="glass-panel"
                style={{ width: '500px', maxWidth: '90%', padding: '32px' }}
                onClick={e => e.stopPropagation()}
            >
                <h2 style={{ marginBottom: '24px' }}>Edit Task</h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="glass-input"
                            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>Description</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            style={{
                                width: '100%',
                                minHeight: '100px',
                                padding: '12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: 'white',
                                fontFamily: 'inherit',
                                resize: 'vertical'
                            }}
                            placeholder="Add details..."
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>Priority</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {priorityConfig.map(p => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => setPriority(p.id)}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            border: priority === p.id ? '3px solid white' : '2px solid transparent',
                                            background: p.color,
                                            cursor: 'pointer',
                                            padding: 0,
                                            transition: 'transform 0.2s'
                                        }}
                                        title={p.label}
                                    />
                                ))}
                            </div>
                        </div>

                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>Due Date</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: 'white'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
