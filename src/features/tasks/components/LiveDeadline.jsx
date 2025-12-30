import React, { useState, useEffect } from 'react';

/**
 * LiveDeadline component displays a progress bar and time remaining/overdue
 * for task deadlines. Updates in real-time.
 * 
 * @param {Object} props
 * @param {string} props.dueDate - ISO date string for the deadline
 * @param {number} props.createdAt - Timestamp when task was created
 */
export function LiveDeadline({ dueDate, createdAt }) {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const due = new Date(dueDate).getTime();
    const created = createdAt || now;
    const totalDuration = due - created;
    const elapsed = now - created;
    const progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

    const diff = due - now;
    const isOverdue = diff < 0;
    const absDiff = Math.abs(diff);

    // Calculate time units
    const minutes = Math.floor((absDiff / (1000 * 60)) % 60);
    const hours = Math.floor((absDiff / (1000 * 60 * 60)) % 24);
    const days = Math.floor((absDiff / (1000 * 60 * 60 * 24)) % 7);
    const weeks = Math.floor((absDiff / (1000 * 60 * 60 * 24 * 7)) % 4);
    const months = Math.floor((absDiff / (1000 * 60 * 60 * 24 * 30)) % 12);
    const years = Math.floor(absDiff / (1000 * 60 * 60 * 24 * 365));

    // Construct string
    const parts = [];
    if (years > 0) parts.push(`${years}y`);
    if (months > 0) parts.push(`${months}mo`);
    if (weeks > 0) parts.push(`${weeks}w`);
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    if (parts.length === 0) parts.push('Due now');

    const timeString = parts.join(' ');
    const label = isOverdue ? `${timeString} overdue` : `${timeString} left`;

    // Phrases logic
    const daysTotal = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    const getDeadlinePhrase = (d) => {
        if (d < 0) return "Too little, too late. 💀";
        if (d === 0) return "Panic mode: ON. 🚨";
        if (d <= 1) return "Do it now or regret it later. ⏳";
        if (d <= 3) return "Tick tock, the clock is ticking. ⏰";
        if (d <= 7) return "Don't get too comfortable. 👀";
        return "Future you will thank you. 🌱";
    };

    return (
        <div style={{ marginTop: '8px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                <span style={{ fontStyle: 'italic', opacity: 0.8 }}>{getDeadlinePhrase(daysTotal)}</span>
                <span style={{ fontWeight: 600, color: daysTotal <= 1 ? 'var(--accent-danger)' : 'inherit' }}>
                    {label}
                </span>
            </div>
            <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    background: daysTotal < 0 ? 'var(--accent-danger)' : (daysTotal <= 2 ? 'var(--accent-warning)' : 'linear-gradient(90deg, #3b82f6, #8b5cf6)'),
                    borderRadius: '2px',
                    transition: 'width 1s ease-in-out',
                    boxShadow: '0 0 8px rgba(59, 130, 246, 0.3)'
                }} />
            </div>
        </div>
    );
}

export default LiveDeadline;
