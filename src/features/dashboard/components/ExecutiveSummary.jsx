import React from 'react';
import { useSelector } from 'react-redux';
import {
    selectTasksCompletedYesterday,
    selectTopPrioritiesToday,
    selectTasksForTomorrow,
    selectUpcomingTasks,
    selectMyTasks,
    selectDelegatedTasks,
    selectDecisionTasks
} from '../../tasks/tasksSelectors';
import { FunnyTooltip } from '../../../components/ui';

export function ExecutiveSummary({ vertical = false }) {
    const completedYesterday = useSelector(selectTasksCompletedYesterday);
    const topPriorities = useSelector(selectTopPrioritiesToday);
    const tomorrowTasks = useSelector(selectTasksForTomorrow);
    const upcomingTasks = useSelector(selectUpcomingTasks);
    const myTasks = useSelector(selectMyTasks);
    const delegatedTasks = useSelector(selectDelegatedTasks);
    const decisionTasks = useSelector(selectDecisionTasks);

    const containerStyle = vertical ? {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%'
    } : {
        display: 'flex',
        gap: '16px',
        overflowX: 'auto',
        paddingBottom: '8px',
        marginBottom: '32px'
    };

    const cardStyle = {
        flex: 1,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        minWidth: vertical ? '100%' : '200px',
        borderTopWidth: '3px',
        borderTopStyle: 'solid'
    };

    const SummaryCard = ({ title, count, items, color, icon }) => (
        <div className="glass-panel" style={{ ...cardStyle, borderTopColor: color }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{icon}</span> {title}
                </h3>
                <span style={{ fontSize: '20px', fontWeight: 700, color: color }}>{count}</span>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '150px' }}>
                {items && items.length > 0 ? (
                    items.slice(0, 3).map(task => (
                        <div key={task.id} style={{ fontSize: '13px', padding: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', borderLeft: `2px solid ${color}` }}>
                            <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                            {task.dueDate && <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Due: {task.dueDate}</div>}
                        </div>
                    ))
                ) : (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Nothing here yet.</div>
                )}
                {items && items.length > 3 && (
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '4px' }}>
                        + {items.length - 3} more
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div style={containerStyle}>
            {/* Yesterday */}
            <SummaryCard
                title="Yesterday's Wins"
                count={completedYesterday.length}
                items={completedYesterday}
                color="var(--accent-success)"
                icon="✅"
            />

            {/* Today */}
            <SummaryCard
                title="Today's Focus"
                count={topPriorities.length}
                items={topPriorities}
                color="var(--accent-danger)"
                icon="🔥"
            />

            {/* Radar / Actions */}
            <div className="glass-panel" style={{ ...cardStyle, borderTopColor: 'var(--accent-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📡</span> Radar
                    </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, justifyContent: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                        <span style={{ fontSize: '13px' }}>Actions (My Tasks)</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{myTasks.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                        <span style={{ fontSize: '13px' }}>Delegations</span>
                        <span style={{ fontWeight: 700, color: '#f97316' }}>{delegatedTasks.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                        <span style={{ fontSize: '13px' }}>Decisions</span>
                        <span style={{ fontWeight: 700, color: '#a855f7' }}>{decisionTasks.length}</span>
                    </div>
                </div>
            </div>

            {/* Tomorrow */}
            <SummaryCard
                title="Tomorrow"
                count={tomorrowTasks.length}
                items={tomorrowTasks}
                color="#3b82f6"
                icon="📅"
            />

            {/* Horizon */}
            <SummaryCard
                title="Horizon"
                count={upcomingTasks.length}
                items={upcomingTasks}
                color="#8b5cf6"
                icon="🔭"
            />
        </div>
    );
}
