import React, { useMemo, useState } from 'react';

export function MonthlyTaskHeatmap({ tasks }) {
    const [hoveredDay, setHoveredDay] = useState(null);

    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'short' });
    const year = now.getFullYear();
    const dayInitials = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate();
    const firstDay = new Date(year, now.getMonth(), 1).getDay();

    // Calculate tasks per day for the current month
    const { dailyTaskCounts, totalTasks } = useMemo(() => {
        const counts = Array(daysInMonth).fill(0);
        let total = 0;

        tasks.forEach(task => {
            if (!task.dueDate) return;
            const dueDate = new Date(task.dueDate);
            if (dueDate.getMonth() === now.getMonth() && dueDate.getFullYear() === year) {
                const day = dueDate.getDate();
                if (day >= 1 && day <= daysInMonth) {
                    counts[day - 1]++;
                    total++;
                }
            }
        });

        return { dailyTaskCounts: counts, totalTasks: total };
    }, [tasks, daysInMonth, year]);

    // Get color intensity based on task count
    const getTaskColor = (count) => {
        if (count === 0) return 'rgba(255, 255, 255, 0.05)';
        if (count === 1) return 'rgba(139, 92, 246, 0.3)';
        if (count === 2) return 'rgba(139, 92, 246, 0.5)';
        if (count === 3) return 'rgba(139, 92, 246, 0.7)';
        return 'rgba(139, 92, 246, 0.9)'; // 4+
    };

    return (
        <div className="glass-panel" style={{
            padding: '24px',
            borderRadius: '24px',
            background: 'var(--surface-secondary)',
            border: '1px solid rgba(255,255,255,0.08)',
            position: 'relative'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '2px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--text-primary)'
                }}>
                    {month} {year}
                </div>
                <div style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--text-primary)'
                }}>
                    {totalTasks}
                </div>
            </div>

            {/* Calendar Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '6px',
                textAlign: 'center'
            }}>
                {/* Day headers */}
                {dayInitials.map((d, i) => (
                    <div key={`header-${i}`} style={{
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                        fontWeight: 500,
                        paddingBottom: '8px'
                    }}>
                        {d}
                    </div>
                ))}

                {/* Empty cells for first day offset */}
                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}

                {/* Day cells */}
                {dailyTaskCounts.map((count, i) => (
                    <div
                        key={`day-${i}`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                        }}
                        onMouseEnter={() => setHoveredDay(i)}
                        onMouseLeave={() => setHoveredDay(null)}
                    >
                        <div style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '3px',
                            background: getTaskColor(count),
                            transition: 'all 0.2s ease',
                            transform: hoveredDay === i ? 'scale(1.3)' : 'scale(1)',
                            cursor: 'pointer'
                        }} />

                        {/* Tooltip */}
                        {hoveredDay === i && (
                            <div style={{
                                position: 'absolute',
                                bottom: '100%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                marginBottom: '8px',
                                padding: '6px 10px',
                                background: 'rgba(0, 0, 0, 0.9)',
                                borderRadius: '6px',
                                fontSize: '11px',
                                color: 'white',
                                whiteSpace: 'nowrap',
                                zIndex: 100,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                            }}>
                                {count} task{count !== 1 ? 's' : ''} on {i + 1} {month}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '4px',
                marginTop: '16px',
                fontSize: '10px',
                color: 'var(--text-muted)'
            }}>
                <span>Less</span>
                {[0, 1, 2, 3, 4].map(level => (
                    <div
                        key={level}
                        style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '2px',
                            background: getTaskColor(level)
                        }}
                    />
                ))}
                <span>More</span>
            </div>
        </div>
    );
}
