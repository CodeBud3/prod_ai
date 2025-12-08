import React, { useState, useRef, useEffect } from 'react';
import { FunnyTooltip } from '../../../components/ui';
import { parseDate } from '../../../utils/dateParser';

export function QuickAdd({ onAdd }) {
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState('none'); // none, low, medium, high
    const [dueDate, setDueDate] = useState('');
    const [dueTime, setDueTime] = useState(''); // New state for time
    const [tags, setTags] = useState([]);
    const [showTagInput, setShowTagInput] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [project, setProject] = useState('');
    const [suggestedDate, setSuggestedDate] = useState(null); // { date, text, index, length }
    const titleInputRef = useRef(null);

    const handleTitleChange = (e) => {
        const newTitle = e.target.value;
        setTitle(newTitle);

        // Parse date from title
        const result = parseDate(newTitle);
        if (result) {
            setSuggestedDate(result);
        } else {
            setSuggestedDate(null);
        }
    };

    const applySuggestion = () => {
        if (!suggestedDate) return;

        const { date, text } = suggestedDate;

        // Format date for input (YYYY-MM-DD)
        const dateStr = date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0');

        setDueDate(dateStr);

        // Format time if present (HH:MM)
        // Check if the parsed date has specific time (chrono usually sets 12:00 if unknown, but let's check)
        // Actually chrono sets current time or noon if not specified. 
        // We can check if the result "implied" the time or "known" it.
        // For now, let's just set the time if it's not 12:00:00.000 (default) OR if the text implies time.
        // A simpler way: just set the time from the date object.
        const timeStr = String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
        setDueTime(timeStr);

        // Remove the parsed text from the title
        // We need to be careful. If "tommo" is at the end, remove it.
        // If it's in the middle, remove it and clean up spaces.

        // Simple approach: Replace the text with empty string
        let newTitle = title.replace(text, '').replace(/\s{2,}/g, ' ').trim();
        setTitle(newTitle);
        setSuggestedDate(null);

        // Focus back on input
        titleInputRef.current?.focus();
    };

    const dismissSuggestion = () => {
        setSuggestedDate(null);
        // We might want to ignore this specific text for a while? 
        // For simplicity, just clearing it. It will reappear if they type more.
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        // Auto-apply suggestion if present on submit
        let finalDueDate = dueDate;
        let finalTitle = title;

        if (suggestedDate) {
            const { date, text } = suggestedDate;
            const dateStr = date.getFullYear() + '-' +
                String(date.getMonth() + 1).padStart(2, '0') + '-' +
                String(date.getDate()).padStart(2, '0');
            finalDueDate = dateStr;

            // Also handle time... but QuickAdd onAdd prop might expect just date or ISO string?
            // The onAdd in Dashboard/Tasks usually takes a task object.
            // Let's see what onAdd does. It usually dispatches addTask.
            // We should combine date and time into a single ISO string if time is set.

            finalTitle = title.replace(text, '').replace(/\s{2,}/g, ' ').trim();
        }

        // Construct final due date string
        let finalDueDateTime = finalDueDate;
        if (finalDueDate && dueTime) {
            finalDueDateTime = `${finalDueDate}T${dueTime}`;
        } else if (finalDueDate && !dueTime && suggestedDate) {
            // If we auto-applied, we might have a time in suggestedDate
            const { date } = suggestedDate;
            const timeStr = String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
            // Only use time if it seems intentional? 
            // Chrono defaults to noon. Let's assume if user typed "at 5pm" it's there.
            // If they just typed "tommo", time might be current time or noon.
            // For now, let's just use the date part for "tommo".
            // If the text contained time-like chars (: or am/pm), use time.
            if (/:|am|pm|morning|evening|night/i.test(suggestedDate.text)) {
                finalDueDateTime = `${finalDueDate}T${timeStr}`;
            }
        }

        onAdd({
            title: finalTitle,
            priority,
            dueDate: finalDueDateTime || null,
            tags,
            project: project.trim() || null
        });

        // Reset and keep focus
        setTitle('');
        setPriority('none');
        setDueDate('');
        setDueTime('');
        setTags([]);
        setProject('');
        setShowTagInput(false);
        setTagInput('');
        setSuggestedDate(null);
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
                        if (e.key === 'Tab' && suggestedDate) {
                            e.preventDefault();
                            applySuggestion();
                        }
                    }}
                    placeholder="Add a new task..."
                    style={{ flex: 1, background: 'transparent', border: 'none', padding: '8px', color: 'var(--text-primary)', fontSize: '16px' }}
                    autoFocus
                />

                {suggestedDate && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '-30px',
                            left: '8px',
                            background: 'var(--accent-primary)',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            zIndex: 10
                        }}
                        onClick={applySuggestion}
                    >
                        <span>📅 {suggestedDate.date.toLocaleDateString()} {suggestedDate.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span style={{ opacity: 0.7, fontSize: '10px' }}>(Tab to apply)</span>
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
                {/* Priority Selector - Keyboard Accessible */}
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

                {/* Tag Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
