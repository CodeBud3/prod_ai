import React, { useState, useRef, useEffect } from 'react';
import { FunnyTooltip } from '../../../components/ui';
import { parseTaskInput } from '../../../utils/nlp';

export function QuickAdd({ onAdd }) {
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState('none'); // none, low, medium, high
    const [dueDate, setDueDate] = useState('');
    const [dueTime, setDueTime] = useState('');
    const [assignee, setAssignee] = useState('');
    const [tags, setTags] = useState([]);
    const [showTagInput, setShowTagInput] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [project, setProject] = useState('');
    const [parsedTask, setParsedTask] = useState(null);
    const titleInputRef = useRef(null);

    const handleTitleChange = (e) => {
        const newTitle = e.target.value;
        setTitle(newTitle);

        // Parse input using NLP
        const result = parseTaskInput(newTitle);
        setParsedTask(result);
    };

    const applySuggestion = () => {
        if (!parsedTask) return;

        const { assignee: newAssignee, priority: newPriority, dueDate: newDueDate, dueTime: newDueTime, title: cleanTitle } = parsedTask;

        if (newAssignee) setAssignee(newAssignee);
        if (newPriority !== 'none') setPriority(newPriority);
        if (newDueDate) setDueDate(newDueDate);
        if (newDueTime) setDueTime(newDueTime);

        setTitle(cleanTitle);
        setParsedTask(null);
        titleInputRef.current?.focus();
    };

    const dismissSuggestion = () => {
        setParsedTask(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        let finalDueDate = dueDate;
        let finalDueTime = dueTime;
        let finalTitle = title;
        let finalPriority = priority;
        let finalAssignee = assignee;

        // Handle auto-application of suggestion on submit (if user didn't press Tab)
        if (parsedTask) {
            const { assignee: pAssignee, priority: pPriority, dueDate: pDueDate, dueTime: pDueTime, title: pTitle } = parsedTask;

            if (pAssignee) finalAssignee = pAssignee;
            if (pPriority !== 'none') finalPriority = pPriority;
            if (pDueDate) finalDueDate = pDueDate;
            if (pDueTime) finalDueTime = pDueTime;

            finalTitle = pTitle;
        }

        // Construct final due date string
        let finalDueDateTime = finalDueDate;
        if (finalDueDate && finalDueTime) {
            finalDueDateTime = `${finalDueDate}T${finalDueTime}`;
        }

        onAdd({
            title: finalTitle,
            priority: finalPriority,
            dueDate: finalDueDateTime || null,
            tags,
            project: project.trim() || null,
            assignee: finalAssignee || null
        });

        // Reset
        setTitle('');
        setPriority('none');
        setDueDate('');
        setDueTime('');
        setAssignee('');
        setTags([]);
        setProject('');
        setShowTagInput(false);
        setTagInput('');
        setParsedTask(null);
        titleInputRef.current?.focus();
    };

    const setDateShortcut = (days) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        setDueDate(date.toISOString().split('T')[0]);
        setDueTime('17:00'); // Default to 5 PM
    };

    const setNextWeek = () => {
        const date = new Date();
        date.setDate(date.getDate() + (8 - date.getDay())); // Next Monday
        setDueDate(date.toISOString().split('T')[0]);
        setDueTime('17:00'); // Default to 5 PM
    };

    const priorityConfig = [
        { id: 'low', color: 'rgba(255,255,255,0.2)', label: '🦥 Meh... Do it whenever. Netflix first.' },
        { id: 'medium', color: 'var(--accent-warning)', label: '⚡ Should probably do this... eventually.' },
        { id: 'high', color: '#f97316', label: '🔥 Boss is asking. Pretend to be busy!' },
        { id: 'critical', color: 'var(--accent-danger)', label: '💀 DROP EVERYTHING. Code red. Panic mode!' }
    ];

    return (
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                <input
                    ref={titleInputRef}
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    onKeyDown={(e) => {
                        if (e.key === 'Tab' && parsedTask) {
                            e.preventDefault();
                            applySuggestion();
                        }
                    }}
                    placeholder="Add a new task... (e.g. 'Call John tomorrow urgent')"
                    style={{ flex: 1, background: 'transparent', border: 'none', padding: '8px', color: 'var(--text-primary)', fontSize: '16px' }}
                    autoFocus
                />

                {parsedTask && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '-35px',
                            left: '8px',
                            background: 'var(--accent-primary)',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            zIndex: 10
                        }}
                        onClick={applySuggestion}
                    >
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {parsedTask.dueDate && <span>📅 {parsedTask.dueDate} {parsedTask.dueTime}</span>}
                            {parsedTask.assignee && <span>👤 {parsedTask.assignee}</span>}
                            {parsedTask.priority !== 'none' && <span>🔥 {parsedTask.priority}</span>}
                        </div>
                        <span style={{ opacity: 0.7, fontSize: '10px', borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '8px' }}>Tab to apply</span>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); dismissSuggestion(); }}
                            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, marginLeft: '4px' }}
                        >
                            ×
                        </button>
                    </div>
                )}

                <input
                    type="text"
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    placeholder="Project (opt)"
                    style={{
                        width: '120px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        padding: '8px',
                        color: 'var(--text-secondary)',
                        fontSize: '14px'
                    }}
                />
                <FunnyTooltip context="add">
                    <button type="submit" className="btn-primary" style={{ padding: '8px 24px', fontSize: '14px' }}>
                        Add
                    </button>
                </FunnyTooltip>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                {/* Priority Selector */}
                <div role="radiogroup" aria-label="Priority" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginRight: '4px' }}>Priority:</span>
                    {priorityConfig.map(p => (
                        <FunnyTooltip key={p.id} context="priority" content={p.label}>
                            <button
                                type="button"
                                role="radio"
                                aria-checked={priority === p.id}
                                aria-label={p.label}
                                onClick={() => setPriority(p.id)}
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
                        </FunnyTooltip>
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
                    <input
                        type="time"
                        value={dueTime}
                        onChange={(e) => setDueTime(e.target.value)}
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

                {/* Assignee & Tags */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {assignee && (
                        <span style={{
                            background: 'rgba(59, 130, 246, 0.2)',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#60a5fa'
                        }}>
                            👤 {assignee}
                            <button
                                type="button"
                                onClick={() => setAssignee('')}
                                style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: 0, fontSize: '14px' }}
                            >
                                ×
                            </button>
                        </span>
                    )}

                    {tags.map(tag => (
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
                                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, fontSize: '14px' }}
                            >
                                ×
                            </button>
                        </span>
                    ))}

                    {showTagInput ? (
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
                                placeholder="Type tag..."
                                style={{
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                    color: 'white',
                                    width: '80px'
                                }}
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (tagInput.trim()) setTags([...tags, tagInput.trim()]);
                                    setTagInput('');
                                    setShowTagInput(false);
                                }}
                                style={{ background: 'none', border: 'none', color: 'var(--accent-success)', cursor: 'pointer' }}
                            >
                                ✓
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setShowTagInput(true)}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px dashed rgba(255,255,255,0.2)',
                                borderRadius: '12px',
                                padding: '2px 8px',
                                fontSize: '11px',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer'
                            }}
                        >
                            + Tag
                        </button>
                    )}
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
