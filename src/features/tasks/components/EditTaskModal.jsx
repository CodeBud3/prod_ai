import React, { useState, useEffect } from 'react';
import { FunnyTooltip } from '../../../components/ui';

export function EditTaskModal({ task, onSave, onCancel }) {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [priority, setPriority] = useState(task.priority || 'none');
    // Ensure dueDate is in datetime-local format (YYYY-MM-DDTHH:mm)
    const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '');
    const [tags, setTags] = useState(task.tags || []);
    const [tagInput, setTagInput] = useState('');
    const [assignee, setAssignee] = useState(task.assignee || '');
    const [followUp, setFollowUp] = useState(task.followUp || { dueAt: null, recurring: false, frequency: 'daily', status: 'pending' });
    const [project, setProject] = useState(task.project || '');

    // New Remind Before State
    const [remindBefore, setRemindBefore] = useState(task.remindBefore || null); // { value: 15, unit: 'minutes' }

    const handleSubmit = (e) => {
        e.preventDefault();

        // Calculate remindAt if remindBefore and dueDate are set
        let remindAt = task.remindAt;
        if (dueDate && remindBefore) {
            const dueTime = new Date(dueDate).getTime();
            let offset = 0;
            if (remindBefore.unit === 'minutes') offset = remindBefore.value * 60 * 1000;
            if (remindBefore.unit === 'hours') offset = remindBefore.value * 60 * 60 * 1000;
            if (remindBefore.unit === 'days') offset = remindBefore.value * 24 * 60 * 60 * 1000;
            if (remindBefore.unit === 'weeks') offset = remindBefore.value * 7 * 24 * 60 * 60 * 1000;

            remindAt = dueTime - offset;
        } else if (!remindBefore) {
            remindAt = null;
        }

        onSave({
            ...task,
            title,
            description,
            priority,
            dueDate: dueDate || null, // Store as ISO string or null
            tags,
            assignee,
            followUp,
            project: project.trim() || null,
            remindBefore,
            remindAt
        });
    };

    const priorityConfig = [
        { id: 'low', color: 'rgba(255,255,255,0.2)', label: 'Low Priority' },
        { id: 'medium', color: 'var(--accent-warning)', label: 'Medium Priority' },
        { id: 'high', color: '#f97316', label: 'High Priority' },
        { id: 'critical', color: 'var(--accent-danger)', label: 'Critical Priority' }
    ];

    const reminderOptions = [
        { label: '15m', value: 15, unit: 'minutes' },
        { label: '1h', value: 1, unit: 'hours' },
        { label: '1d', value: 1, unit: 'days' },
        { label: '2d', value: 2, unit: 'days' },
        { label: '1w', value: 1, unit: 'weeks' }
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
                                    <FunnyTooltip key={p.id} context="priority" content={p.label}>
                                        <button
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
                                            aria-label={p.label}
                                        />
                                    </FunnyTooltip>
                                ))}
                            </div>
                        </div>

                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>Deadline</label>
                            <input
                                type="datetime-local"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '12px'
                                }}
                            />

                            {/* Remind Before Options */}
                            {dueDate && (
                                <div style={{ marginTop: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Remind me before:</span>
                                        {remindBefore && (
                                            <button
                                                type="button"
                                                onClick={() => setRemindBefore(null)}
                                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '10px', cursor: 'pointer' }}
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>

                                    {!remindBefore ? (
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {reminderOptions.map(opt => (
                                                <button
                                                    key={opt.label}
                                                    type="button"
                                                    onClick={() => setRemindBefore({ value: opt.value, unit: opt.unit })}
                                                    style={{
                                                        background: 'rgba(255,255,255,0.1)',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        padding: '2px 6px',
                                                        fontSize: '10px',
                                                        color: 'var(--text-secondary)',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{
                                            fontSize: '11px',
                                            color: 'var(--accent-primary)',
                                            background: 'rgba(59, 130, 246, 0.1)',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            display: 'inline-block'
                                        }}>
                                            🔔 {remindBefore.value} {remindBefore.unit} before
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '20px' }}>
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

                            {/* Follow Up Section - Only show if assignee is present */}
                            {assignee && (
                                <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                                            🔔 Follow Up
                                        </label>
                                        {followUp?.dueAt && (
                                            <button
                                                type="button"
                                                onClick={() => setFollowUp({ ...followUp, dueAt: null })}
                                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '10px', cursor: 'pointer' }}
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                        {[
                                            { label: '15m', val: 15 * 60 * 1000 },
                                            { label: '1h', val: 60 * 60 * 1000 },
                                            { label: '3h', val: 3 * 60 * 60 * 1000 },
                                            { label: '1d', val: 24 * 60 * 60 * 1000 },
                                            { label: '1w', val: 7 * 24 * 60 * 60 * 1000 }
                                        ].map(opt => (
                                            <button
                                                key={opt.label}
                                                type="button"
                                                onClick={() => setFollowUp({ ...followUp, dueAt: Date.now() + opt.val, status: 'pending' })}
                                                style={{
                                                    background: 'rgba(255,255,255,0.1)',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    padding: '4px 8px',
                                                    fontSize: '11px',
                                                    color: 'var(--text-secondary)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.2)'}
                                                onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>

                                    <input
                                        type="datetime-local"
                                        value={followUp?.dueAt ? new Date(followUp.dueAt).toISOString().slice(0, 16) : ''}
                                        onChange={e => setFollowUp({ ...followUp, dueAt: new Date(e.target.value).getTime(), status: 'pending' })}
                                        style={{
                                            width: '100%',
                                            padding: '6px',
                                            background: 'rgba(0,0,0,0.2)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '4px',
                                            color: 'var(--text-secondary)',
                                            fontSize: '11px'
                                        }}
                                    />
                                    {followUp?.dueAt && (
                                        <div style={{ fontSize: '10px', color: 'var(--accent-primary)', marginTop: '4px', textAlign: 'right' }}>
                                            Due: {new Date(followUp.dueAt).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            )}
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

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
