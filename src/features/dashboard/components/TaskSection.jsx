import React, { useState } from 'react';
import { TaskItem } from '../../tasks';
import { FunnyTooltip } from '../../../components/ui';
import { getSortedTasks } from '../utils/dashboardUtils';

/**
 * Reusable task section component with filtering, sorting, and grouping capabilities.
 */
export const TaskSection = ({
    title,
    icon,
    tasks,
    count,
    onToggleTask,
    setEditingTask,
    handleSetReminder,
    handleDismissReminder,
    onDeleteTask,
    getPriorityColor,
    formatTimestamp,
    handleSetFocus,
    onUpdateTask,
    defaultSort = 'smart',
    defaultGroup = 'none',
    sortBy: externalSortBy,
    setSortBy: externalSetSortBy
}) => {
    const [internalSortBy, setInternalSortBy] = useState(defaultSort);
    const [groupBy, setGroupBy] = useState(defaultGroup);
    const [viewFilter, setViewFilter] = useState('all');

    // Use external sortBy if provided (for My Tasks in Focus Mode), otherwise use internal state
    const sortBy = externalSortBy !== undefined ? externalSortBy : internalSortBy;
    const setSortBy = externalSetSortBy || setInternalSortBy;

    // View Filtering
    const getFilteredTasks = (taskList) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const endOfTomorrow = new Date(tomorrow);
        endOfTomorrow.setHours(23, 59, 59, 999);

        switch (viewFilter) {
            case 'todo':
                return taskList.filter(t => t.status !== 'done');
            case 'completed':
                return taskList.filter(t => t.status === 'done');
            case 'focus':
                return taskList.filter(t => {
                    if (t.status === 'done') return false;
                    // High/Critical priority
                    if (t.priority === 'high' || t.priority === 'critical') return true;
                    // Due today
                    if (t.dueDate) {
                        const due = new Date(t.dueDate);
                        return due >= today && due <= endOfToday;
                    }
                    return false;
                });
            case 'tomorrow':
                return taskList.filter(t => {
                    if (t.status === 'done') return false;
                    if (!t.dueDate) return false;
                    const due = new Date(t.dueDate);
                    return due >= tomorrow && due <= endOfTomorrow;
                });
            case 'horizon':
                return taskList.filter(t => {
                    if (t.status === 'done') return false;
                    if (!t.dueDate) return false;
                    const due = new Date(t.dueDate);
                    return due > endOfTomorrow;
                });
            case 'all':
            default:
                return taskList;
        }
    };

    const renderGroupedTasks = (sorted, groupKey, getGroupValue, defaultLabel) => {
        return Object.entries(sorted.reduce((groups, task) => {
            const value = getGroupValue(task) || defaultLabel;
            if (!groups[value]) groups[value] = [];
            groups[value].push(task);
            return groups;
        }, {})).map(([groupLabel, groupTasks]) => (
            <div key={groupLabel} style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                    {groupLabel} <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>{groupTasks.length}</span>
                </h3>
                {groupTasks.map(task => (
                    <TaskItem
                        key={`${groupKey}-${groupLabel}-${task.id}`}
                        task={task}
                        toggleTask={onToggleTask}
                        setEditingTask={setEditingTask}
                        handleSetReminder={handleSetReminder}
                        handleDismissReminder={handleDismissReminder}
                        onDeleteTask={onDeleteTask}
                        getPriorityColor={getPriorityColor}
                        formatTimestamp={formatTimestamp}
                        handleSetFocus={handleSetFocus}
                        onUpdateTask={onUpdateTask}
                    />
                ))}
            </div>
        ));
    };

    const renderTaskList = (taskList) => {
        const filtered = getFilteredTasks(taskList);
        const sorted = getSortedTasks(filtered, sortBy);

        if (sorted.length === 0) {
            return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>No tasks found.</div>;
        }

        if (groupBy === 'tags') {
            // Tags grouping is special - one task can appear in multiple groups
            return Object.entries(sorted.reduce((groups, task) => {
                const taskTags = task.tags && task.tags.length > 0 ? task.tags : ['Untagged'];
                taskTags.forEach(tag => {
                    if (!groups[tag]) groups[tag] = [];
                    groups[tag].push(task);
                });
                return groups;
            }, {})).map(([tag, groupTasks]) => (
                <div key={tag} style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                        {tag} <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>{groupTasks.length}</span>
                    </h3>
                    {groupTasks.map(task => (
                        <TaskItem
                            key={`tag-${tag}-${task.id}`}
                            task={task}
                            toggleTask={onToggleTask}
                            setEditingTask={setEditingTask}
                            handleSetReminder={handleSetReminder}
                            handleDismissReminder={handleDismissReminder}
                            onDeleteTask={onDeleteTask}
                            getPriorityColor={getPriorityColor}
                            formatTimestamp={formatTimestamp}
                            handleSetFocus={handleSetFocus}
                            onUpdateTask={onUpdateTask}
                        />
                    ))}
                </div>
            ));
        } else if (groupBy === 'priority') {
            const buckets = { 'critical': [], 'high': [], 'medium': [], 'low': [], 'none': [] };

            sorted.forEach(task => {
                const p = task.priority || 'none';
                if (buckets[p]) buckets[p].push(task);
                else buckets['none'].push(task);
            });

            return Object.entries(buckets).map(([priority, bucketTasks]) => {
                if (bucketTasks.length === 0) return null;
                const label = priority === 'none' ? 'No Priority' : priority;
                const color = priority === 'critical' || priority === 'high' ? 'var(--accent-danger)' : 'var(--text-secondary)';

                return (
                    <div key={priority} style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '12px', color: color, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                            {label} <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '10px', fontSize: '10px', color: 'var(--text-primary)' }}>{bucketTasks.length}</span>
                        </h3>
                        {bucketTasks.map(task => (
                            <TaskItem
                                key={`priority-${priority}-${task.id}`}
                                task={task}
                                toggleTask={onToggleTask}
                                setEditingTask={setEditingTask}
                                handleSetReminder={handleSetReminder}
                                handleDismissReminder={handleDismissReminder}
                                onDeleteTask={onDeleteTask}
                                getPriorityColor={getPriorityColor}
                                formatTimestamp={formatTimestamp}
                                handleSetFocus={handleSetFocus}
                                onUpdateTask={onUpdateTask}
                            />
                        ))}
                    </div>
                );
            });
        } else if (groupBy === 'date') {
            const buckets = { 'Today': [], 'Next 3 Days': [], 'Next Week': [], 'Upcoming': [], 'No Date': [] };
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            sorted.forEach(task => {
                if (!task.dueDate) { buckets['No Date'].push(task); return; }
                const dueDate = new Date(task.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                const diffTime = dueDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays <= 0) buckets['Today'].push(task);
                else if (diffDays <= 3) buckets['Next 3 Days'].push(task);
                else if (diffDays <= 7) buckets['Next Week'].push(task);
                else buckets['Upcoming'].push(task);
            });

            return Object.entries(buckets).map(([bucket, bucketTasks]) => {
                if (bucketTasks.length === 0) return null;
                return (
                    <div key={bucket} style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '12px', color: bucket === 'Today' ? 'var(--accent-primary)' : 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                            {bucket} <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>{bucketTasks.length}</span>
                        </h3>
                        {bucketTasks.map(task => (
                            <TaskItem
                                key={`date-${bucket}-${task.id}`}
                                task={task}
                                toggleTask={onToggleTask}
                                setEditingTask={setEditingTask}
                                handleSetReminder={handleSetReminder}
                                handleDismissReminder={handleDismissReminder}
                                onDeleteTask={onDeleteTask}
                                getPriorityColor={getPriorityColor}
                                formatTimestamp={formatTimestamp}
                                handleSetFocus={handleSetFocus}
                                onUpdateTask={onUpdateTask}
                            />
                        ))}
                    </div>
                );
            });
        } else if (groupBy === 'project') {
            return renderGroupedTasks(sorted, 'project', t => t.project, 'No Project');
        } else if (groupBy === 'assignee') {
            return renderGroupedTasks(sorted, 'assignee', t => t.assignee, 'Unassigned');
        }

        // Default list
        return sorted.map(task => (
            <TaskItem
                key={task.id}
                task={task}
                toggleTask={onToggleTask}
                setEditingTask={setEditingTask}
                handleSetReminder={handleSetReminder}
                handleDismissReminder={handleDismissReminder}
                onDeleteTask={onDeleteTask}
                getPriorityColor={getPriorityColor}
                formatTimestamp={formatTimestamp}
                handleSetFocus={handleSetFocus}
                onUpdateTask={onUpdateTask}
            />
        ));
    };

    return (
        <div className="glass-panel" style={{ padding: '20px', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <span>{icon}</span> {title}
                    <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                        {count}
                    </span>
                </h2>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {['all', 'todo', 'focus', 'tomorrow', 'horizon', 'completed'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setViewFilter(filter)}
                            style={{
                                padding: '4px 8px',
                                fontSize: '10px',
                                borderRadius: '4px',
                                border: 'none',
                                background: viewFilter === filter ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                                color: viewFilter === filter ? 'white' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                textTransform: 'capitalize'
                            }}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FunnyTooltip context="sort">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'var(--text-secondary)',
                                fontSize: '10px',
                                padding: '4px',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="smart">Sort: Smart</option>
                            <option value="priority">Sort: Priority</option>
                            <option value="due_date">Sort: Due Date</option>
                            <option value="date_added">Sort: Added</option>
                        </select>
                    </FunnyTooltip>

                    <FunnyTooltip context="group">
                        <select
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value)}
                            style={{
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'var(--text-secondary)',
                                fontSize: '10px',
                                padding: '4px',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="none">Group: None</option>
                            <option value="priority">Group: Priority</option>
                            <option value="tags">Group: Tags</option>
                            <option value="date">Group: Date</option>
                            <option value="project">Group: Project</option>
                            <option value="assignee">Group: Assignee</option>
                        </select>
                    </FunnyTooltip>
                </div>
            </div>

            {renderTaskList(tasks)}
        </div>
    );
};

export default TaskSection;
