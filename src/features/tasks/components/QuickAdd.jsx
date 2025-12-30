import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAllTasks } from '../tasksSelectors';
import { TASK_CATEGORIES } from '../tasksSlice';
import { parseTaskInput } from '../../../utils/nlp';
import { useOnClickOutside } from '../../../hooks/useOnClickOutside';
import UseAnimations from 'react-useanimations';
import plusToX from 'react-useanimations/lib/plusToX';

export function QuickAdd({ onAdd }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('none');
    const [dueDate, setDueDate] = useState('');
    const [dueTime, setDueTime] = useState('');
    const [assignee, setAssignee] = useState('');
    const [project, setProject] = useState('');
    const [category, setCategory] = useState('general');
    const [parsedTask, setParsedTask] = useState(null);
    const [isOpen, setIsOpen] = useState(false);

    // Refs
    const titleInputRef = useRef(null);
    const formRef = useRef(null);

    // Close panel when clicking outside
    useOnClickOutside(formRef, (e) => {
        // Ignore clicks on elements that have been removed from the DOM (e.g., suggestions)
        if (e.target && !e.target.isConnected) return;

        if (isOpen) setIsOpen(false);
    });

    // Get existing projects and assignees from tasks for quick suggestions
    const tasks = useSelector(selectAllTasks);
    const recentProjects = [...new Set(tasks.map(t => t.project).filter(Boolean))].slice(0, 5);
    const recentAssignees = [...new Set(tasks.map(t => t.assignee).filter(Boolean))].slice(0, 5);

    const handleTitleChange = (e) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        const result = parseTaskInput(newTitle);
        setParsedTask(result);
    };

    const applySuggestion = () => {
        if (!parsedTask) return;
        const { assignee: newAssignee, priority: newPriority, dueDate: newDueDate, dueTime: newDueTime, title: cleanTitle, project: newProject, category: newCategory } = parsedTask;
        if (newAssignee) setAssignee(newAssignee);
        if (newProject) setProject(newProject);
        if (newCategory) setCategory(newCategory);
        if (newPriority !== 'none') setPriority(newPriority);
        if (newDueDate) setDueDate(newDueDate);
        if (newDueTime) setDueTime(newDueTime);
        setTitle(cleanTitle);
        setParsedTask(null);
        titleInputRef.current?.focus();
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setPriority('none');
        setDueDate('');
        setDueTime('');
        setAssignee('');
        setProject('');
        setCategory('general');
        setParsedTask(null);
        setIsOpen(false);
    };

    const handleSubmit = (e) => {
        e?.preventDefault();
        if (!title.trim()) return;

        let finalDueDate = dueDate;
        let finalDueTime = dueTime;
        let finalTitle = title;
        let finalPriority = priority;
        let finalAssignee = assignee;
        let finalProject = project;
        let finalCategory = category;

        if (parsedTask) {
            const { assignee: pAssignee, priority: pPriority, dueDate: pDueDate, dueTime: pDueTime, title: pTitle, project: pProject } = parsedTask;
            if (pAssignee) finalAssignee = pAssignee;
            if (pProject) finalProject = pProject;
            if (pPriority !== 'none') finalPriority = pPriority;
            if (pDueDate) finalDueDate = pDueDate;
            if (pDueTime) finalDueTime = pDueTime;
            finalTitle = pTitle;
        }

        let finalDueDateTime = finalDueDate;
        if (finalDueDate && finalDueTime) {
            finalDueDateTime = `${finalDueDate}T${finalDueTime}`;
        }

        // Calculate follow-up from duration if present (e.g., ~1h = 1 hour follow-up)
        let followUp = null;
        if (parsedTask?.duration && finalAssignee) {
            const durationStr = parsedTask.duration;
            const match = durationStr.match(/(\d+(?:\.\d+)?)(h|m|d)/i);
            if (match) {
                const value = parseFloat(match[1]);
                const unit = match[2].toLowerCase();
                let minutes = 0;
                if (unit === 'h') minutes = value * 60;
                else if (unit === 'm') minutes = value;
                else if (unit === 'd') minutes = value * 24 * 60;

                followUp = {
                    dueAt: Date.now() + minutes * 60 * 1000,
                    startedAt: Date.now(),
                    status: 'pending'
                };
            }
        }

        const taskData = {
            title: finalTitle,
            description: description.trim() || null,
            priority: finalPriority,
            dueDate: finalDueDateTime || null,
            project: finalProject.trim() || null,
            assignee: finalAssignee || null,
            category: finalCategory
        };

        if (followUp) {
            taskData.followUp = followUp;
        }

        onAdd(taskData);
        resetForm();
    };

    const setDateShortcut = (days) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        // Use local date string (YYYY-MM-DD) to avoid UTC off-by-one errors
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        setDueDate(`${year}-${month}-${day}`);
    };

    const getFutureDate = (days) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const priorityConfig = [
        { id: 'low', color: '#22c55e', emoji: '🦥', label: 'Low' },
        { id: 'medium', color: '#eab308', emoji: '⚡', label: 'Med' },
        { id: 'high', color: '#f97316', emoji: '🔥', label: 'High' },
        { id: 'critical', color: '#ef4444', emoji: '💀', label: 'Crit' }
    ];

    const timePresets = [
        { label: '9AM', value: '09:00' },
        { label: '12PM', value: '12:00' },
        { label: '5PM', value: '17:00' },
        { label: '9PM', value: '21:00' }
    ];

    const chipStyle = (isActive, color = 'var(--accent-primary)') => ({
        padding: '4px 10px',
        borderRadius: '16px',
        fontSize: '11px',
        fontWeight: 500,
        cursor: 'pointer',
        border: 'none',
        transition: 'all 0.15s ease',
        background: isActive ? color : 'rgba(255,255,255,0.08)',
        color: isActive ? 'white' : 'var(--text-secondary)',
        boxShadow: isActive ? `0 2px 8px ${color}40` : 'none'
    });

    const sectionStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flexWrap: 'wrap'
    };

    const labelStyle = {
        fontSize: '10px',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginRight: '4px'
    };

    const hasSelections = priority !== 'none' || dueDate || assignee || project || category !== 'general' || description;
    const hasInput = title.trim() || hasSelections;

    return (
        <form ref={formRef} onSubmit={handleSubmit} className="glass-panel" style={{ padding: '16px', marginBottom: '24px' }}>
            {/* Main Input Row */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: isOpen ? '12px' : 0 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <input
                        ref={titleInputRef}
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        onFocus={() => setIsOpen(true)}
                        onKeyDown={(e) => {
                            if (e.key === 'Tab' && parsedTask) {
                                e.preventDefault();
                                applySuggestion();
                            }
                        }}
                        placeholder="Add task... (e.g. 'Call John @john #MARS tomorrow 5pm !critical ~1h')"
                        style={{
                            width: '100%',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            color: 'var(--text-primary)',
                            fontSize: '15px'
                        }}
                    />

                    {/* NLP Suggestion Popup */}
                    {parsedTask && (parsedTask.dueDate || parsedTask.assignee || parsedTask.project || parsedTask.priority !== 'none') && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '4px',
                            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '12px',
                            color: 'white',
                            zIndex: 100,
                            boxShadow: '0 4px 20px rgba(79, 70, 229, 0.4)'
                        }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <span style={{ opacity: 0.8 }}>✨ Detected:</span>
                                {parsedTask.dueDate && <span>📅 {parsedTask.dueDate} {parsedTask.dueTime || ''}</span>}
                                {parsedTask.assignee && <span>👤 {parsedTask.assignee}</span>}
                                {parsedTask.category && <span>{TASK_CATEGORIES[parsedTask.category]?.icon || '🏷️'} {TASK_CATEGORIES[parsedTask.category]?.label || parsedTask.category}</span>}
                                {parsedTask.project && <span>📁 {parsedTask.project}</span>}
                                {parsedTask.priority !== 'none' && <span>🔥 {parsedTask.priority}</span>}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ opacity: 0.6, fontSize: '10px' }}>Tab to apply</span>
                                <button
                                    type="button"
                                    onClick={applySuggestion}
                                    style={{
                                        background: 'rgba(255,255,255,0.2)',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '11px'
                                    }}
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Discard Button (Only visible when has input) */}
                {hasInput && (
                    <button
                        type="button"
                        onClick={resetForm}
                        style={{
                            padding: '12px',
                            color: 'rgba(255,255,255,0.4)',
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="Discard (Clear all)"
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#ef4444'; // Red on hover
                            e.currentTarget.style.borderColor = '#ef4444';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                    </button>
                )}

                <button
                    type="submit"
                    className="btn-primary"
                    style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 600 }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UseAnimations animation={plusToX} size={20} strokeColor="white" />
                        <span>Add</span>
                    </div>
                </button>
            </div>

            {/* Quick Options - Visible when open */}
            {isOpen && (
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    animation: 'fadeIn 0.15s ease'
                }}>
                    {/* Priority */}
                    <div style={sectionStyle}>
                        <span style={labelStyle}>Priority</span>
                        {priorityConfig.map(p => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => setPriority(priority === p.id ? 'none' : p.id)}
                                style={chipStyle(priority === p.id, p.color)}
                            >
                                {p.emoji} {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Date */}
                    <div style={sectionStyle}>
                        <span style={labelStyle}>Due</span>
                        <button type="button" onClick={() => setDateShortcut(0)} style={chipStyle(dueDate === getFutureDate(0))}>Today</button>
                        <button type="button" onClick={() => setDateShortcut(1)} style={chipStyle(dueDate === getFutureDate(1))}>Tomorrow</button>
                        <button type="button" onClick={() => setDateShortcut(7)} style={chipStyle(dueDate === getFutureDate(7))}>Next Week</button>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            style={{
                                background: 'rgba(255,255,255,0.08)',
                                border: 'none',
                                borderRadius: '16px',
                                padding: '4px 10px',
                                color: 'var(--text-secondary)',
                                fontSize: '11px',
                                cursor: 'pointer'
                            }}
                        />
                    </div>

                    {/* Time */}
                    {dueDate && (
                        <div style={sectionStyle}>
                            <span style={labelStyle}>Time</span>
                            {timePresets.map(t => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setDueTime(dueTime === t.value ? '' : t.value)}
                                    style={chipStyle(dueTime === t.value)}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Project */}
                    <div style={sectionStyle}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={labelStyle}>Project</span>
                            {project && (
                                <button
                                    type="button"
                                    onClick={() => setProject('')}
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        fontSize: '10px',
                                        padding: '0 4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        opacity: 0.7,
                                        transition: 'opacity 0.2s'
                                    }}
                                    title="Clear project"
                                    onMouseEnter={(e) => e.target.style.opacity = '1'}
                                    onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        {recentProjects.filter(p => p !== project).map(p => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setProject(p)}
                                style={chipStyle(false, '#3b82f6')}
                            >
                                #{p}
                            </button>
                        ))}
                        {/* Editable project input styled as tag when has value */}
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            background: project ? '#3b82f6' : 'transparent',
                            border: project ? 'none' : '1px dashed rgba(255,255,255,0.2)',
                            borderRadius: '16px',
                            padding: '4px 10px',
                            minWidth: project ? 'auto' : '60px'
                        }}>
                            {project && <span style={{ color: 'white', fontSize: '11px', marginRight: '2px' }}>#</span>}
                            <input
                                type="text"
                                value={project}
                                onChange={(e) => setProject(e.target.value)}
                                placeholder="+ New"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: project ? 'white' : 'var(--text-secondary)',
                                    fontSize: '11px',
                                    fontWeight: project ? 500 : 400,
                                    width: project ? `${Math.max(40, project.length * 8)}px` : '50px',
                                    minWidth: '40px',
                                    maxWidth: '200px'
                                }}
                            />
                        </div>
                    </div>

                    {/* Category */}
                    <div style={sectionStyle}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={labelStyle}>Bucket</span>
                            {category !== 'general' && (
                                <button
                                    type="button"
                                    onClick={() => setCategory('general')}
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        fontSize: '10px',
                                        padding: '0 4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        opacity: 0.7,
                                        transition: 'opacity 0.2s'
                                    }}
                                    title="Clear category"
                                    onMouseEnter={(e) => e.target.style.opacity = '1'}
                                    onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        {Object.values(TASK_CATEGORIES).map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setCategory(category === cat.id ? 'general' : cat.id)}
                                style={chipStyle(category === cat.id, cat.color)}
                            >
                                {cat.icon} {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Description - Always Visible */}
                    <div style={{ ...sectionStyle, width: '100%', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span style={labelStyle}>📝 Description</span>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add more details about this task..."
                            rows={2}
                            style={{
                                width: '100%',
                                marginTop: '4px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                padding: '10px 12px',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                resize: 'vertical',
                                minHeight: '50px'
                            }}
                        />
                    </div>

                    {/* Assignee */}
                    <div style={sectionStyle}>
                        <span style={labelStyle}>Assign</span>
                        {recentAssignees.filter(a => a !== assignee).map(a => (
                            <button
                                key={a}
                                type="button"
                                onClick={() => setAssignee(a)}
                                style={chipStyle(false, '#8b5cf6')}
                            >
                                @{a}
                            </button>
                        ))}
                        {/* Editable assignee input styled as tag when has value */}
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            background: assignee ? '#8b5cf6' : 'transparent',
                            border: assignee ? 'none' : '1px dashed rgba(255,255,255,0.2)',
                            borderRadius: '16px',
                            padding: '4px 10px',
                            minWidth: assignee ? 'auto' : '60px'
                        }}>
                            {assignee && <span style={{ color: 'white', fontSize: '11px', marginRight: '2px' }}>@</span>}
                            <input
                                type="text"
                                value={assignee}
                                onChange={(e) => setAssignee(e.target.value)}
                                placeholder="+ New"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: assignee ? 'white' : 'var(--text-secondary)',
                                    fontSize: '11px',
                                    fontWeight: assignee ? 500 : 400,
                                    width: assignee ? `${Math.max(40, assignee.length * 8)}px` : '50px',
                                    minWidth: '40px',
                                    maxWidth: '200px'
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Current Selection Summary - Shown when closed but has selections */}
            {!isOpen && hasSelections && (
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    marginTop: '8px'
                }}>
                    {priority !== 'none' && (
                        <span
                            onClick={() => setPriority('none')}
                            style={{
                                ...chipStyle(true, priorityConfig.find(p => p.id === priority)?.color),
                                cursor: 'pointer'
                            }}
                        >
                            {priorityConfig.find(p => p.id === priority)?.emoji} {priority} ×
                        </span>
                    )}
                    {dueDate && (
                        <span
                            onClick={() => { setDueDate(''); setDueTime(''); }}
                            style={{ ...chipStyle(true), cursor: 'pointer' }}
                        >
                            📅 {dueDate} {dueTime && `@ ${dueTime}`} ×
                        </span>
                    )}
                    {project && (
                        <span
                            onClick={() => setProject('')}
                            style={{ ...chipStyle(true, '#3b82f6'), cursor: 'pointer' }}
                        >
                            #{project} ×
                        </span>
                    )}
                    {assignee && (
                        <span
                            onClick={() => setAssignee('')}
                            style={{ ...chipStyle(true, '#8b5cf6'), cursor: 'pointer' }}
                        >
                            @{assignee} ×
                        </span>
                    )}
                    {category !== 'general' && (
                        <span
                            onClick={() => setCategory('general')}
                            style={{ ...chipStyle(true, TASK_CATEGORIES[category]?.color), cursor: 'pointer' }}
                        >
                            {TASK_CATEGORIES[category]?.icon} {TASK_CATEGORIES[category]?.label} ×
                        </span>
                    )}
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </form>
    );
}
