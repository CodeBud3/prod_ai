import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FunnyTooltip } from './FunnyTooltip';
import { TaskItem } from './TaskItem';
import { EditTaskModal } from './EditTaskModal';

// Wrapper to make TaskItem draggable
function DraggableTaskItem({ task, isOverlay, toggleTask, setEditingTask, handleSetReminder, handleDismissReminder, onDeleteTask, getPriorityColor, formatTimestamp, handleSetFocus }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: { task }
    });

    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
        touchAction: 'none',
        marginBottom: isOverlay ? '0' : '8px'
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            <TaskItem
                task={task}
                toggleTask={toggleTask}
                setEditingTask={setEditingTask}
                handleSetReminder={handleSetReminder}
                handleDismissReminder={handleDismissReminder}
                onDeleteTask={onDeleteTask}
                getPriorityColor={getPriorityColor}
                formatTimestamp={formatTimestamp}
                handleSetFocus={handleSetFocus}
            />
        </div>
    );
}

// Droppable Quadrant
function Quadrant({ id, title, description, tasks, color, toggleTask, setEditingTask, handleSetReminder, handleDismissReminder, onDeleteTask, getPriorityColor, formatTimestamp, handleSetFocus }) {
    const { setNodeRef, isOver } = useDroppable({
        id: id
    });

    return (
        <div
            ref={setNodeRef}
            style={{
                background: isOver ? `${color}20` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isOver ? color : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                transition: 'all 0.2s'
            }}
        >
            <div style={{ marginBottom: '12px', borderBottom: `2px solid ${color}`, paddingBottom: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: color, marginBottom: '4px' }}>{title}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{description}</p>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', minHeight: '100px' }}>
                {tasks.map(task => (
                    <DraggableTaskItem
                        key={task.id}
                        task={task}
                        toggleTask={toggleTask}
                        setEditingTask={setEditingTask}
                        handleSetReminder={handleSetReminder}
                        handleDismissReminder={handleDismissReminder}
                        onDeleteTask={onDeleteTask}
                        getPriorityColor={getPriorityColor}
                        formatTimestamp={formatTimestamp}
                        handleSetFocus={handleSetFocus}
                    />
                ))}
                {tasks.length === 0 && (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>
                        Drop here
                    </div>
                )}
            </div>
        </div>
    );
}

function getPriorityColor(p) {
    if (p === 'high') return 'var(--accent-danger)';
    if (p === 'medium') return '#f97316';
    if (p === 'low') return 'var(--accent-warning)';
    return 'var(--text-muted)';
}

