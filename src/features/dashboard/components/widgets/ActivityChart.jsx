import React, { useMemo } from 'react';

export function ActivityChart({ tasks }) {
    // Generate hourly activity data (8 AM - 6 PM mostly, but we'll show a 24h spread condensed or just "active hours")
    // For simplicity and better UI, let's show 6 slots of 3 hours: 6AM-9AM, 9-12, 12-3, 3-6, 6-9, 9-12PM    
    const timeSlots = ['6-9 AM', '9-12 PM', '12-3 PM', '3-6 PM', '6-9 PM', '9-12 AM'];

    const activityData = useMemo(() => {
        const slots = [0, 0, 0, 0, 0, 0];

        // Filter for tasks completed TODAY
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const tasksCompletedToday = tasks.filter(t => {
            if (t.status !== 'done' || !t.completedAt) return false;
            const completedDate = new Date(t.completedAt);
            return completedDate >= today && completedDate <= todayEnd;
        });

        tasksCompletedToday.forEach(task => {
            const hour = new Date(task.completedAt).getHours();
            if (hour >= 6 && hour < 9) slots[0]++;
            else if (hour >= 9 && hour < 12) slots[1]++;
            else if (hour >= 12 && hour < 15) slots[2]++;
            else if (hour >= 15 && hour < 18) slots[3]++;
            else if (hour >= 18 && hour < 21) slots[4]++;
            else if (hour >= 21 || hour < 6) slots[5]++; // Late night / early morning
        });

        return slots;
    }, [tasks]);

    const maxHeight = Math.max(...activityData, 1); // Avoid div by zero

    return (
        <div className="glass-panel" style={{
            padding: '24px',
            borderRadius: '24px',
            background: 'var(--surface-secondary)',
            border: '1px solid rgba(255,255,255,0.08)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', color: '#3b82f6' }}>
                        📈
                    </div>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>Activity</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Tasks completed today</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', height: '140px' }}>
                {/* Bar Chart */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: '12px',
                        paddingBottom: '8px'
                    }}>
                        {activityData.map((count, i) => (
                            <div
                                key={i}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    alignItems: 'center',
                                    height: '100%',
                                    justifyContent: 'flex-end',
                                    position: 'relative',
                                    group: 'bar-group' // phantom class for identification
                                }}
                            >
                                {/* Tooltip on hover could go here */}
                                <div style={{
                                    fontSize: '10px',
                                    color: 'var(--text-muted)',
                                    marginBottom: '4px',
                                    opacity: count > 0 ? 1 : 0
                                }}>
                                    {count}
                                </div>

                                {/* Bar */}
                                <div style={{
                                    width: '100%',
                                    height: count > 0 ? `${(count / maxHeight) * 100}% ` : '4px',
                                    minHeight: '4px',
                                    background: count > 0
                                        ? `linear-gradient(to top, #60a5fa, #3b82f6)`
                                        : 'rgba(255,255,255,0.05)',
                                    borderRadius: '6px',
                                    transition: 'height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    boxShadow: count > 0 ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                                }} />
                            </div>
                        ))}
                    </div>
                    {/* X-axis labels */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '9px',
                        color: 'var(--text-muted)',
                        paddingTop: '8px',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        textAlign: 'center'
                    }}>
                        {timeSlots.map((h, i) => (
                            <div key={i} style={{ flex: 1, textAlign: 'center' }}>{h.split(' ')[0]}</div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
