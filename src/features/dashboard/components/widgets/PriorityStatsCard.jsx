import React from 'react';

export function PriorityStatsCard({ tasks }) {
    // Calculate real stats by priority
    const totalTasks = tasks.length;

    // Group by priority
    const priorityStats = [
        {
            label: 'Critical',
            count: tasks.filter(t => t.priority === 'critical').length,
            color: '#ef4444'
        },
        {
            label: 'High',
            count: tasks.filter(t => t.priority === 'high').length,
            color: '#f97316'
        },
        {
            label: 'Normal',
            count: tasks.filter(t => t.priority === 'medium' || t.priority === 'normal' || !t.priority || t.priority === 'none').length,
            color: '#22c55e'
        },
        {
            label: 'Low',
            count: tasks.filter(t => t.priority === 'low').length,
            color: '#94a3b8'
        }
    ];

    const CircularProgress = ({ percentage, color, size = 48, count }) => {
        const strokeWidth = 4;
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        // Ensure at least a tiny sliver is shown if count > 0 but percentage is small
        const progress = count > 0 && percentage < 5 ? 5 : percentage;
        const offset = circumference - (progress / 100) * circumference;

        return (
            <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth={strokeWidth}
                    />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    />
                </svg>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: 'var(--text-primary)'
                }}>
                    {count}
                </div>
            </div>
        );
    };

    return (
        <div className="glass-panel" style={{
            padding: '24px',
            borderRadius: '24px',
            background: 'var(--surface-secondary)',
            border: '1px solid rgba(255,255,255,0.08)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: '#ef4444' }}>
                        ⚡
                    </div>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>Effectiveness</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Tasks by priority</div>
                    </div>
                </div>
            </div>

            {/* Circular Progress Indicators */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0 12px'
            }}>
                {priorityStats.map(item => {
                    const percentage = totalTasks > 0 ? (item.count / totalTasks) * 100 : 0;
                    return (
                        <div key={item.label} style={{ textAlign: 'center' }}>
                            <CircularProgress
                                percentage={percentage}
                                count={item.count}
                                color={item.color}
                            />
                            <div style={{
                                fontSize: '11px',
                                fontWeight: 500,
                                color: 'var(--text-secondary)',
                                marginTop: '10px'
                            }}>
                                {item.label}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
