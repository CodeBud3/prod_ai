import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAllTasks } from '../tasksSelectors';
import { parseTaskInput } from '../../../utils/nlp';

export function QuickAdd({ onAdd }) {
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState('none');
    const [dueDate, setDueDate] = useState('');
    const [dueTime, setDueTime] = useState('');
    const [assignee, setAssignee] = useState('');
    const [project, setProject] = useState('');
    const [parsedTask, setParsedTask] = useState(null);
    const [isFocused, setIsFocused] = useState(false);
    const titleInputRef = useRef(null);

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
        const { assignee: newAssignee, priority: newPriority, dueDate: newDueDate, dueTime: newDueTime, title: cleanTitle, project: newProject } = parsedTask;
        if (newAssignee) setAssignee(newAssignee);
        if (newProject) setProject(newProject);
        if (newPriority !== 'none') setPriority(newPriority);
        if (newDueDate) setDueDate(newDueDate);
        if (newDueTime) setDueTime(newDueTime);
        setTitle(cleanTitle);
        setParsedTask(null);
        titleInputRef.current?.focus();
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
            priority: finalPriority,
            dueDate: finalDueDateTime || null,
            project: finalProject.trim() || null,
            assignee: finalAssignee || null
        };

        if (followUp) {
            taskData.followUp = followUp;
        }

        onAdd(taskData);

        // Reset all
        setTitle('');
        setPriority('none');
        setDueDate('');
        setDueTime('');
        setAssignee('');
        setProject('');
        setParsedTask(null);
        titleInputRef.current?.focus();
    };

    const setDateShortcut = (days) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        setDueDate(date.toISOString().split('T')[0]);
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

    // Summary chips for current selection
    const hasSelections = priority !== 'none' || dueDate || assignee || project;

    return (
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '16px', marginBottom: '24px' }}>
            {/* Main Input Row */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: hasSelections || isFocused ? '12px' : 0 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <input
                        ref={titleInputRef}
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
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

                <button
                    type="submit"
                    className="btn-primary"
                    style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 600 }}
                >
                    Add
                </button>
            </div>

            {/* Quick Options - Always visible when focused or has selections */}
            {(isFocused || hasSelections) && (
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
                        <button type="button" onClick={() => setDateShortcut(0)} style={chipStyle(dueDate === new Date().toISOString().split('T')[0])}>Today</button>
                        <button type="button" onClick={() => setDateShortcut(1)} style={chipStyle(false)}>Tomorrow</button>
                        <button type="button" onClick={() => setDateShortcut(7)} style={chipStyle(false)}>Next Week</button>
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
                        <span style={labelStyle}>Project</span>
                        {recentProjects.map(p => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setProject(project === p ? '' : p)}
                                style={chipStyle(project === p, '#3b82f6')}
                            >
                                #{p}
                            </button>
                        ))}
                        {!recentProjects.includes(project) && project && (
                            <button type="button" style={chipStyle(true, '#3b82f6')}>
                                #{project}
                            </button>
                        )}
                        <input
                            type="text"
                            value={project}
                            onChange={(e) => setProject(e.target.value)}
                            placeholder="+ New"
                            style={{
                                background: 'transparent',
                                border: '1px dashed rgba(255,255,255,0.2)',
                                borderRadius: '16px',
                                padding: '4px 10px',
                                color: 'var(--text-secondary)',
                                fontSize: '11px',
                                width: '60px'
                            }}
                        />
                    </div>

                    {/* Assignee */}
                    <div style={sectionStyle}>
                        <span style={labelStyle}>Assign</span>
                        {recentAssignees.map(a => (
                            <button
                                key={a}
                                type="button"
                                onClick={() => setAssignee(assignee === a ? '' : a)}
                                style={chipStyle(assignee === a, '#8b5cf6')}
                            >
                                @{a}
                            </button>
                        ))}
                        {!recentAssignees.includes(assignee) && assignee && (
                            <button type="button" style={chipStyle(true, '#8b5cf6')}>
                                @{assignee}
                            </button>
                        )}
                        <input
                            type="text"
                            value={assignee}
                            onChange={(e) => setAssignee(e.target.value)}
                            placeholder="+ New"
                            style={{
                                background: 'transparent',
                                border: '1px dashed rgba(255,255,255,0.2)',
                                borderRadius: '16px',
                                padding: '4px 10px',
                                color: 'var(--text-secondary)',
                                fontSize: '11px',
                                width: '60px'
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Current Selection Summary - Shown when not focused but has selections */}
            {!isFocused && hasSelections && (
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
