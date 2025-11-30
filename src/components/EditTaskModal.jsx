import React, { useState, useEffect } from 'react';

export function EditTaskModal({ task, onSave, onCancel }) {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [priority, setPriority] = useState(task.priority || 'none');
    const [dueDate, setDueDate] = useState(task.dueDate || '');
    const [tags, setTags] = useState(task.tags || []);
    const [tagInput, setTagInput] = useState('');
    const [assignee, setAssignee] = useState(task.assignee || '');
    const [followUp, setFollowUp] = useState(task.followUp || { dueAt: null, recurring: false, frequency: 'daily', status: 'pending' });
    const [project, setProject] = useState(task.project || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...task,
            title,
            description,
            priority,
            dueDate,
            tags,
            assignee,
            followUp,
            project: project.trim() || null
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

                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>Project</label>
                            <input
                                type="text"
                                value={project}
                                onChange={e => setProject(e.target.value)}
                                placeholder="Project Name"
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

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>Tags</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                            {tags.map(tag => (
                                <span key={tag} style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    padding: '4px 10px',
                                    borderRadius: '16px',
                                    fontSize: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    #{tag}
                                    <button
                                        type="button"
                                        onClick={() => setTags(tags.filter(t => t !== tag))}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, fontSize: '14px' }}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (tagInput.trim()) {
                                                setTags([...tags, tagInput.trim()]);
                                                setTagInput('');
                                            }
                                        }
                                    }}
                                    placeholder="+ Add tag"
                                    style={{
                                        background: 'transparent',
                                        border: '1px dashed rgba(255,255,255,0.2)',
                                        borderRadius: '16px',
                                        padding: '4px 10px',
                                        fontSize: '12px',
                                        color: 'var(--text-secondary)',
                                        width: '100px'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>Assign To</label>
                            <input
                                type="text"
                                value={assignee}
                                onChange={e => setAssignee(e.target.value)}
                                placeholder="Name or Team"
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

                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>Follow Up</label>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <select
                                    onChange={(e) => {
                                        if (!e.target.value) return;
                                        const now = Date.now();
                                        let dueAt = now;
                                        if (e.target.value === '1h') dueAt += 60 * 60 * 1000;
                                        if (e.target.value === '24h') dueAt += 24 * 60 * 60 * 1000;
                                        if (e.target.value === '1w') dueAt += 7 * 24 * 60 * 60 * 1000;

                                        setFollowUp({
                                            ...followUp,
                                            dueAt,
                                            status: 'pending'
                                        });
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '12px'
                                    }}
                                >
                                    <option value="">Quick Set...</option>
                                    <option value="1h">In 1 Hour</option>
                                    <option value="24h">Tomorrow</option>
                                    <option value="1w">Next Week</option>
                                </select>
                                <input
                                    type="datetime-local"
                                    value={followUp.dueAt ? new Date(followUp.dueAt - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            setFollowUp({
                                                ...followUp,
                                                dueAt: new Date(e.target.value).getTime(),
                                                status: 'pending'
                                            });
                                        }
                                    }}
                                    style={{
                                        padding: '8px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '12px',
                                        width: '140px'
                                    }}
                                />
                            </div>

                            {followUp.dueAt && (
                                <div style={{ fontSize: '11px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>Due: {new Date(followUp.dueAt).toLocaleString()}</span>
                                    <button
                                        type="button"
                                        onClick={() => setFollowUp({ ...followUp, dueAt: null })}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                    >
                                        Clear
                                    </button>
                                </div>
                            )}

                            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="checkbox"
                                    checked={followUp.recurring}
                                    onChange={e => setFollowUp({ ...followUp, recurring: e.target.checked })}
                                    id="recurring"
                                />
                                <label htmlFor="recurring" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Recurring?</label>
                            </div>
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
