import React from 'react';

export function WeeklyProgressRing({ categoryStats, weeklyCompleted, weeklyTotal }) {
    const categories = [
        {
            key: 'work',
            label: 'Work Tasks',
            color: '#22c55e',
            completed: categoryStats.work?.filter(t => t.status === 'done').length || 0,
            total: categoryStats.work?.length || 1
        },
        {
            key: 'personal',
            label: 'Personal Tasks',
            color: '#f59e0b',
            completed: categoryStats.personal?.filter(t => t.status === 'done').length || 0,
            total: categoryStats.personal?.length || 1
        },
        {
            key: 'errands',
            label: 'Errands',
            color: '#ef4444',
            completed: categoryStats.errands?.filter(t => t.status === 'done').length || 0,
            total: categoryStats.errands?.length || 1
        }
    ];

    // SVG Ring Chart
    const size = 100;
    const strokeWidth = 8;
    const center = size / 2;

    return (
        <div className="glass-panel" style={{
            padding: '24px',
            borderRadius: '24px',
            background: 'var(--surface-secondary)',
            border: '1px solid rgba(255,255,255,0.08)'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px'
            }}>
                <span style={{ fontSize: '16px' }}>📊</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    Weekly Progress
                </span>
            </div>

            <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                {/* Ring Chart */}
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {categories.map((cat, index) => {
                        const radius = center - strokeWidth * (index + 1) - 4 * index;
                        const circumference = 2 * Math.PI * radius;
                        const percentage = (cat.completed / cat.total) * 100;
                        const offset = circumference - (percentage / 100) * circumference;

                        return (
                            <g key={cat.key}>
                                {/* Background circle */}
                                <circle
                                    cx={center}
                                    cy={center}
                                    r={radius}
                                    fill="none"
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth={strokeWidth}
                                />
                                {/* Progress circle */}
                                <circle
                                    cx={center}
                                    cy={center}
                                    r={radius}
                                    fill="none"
                                    stroke={cat.color}
                                    strokeWidth={strokeWidth}
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={offset}
                                    transform={`rotate(-90 ${center} ${center})`}
                                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                                />
                            </g>
                        );
                    })}
                </svg>

                {/* Legend */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {categories.map(cat => {
                        const percentage = Math.round((cat.completed / cat.total) * 100);
                        return (
                            <div key={cat.key} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <div style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '3px',
                                    background: cat.color
                                }} />
                                <div>
                                    <div style={{
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)'
                                    }}>
                                        {cat.completed}/{cat.total * 10}
                                    </div>
                                    <div style={{
                                        fontSize: '11px',
                                        color: 'var(--text-muted)'
                                    }}>
                                        {cat.label}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