export function PrioritizationStudio({ tasks, onUpdateTasks, onClose }) {
    const [framework, setFramework] = useState('eisenhower'); // eisenhower, impact_effort
    const [activeId, setActiveId] = useState(null);
    const [draggedTask, setDraggedTask] = useState(null);
    const [editingTask, setEditingTask] = useState(null);

    // Filter out completed tasks for prioritization
    const activeTasks = tasks.filter(t => t.status !== 'done');

    // Helper to get quadrant for a task based on framework
    const getQuadrant = (task) => {
        if (framework === 'eisenhower') {
            // Only respect explicit quadrant if it's NOT uncategorized
            // This allows the priority fallback to work even if previously set to uncategorized
            if (task.eisenhowerQuadrant && task.eisenhowerQuadrant !== 'uncategorized') {
                return task.eisenhowerQuadrant;
            }

            // Fallback to priority mapping
            if (task.priority === 'high') return 'q1'; // Do First
            if (task.priority === 'medium') return 'q2'; // Schedule (Default for Medium)
            if (task.priority === 'low') return 'q4'; // Eliminate (Default for Low)

            return 'uncategorized';
        } else {
            return task.impactEffortQuadrant || 'uncategorized';
        }
    };

    const toggleTask = (id) => {
        const updatedTasks = tasks.map(t => {
            if (t.id === id) {
                const isDone = t.status === 'done';
                return {
                    ...t,
                    status: isDone ? 'todo' : 'done',
                    completedAt: isDone ? null : Date.now(),
                    focusColor: isDone ? t.focusColor : null
                };
            }
            return t;
        });
        onUpdateTasks(updatedTasks);
    };

    const handleDeleteTask = (taskId) => {
        const updatedTasks = tasks.filter(t => t.id !== taskId);
        onUpdateTasks(updatedTasks);
    };

    const handleSaveTask = (updatedTask) => {
        const updatedTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
        onUpdateTasks(updatedTasks);
        setEditingTask(null);
    };

    const handleSetReminder = (taskId, minutes) => {
        const now = Date.now();
        const remindAt = now + (minutes * 60 * 1000);
        const updatedTasks = tasks.map(t =>
            t.id === taskId ? { ...t, remindAt, reminderStartedAt: now } : t
        );
        onUpdateTasks(updatedTasks);
    };

    const handleDismissReminder = (taskId) => {
        const updatedTasks = tasks.map(t =>
            t.id === taskId ? { ...t, reminding: false, remindAt: null, reminderStartedAt: null } : t
        );
        onUpdateTasks(updatedTasks);
    };

    const handleSetFocus = (taskId, color) => {
        const updatedTasks = tasks.map(t =>
            t.id === taskId ? { ...t, focusColor: color } : t
        );
        onUpdateTasks(updatedTasks);
    };

    const formatTimestamp = (timestamp) => {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'just now';
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
        setDraggedTask(event.active.data.current.task);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const taskId = active.id;
            const newQuadrant = over.id;

            // Update task data
            const updatedTasks = tasks.map(t => {
                if (t.id === taskId) {
                    if (framework === 'eisenhower') {
                        // Auto-update priority based on Eisenhower
                        let newPriority = t.priority;
                        let newEisenhowerQuadrant = newQuadrant;

                        if (newQuadrant === 'q1') newPriority = 'high';
                        else if (newQuadrant === 'q2') newPriority = 'medium';
                        else if (newQuadrant === 'q3') newPriority = 'medium';
                        else if (newQuadrant === 'q4') newPriority = 'low';
                        else if (newQuadrant === 'uncategorized') {
                            newPriority = 'none'; // Clear priority when moving to uncategorized
                            newEisenhowerQuadrant = null; // Clear quadrant
                        }

                        return { ...t, eisenhowerQuadrant: newEisenhowerQuadrant, priority: newPriority };
                    } else {
                        return { ...t, impactEffortQuadrant: newQuadrant };
                    }
                }
                return t;
            });
            onUpdateTasks(updatedTasks);
        }

        setActiveId(null);
        setDraggedTask(null);
    };

    const frameworks = {
        eisenhower: {
            title: 'Eisenhower Matrix',
            quadrants: [
                { id: 'q1', title: 'Do First', description: 'Urgent & Important', color: '#ef4444' }, // Red
                { id: 'q2', title: 'Schedule', description: 'Not Urgent & Important', color: '#3b82f6' }, // Blue
                { id: 'q3', title: 'Delegate', description: 'Urgent & Not Important', color: '#f97316' }, // Orange
                { id: 'q4', title: 'Eliminate', description: 'Not Urgent & Not Important', color: '#94a3b8' } // Grey
            ]
        },
        impact_effort: {
            title: 'Impact vs Effort',
            quadrants: [
                { id: 'quick_wins', title: 'Quick Wins', description: 'High Impact, Low Effort', color: '#10b981' }, // Green
                { id: 'major_projects', title: 'Major Projects', description: 'High Impact, High Effort', color: '#a855f7' }, // Purple
                { id: 'fill_ins', title: 'Fill-ins', description: 'Low Impact, Low Effort', color: '#eab308' }, // Yellow
                { id: 'thankless', title: 'Thankless Tasks', description: 'Low Impact, High Effort', color: '#ef4444' } // Red
            ]
        }
    };

    const currentFramework = frameworks[framework];

    return (
        <div className="glass-panel fade-in" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2000,
            background: 'var(--bg-primary)',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <h2 style={{ margin: 0 }}>Prioritization Studio</h2>
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px' }}>
                        <button
                            onClick={() => setFramework('eisenhower')}
                            style={{
                                background: framework === 'eisenhower' ? 'var(--accent-primary)' : 'transparent',
                                color: framework === 'eisenhower' ? 'white' : 'var(--text-secondary)',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 500
                            }}
                        >
                            Eisenhower
                        </button>
                        <button
                            onClick={() => setFramework('impact_effort')}
                            style={{
                                background: framework === 'impact_effort' ? 'var(--accent-primary)' : 'transparent',
                                color: framework === 'impact_effort' ? 'white' : 'var(--text-secondary)',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 500
                            }}
                        >
                            Impact vs Effort
                        </button>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    Close
                </button>
            </div>

            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
                <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden' }}>

                    {/* Sidebar: Uncategorized Tasks */}
                    <div style={{
                        width: '250px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Uncategorized
                        </h3>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <Quadrant
                                id="uncategorized"
                                title=""
                                description=""
                                tasks={activeTasks.filter(t => getQuadrant(t) === 'uncategorized')}
                                color="transparent"
                                toggleTask={toggleTask}
                                setEditingTask={setEditingTask}
                                handleSetReminder={handleSetReminder}
                                handleDismissReminder={handleDismissReminder}
                                onDeleteTask={handleDeleteTask}
                                getPriorityColor={getPriorityColor}
                                formatTimestamp={formatTimestamp}
                                handleSetFocus={handleSetFocus}
                            />
                        </div>
                    </div>

                    {/* Matrix Grid */}
                    <div style={{
                        flex: 1,
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gridTemplateRows: '1fr 1fr',
                        gap: '16px',
                        padding: '4px' // Padding for drag overflow
                    }}>
                        {currentFramework.quadrants.map(q => (
                            <Quadrant
                                key={q.id}
                                id={q.id}
                                title={q.title}
                                description={q.description}
                                color={q.color}
                                tasks={activeTasks.filter(t => getQuadrant(t) === q.id)}
                                toggleTask={toggleTask}
                                setEditingTask={setEditingTask}
                                handleSetReminder={handleSetReminder}
                                handleDismissReminder={handleDismissReminder}
                                onDeleteTask={handleDeleteTask}
                                getPriorityColor={getPriorityColor}
                                formatTimestamp={formatTimestamp}
                                handleSetFocus={handleSetFocus}
                            />
                        ))}
                    </div>
                </div>

                <DragOverlay>
                    {activeId && draggedTask ? (
                        <DraggableTaskItem
                            task={draggedTask}
                            isOverlay
                            toggleTask={toggleTask}
                            setEditingTask={setEditingTask}
                            handleSetReminder={handleSetReminder}
                            handleDismissReminder={handleDismissReminder}
                            onDeleteTask={handleDeleteTask}
                            getPriorityColor={getPriorityColor}
                            formatTimestamp={formatTimestamp}
                            handleSetFocus={handleSetFocus}
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>

            {editingTask && (
                <EditTaskModal
                    task={editingTask}
                    onSave={handleSaveTask}
                    onCancel={() => setEditingTask(null)}
                />
            )}
        </div>
    );
}
