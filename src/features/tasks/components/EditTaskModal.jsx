import React, { useState, useEffect } from 'react';
import { FunnyTooltip, DateTimePicker, RecurrenceSelector } from '../../../components/ui';

const formatToDatetimeLocal = (timestamp) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export function EditTaskModal({ task, onSave, onCancel }) {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [priority, setPriority] = useState(task.priority || 'none');
    // Ensure dueDate is in datetime-local format (YYYY-MM-DDTHH:mm)
    const [dueDate, setDueDate] = useState(() => {
        if (!task.dueDate) return '';
        // Check if it's already in the right format (YYYY-MM-DDTHH:mm)
        if (typeof task.dueDate === 'string' && task.dueDate.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
            return task.dueDate;
        }
        const d = new Date(task.dueDate);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    });
    const [tags, setTags] = useState(task.tags || []);
    const [tagInput, setTagInput] = useState('');
    const [assignee, setAssignee] = useState(task.assignee || '');
    const [followUp, setFollowUp] = useState(task.followUp || { dueAt: null, recurring: false, frequency: 'daily', status: 'pending' });
    const [project, setProject] = useState(task.project || '');

    // New Remind Before State
    const [remindBefore, setRemindBefore] = useState(task.remindBefore || null); // { value: 15, unit: 'minutes' }

    // Recurrence State
    const [recurrence, setRecurrence] = useState(task.recurrence || {
        enabled: false,
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [new Date().getDay()],
        dayOfMonth: new Date().getDate(),
        endType: 'never',
        endDate: null,
        endCount: 10
    });

    const textareaRef = React.useRef(null);

    // Auto-resize description textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [description]);

    // Prevent background scrolling when modal is open
    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, []);

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
            remindAt,
            recurrence
        });
    };

    const priorityConfig = [
        { id: 'low', color: 'rgba(255,255,255,0.2)', label: '🦥 Meh... Do it whenever. Netflix first.' },
        { id: 'medium', color: 'var(--accent-warning)', label: '⚡ Should probably do this... eventually.' },
        { id: 'high', color: '#f97316', label: '🔥 Boss is asking. Pretend to be busy!' },
        { id: 'critical', color: 'var(--accent-danger)', label: '💀 DROP EVERYTHING. Code red. Panic mode!' }
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
        }}>
            <div
                className="glass-panel"
                style={{
                    width: '1000px',
                    maxWidth: '95%',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '32px'
                }}
                onClick={e => e.stopPropagation()}
            >
                <h2 style={{ marginBottom: '20px', flexShrink: 0 }}>Edit Task</h2>

                <form onSubmit={handleSubmit} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    flex: 1,
                    overflow: 'hidden'
                }}>
                    {/* Title - Full Width */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="glass-input"
                            style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '15px' }}
                            autoFocus
                        />
                    </div>

                    {/* 2-Column Grid Layout */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '20px',
                        flex: 1,
                        minHeight: 0
                    }}>
                        {/* LEFT COLUMN */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>
                            {/* Description */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>Description</label>
                                <textarea
                                    ref={textareaRef}
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    style={{
                                        flex: 1,
                                        minHeight: '80px',
                                        padding: '10px 12px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontFamily: 'inherit',
                                        resize: 'none',
                                        fontSize: '13px'
                                    }}
                                    placeholder="Add details..."
                                />
                            </div>

                            {/* Priority & Project */}
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>Priority</label>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {priorityConfig.map(p => (
                                            <FunnyTooltip key={p.id} context="priority" content={p.label}>
                                                <button
                                                    type="button"
                                                    onClick={() => setPriority(p.id)}
                                                    style={{
                                                        width: '28px',
                                                        height: '28px',
                                                        borderRadius: '50%',
                                                        border: priority === p.id ? '3px solid white' : '2px solid transparent',
                                                        background: p.color,
                                                        cursor: 'pointer',
                                                        padding: 0
                                                    }}
                                                />
                                            </FunnyTooltip>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>Project</label>
                                    <input
                                        type="text"
                                        value={project}
                                        onChange={e => setProject(e.target.value)}
                                        placeholder="#Project"
                                        style={{
                                            width: '100%',
                                            padding: '6px 10px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '6px',
                                            color: 'white',
                                            fontSize: '13px'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Assignee & Tags */}
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>Assign To</label>
                                    <input
                                        type="text"
                                        value={assignee}
                                        onChange={e => setAssignee(e.target.value)}
                                        placeholder="@name"
                                        style={{
                                            width: '100%',
                                            padding: '6px 10px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '6px',
                                            color: 'white',
                                            fontSize: '13px'
                                        }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>Tags</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                                        {tags.slice(0, 2).map(tag => (
                                            <span key={tag} style={{
                                                background: 'rgba(255,255,255,0.1)',
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                fontSize: '11px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                #{tag}
                                                <button
                                                    type="button"
                                                    onClick={() => setTags(tags.filter(t => t !== tag))}
                                                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, fontSize: '12px' }}
                                                >×</button>
                                            </span>
                                        ))}
                                        {tags.length > 2 && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>+{tags.length - 2}</span>}
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
                                            placeholder="+tag"
                                            style={{
                                                background: 'transparent',
                                                border: '1px dashed rgba(255,255,255,0.2)',
                                                borderRadius: '12px',
                                                padding: '2px 8px',
                                                fontSize: '11px',
                                                color: 'var(--text-secondary)',
                                                width: '50px'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0, overflowY: 'auto' }}>
                            {/* Deadline */}
                            <DateTimePicker
                                label="Deadline"
                                value={dueDate ? new Date(dueDate).getTime() : null}
                                onChange={(timestamp) => setDueDate(formatToDatetimeLocal(timestamp))}
                                onClear={() => setDueDate('')}
                                defaultExpanded={true}
                            />

                            {/* Remind Before */}
                            {dueDate && (
                                <div style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '8px',
                                    padding: '10px 12px',
                                    border: '1px solid rgba(255,255,255,0.08)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>🔔 Remind Before</span>
                                        {remindBefore && (
                                            <button type="button" onClick={() => setRemindBefore(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '10px', cursor: 'pointer' }}>Clear</button>
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
                                                        padding: '4px 8px',
                                                        fontSize: '11px',
                                                        color: 'var(--text-secondary)',
                                                        cursor: 'pointer'
                                                    }}
                                                >{opt.label}</button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '12px', color: 'var(--accent-primary)' }}>
                                            ✓ {remindBefore.value} {remindBefore.unit} before
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Recurrence */}
                            <RecurrenceSelector
                                value={recurrence}
                                onChange={setRecurrence}
                                defaultExpanded={true}
                            />

                            {/* Follow Up - only if assignee */}
                            {assignee && (
                                <DateTimePicker
                                    label="Follow Up"
                                    value={followUp?.dueAt}
                                    onChange={(timestamp) => setFollowUp({ ...followUp, dueAt: timestamp, status: 'pending' })}
                                    onClear={() => setFollowUp({ ...followUp, dueAt: null })}
                                />
                            )}
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
                        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
