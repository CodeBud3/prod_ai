import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateStagedTask, removeStagedTask } from '../brainDumpSlice';
import { TASK_CATEGORIES } from '../../tasks/tasksSlice';

const priorityConfig = [
    { id: 'none', color: '#64748b', emoji: '➖', label: 'None' },
    { id: 'low', color: '#22c55e', emoji: '🦥', label: 'Low' },
    { id: 'medium', color: '#eab308', emoji: '⚡', label: 'Medium' },
    { id: 'high', color: '#f97316', emoji: '🔥', label: 'High' },
    { id: 'critical', color: '#ef4444', emoji: '💀', label: 'Critical' }
];

export function StagedTaskCard({ task }) {
    const dispatch = useDispatch();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);

    const priorityInfo = priorityConfig.find(p => p.id === task.priority) || priorityConfig[0];
    const categoryInfo = TASK_CATEGORIES[task.category] || { icon: '📋', label: task.category };

    const handleUpdate = (updates) => {
        dispatch(updateStagedTask({ id: task.id, updates }));
    };

    const handleRemove = () => {
        dispatch(removeStagedTask(task.id));
    };

    const handleTitleSave = () => {
        if (editTitle.trim()) {
            handleUpdate({ title: editTitle.trim() });
        }
        setIsEditing(false);
    };

    const chipStyle = (isActive, color) => ({
        padding: '4px 10px',
        borderRadius: '16px',
        fontSize: '11px',
        fontWeight: 500,
        cursor: 'pointer',
        border: 'none',
        transition: 'all 0.15s ease',
        background: isActive ? color : 'rgba(255,255,255,0.08)',
        color: isActive ? 'white' : 'var(--text-secondary)'
    });

    return (
        <div
            className="glass-panel"
            style={{
                padding: '16px',
                borderRadius: '12px',
                borderLeft: `4px solid ${priorityInfo.color}`
            }}
        >
            {/* Main Row */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: isExpanded ? '12px' : 0
            }}>
                {/* Priority Indicator */}
                <span style={{ fontSize: '18px' }}>{priorityInfo.emoji}</span>

                {/* Title */}
                <div style={{ flex: 1 }}>
                    {isEditing ? (
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                            autoFocus
                            style={{
                                width: '100%',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid var(--accent-primary)',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                color: 'var(--text-primary)',
                                fontSize: '15px'
                            }}
                        />
                    ) : (
                        <div
                            onClick={() => setIsEditing(true)}
                            style={{
                                fontSize: '15px',
                                fontWeight: 500,
                                cursor: 'text',
                                padding: '4px 0'
                            }}
                        >
                            {task.title}
                        </div>
                    )}

                    {/* Metadata chips */}
                    {!isExpanded && (
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            marginTop: '6px',
                            flexWrap: 'wrap'
                        }}>
                            {task.dueDate && (
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    📅 {task.dueDate}
                                </span>
                            )}
                            {task.assignee && (
                                <span style={{ fontSize: '12px', color: '#8b5cf6' }}>
                                    @{task.assignee}
                                </span>
                            )}
                            {task.project && (
                                <span style={{ fontSize: '12px', color: '#3b82f6' }}>
                                    #{task.project}
                                </span>
                            )}
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                {categoryInfo.icon} {categoryInfo.label}
                            </span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        style={{
                            width: '32px',
                            height: '32px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                        title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                        {isExpanded ? '▲' : '▼'}
                    </button>
                    <button
                        onClick={handleRemove}
                        style={{
                            width: '32px',
                            height: '32px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                        title="Remove"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            {/* Expanded Edit Panel */}
            {isExpanded && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    {/* Priority */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '60px' }}>Priority</span>
                        {priorityConfig.map(p => (
                            <button
                                key={p.id}
                                onClick={() => handleUpdate({ priority: p.id })}
                                style={chipStyle(task.priority === p.id, p.color)}
                            >
                                {p.emoji} {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Category */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '60px' }}>Category</span>
                        {Object.values(TASK_CATEGORIES).map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => handleUpdate({ category: cat.id })}
                                style={chipStyle(task.category === cat.id, cat.color)}
                            >
                                {cat.icon} {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Due Date */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '60px' }}>Due Date</span>
                        <input
                            type="date"
                            value={task.dueDate?.split('T')[0] || ''}
                            onChange={(e) => handleUpdate({ dueDate: e.target.value || null })}
                            style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                color: 'var(--text-secondary)',
                                fontSize: '13px'
                            }}
                        />
                        {task.dueDate && (
                            <button
                                onClick={() => handleUpdate({ dueDate: null })}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                ✕ Clear
                            </button>
                        )}
                    </div>

                    {/* Assignee */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '60px' }}>Assignee</span>
                        <input
                            type="text"
                            value={task.assignee || ''}
                            onChange={(e) => handleUpdate({ assignee: e.target.value || null })}
                            placeholder="@name"
                            style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                color: 'var(--text-secondary)',
                                fontSize: '13px',
                                width: '150px'
                            }}
                        />
                    </div>

                    {/* Project */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '60px' }}>Project</span>
                        <input
                            type="text"
                            value={task.project || ''}
                            onChange={(e) => handleUpdate({ project: e.target.value || null })}
                            placeholder="#project"
                            style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                color: 'var(--text-secondary)',
                                fontSize: '13px',
                                width: '150px'
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
