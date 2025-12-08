import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    selectTasksCompletedYesterday,
    selectTopPrioritiesToday,
    selectTasksForTomorrow,
    selectUpcomingTasks,
    selectMyTasks,
    selectDelegatedTasks,
    selectDecisionTasks
} from '../../tasks/tasksSelectors';
import { updateTask } from '../../tasks/tasksSlice';
import { FunnyTooltip } from '../../../components/ui';

// Sortable task item for drag and drop
function SortableTaskItem({ task, color }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        fontSize: '13px',
        padding: '8px',
        background: isDragging ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.03)',
        borderRadius: '6px',
        borderLeft: `2px solid ${color}`,
        flexShrink: 0,
        cursor: 'grab',
        opacity: isDragging ? 0.8 : 1,
        boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.3)' : 'none'
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ cursor: 'grab', opacity: 0.5 }}>⋮⋮</span>
                {task.title}
            </div>
            {task.dueDate && <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', marginLeft: '18px' }}>Due: {task.dueDate}</div>}
        </div>
    );
}

export function ExecutiveSummary({ vertical = false, activeFilter = null, onFilterChange = () => { } }) {
    const dispatch = useDispatch();
    const completedYesterday = useSelector(selectTasksCompletedYesterday);
    const topPriorities = useSelector(selectTopPrioritiesToday);
    const tomorrowTasks = useSelector(selectTasksForTomorrow);
    const upcomingTasks = useSelector(selectUpcomingTasks);
    const myTasks = useSelector(selectMyTasks);
    const delegatedTasks = useSelector(selectDelegatedTasks);
    const decisionTasks = useSelector(selectDecisionTasks);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = topPriorities.findIndex(t => t.id === active.id);
            const newIndex = topPriorities.findIndex(t => t.id === over.id);

            // Update priority order by setting sortOrder on tasks
            const reorderedTasks = arrayMove(topPriorities, oldIndex, newIndex);
            reorderedTasks.forEach((task, index) => {
                dispatch(updateTask({ id: task.id, updates: { sortOrder: index } }));
            });
        }
    };

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
        minWidth: vertical ? '100%' : '200px'
    };

    const SummaryCard = ({ title, count, items, color, icon, filterId, draggable = false }) => {
        const isActive = activeFilter === filterId;

        return (
            <div
                className="glass-panel"
                style={{
                    ...cardStyle,
                    maxHeight: '300px',
                    cursor: 'pointer',
                    border: isActive ? `2px solid ${color}` : '1px solid transparent',
                    transition: 'all 0.2s ease'
                }}
                onClick={() => onFilterChange(filterId)}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
                    <h3 style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: isActive ? color : 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>{icon}</span> {title}
                    </h3>
                    <span style={{ fontSize: '20px', fontWeight: 700, color: color }}>{count}</span>
                </div>

                <div className="custom-scrollbar" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', paddingRight: '4px' }}>
                    {items && items.length > 0 ? (
                        draggable ? (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={items.map(t => t.id)} strategy={verticalListSortingStrategy}>
                                    {items.map(task => (
                                        <SortableTaskItem key={task.id} task={task} color={color} />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        ) : (
                            items.map(task => (
                                <div key={task.id} style={{ fontSize: '13px', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', borderLeft: `2px solid ${color}`, flexShrink: 0 }}>
                                    <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                                    {task.dueDate && <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Due: {task.dueDate}</div>}
                                </div>
                            ))
                        )
                    ) : (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px' }}>Nothing here yet.</div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={containerStyle}>
            {/* Yesterday */}
            <SummaryCard
                title="Yesterday's Wins"
                count={completedYesterday.length}
                items={completedYesterday}
                color="var(--accent-success)"
                icon="✅"
                filterId="yesterday"
            />

            {/* Today - with drag-to-reorder */}
            <SummaryCard
                title="Today's Focus"
                count={topPriorities.length}
                items={topPriorities}
                color="var(--accent-danger)"
                icon="🔥"
                filterId="today"
                draggable={true}
            />

            {/* Radar / Actions - Clickable items */}
            <div
                className="glass-panel"
                style={{
                    ...cardStyle,
                    border: ['actions', 'delegations', 'decisions'].includes(activeFilter)
                        ? '2px solid var(--accent-primary)'
                        : '1px solid transparent',
                    transition: 'all 0.2s ease'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📡</span> Radar
                    </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, justifyContent: 'center' }}>
                    <div
                        onClick={() => onFilterChange('actions')}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px',
                            background: activeFilter === 'actions' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            border: activeFilter === 'actions' ? '1px solid var(--accent-primary)' : '1px solid transparent',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <span style={{ fontSize: '13px' }}>Actions (My Tasks)</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{myTasks.length}</span>
                    </div>
                    <div
                        onClick={() => onFilterChange('delegations')}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px',
                            background: activeFilter === 'delegations' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255,255,255,0.03)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            border: activeFilter === 'delegations' ? '1px solid #f97316' : '1px solid transparent',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <span style={{ fontSize: '13px' }}>Delegations</span>
                        <span style={{ fontWeight: 700, color: '#f97316' }}>{delegatedTasks.length}</span>
                    </div>
                    <div
                        onClick={() => onFilterChange('decisions')}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px',
                            background: activeFilter === 'decisions' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.03)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            border: activeFilter === 'decisions' ? '1px solid #a855f7' : '1px solid transparent',
                            transition: 'all 0.2s ease'
                        }}
                    >
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
                filterId="tomorrow"
            />

            {/* Horizon */}
            <SummaryCard
                title="Horizon"
                count={upcomingTasks.length}
                items={upcomingTasks}
                color="#8b5cf6"
                icon="🔭"
                filterId="horizon"
            />
        </div>
    );
}
