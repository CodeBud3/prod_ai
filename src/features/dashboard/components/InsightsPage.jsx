import React from 'react';
import { useSelector } from 'react-redux';
import { selectAllTasks } from '../../tasks/tasksSelectors';
import { ActivityChart } from './widgets/ActivityChart';
import { TaskProgressCard } from './widgets/TaskProgressCard';
import { WeeklyProgressRing } from './widgets/WeeklyProgressRing';
import { PriorityStatsCard } from './widgets/PriorityStatsCard';
import { MonthlyTaskHeatmap } from './widgets/MonthlyTaskHeatmap';

export function InsightsPage({ onBack }) {
    const tasks = useSelector(selectAllTasks);

    // Calculate today's tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todaysTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= today && dueDate <= todayEnd;
    });

    const completedToday = todaysTasks.filter(t => t.status === 'done').length;
    const totalToday = todaysTasks.length || 1;

    // Calculate weekly stats
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weeklyTasks = tasks.filter(task => {
        const created = new Date(task.createdAt);
        return created >= weekStart;
    });

    const weeklyCompleted = weeklyTasks.filter(t => t.status === 'done').length;
    const weeklyTotal = weeklyTasks.length || 1;

    // Category breakdown
    const categoryStats = {
        work: tasks.filter(t => t.category === 'work'),
        personal: tasks.filter(t => t.category === 'personal'),
        errands: tasks.filter(t => t.category === 'errands')
    };

    return (
        <div className="fade-in" style={{
            padding: '32px',
            maxWidth: '1200px',
            margin: '0 auto'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px'
            }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>
                        📊 Insights
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Your productivity at a glance
                    </p>
                </div>
                {/* Back button removed as we will have top-level toggle in Dashboard */}
            </div>

            {/* Widget Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '24px'
            }}>
                {/* Top Left: Activity Chart (Real Data) */}
                <ActivityChart tasks={tasks} />

                {/* Top Middle: Task Progress */}
                <TaskProgressCard
                    tasks={todaysTasks}
                    completed={completedToday}
                    total={totalToday}
                />

                {/* Top Right: Monthly Heatmap */}
                <MonthlyTaskHeatmap tasks={tasks} />

                {/* Bottom Left: Weekly Progress */}
                <WeeklyProgressRing
                    categoryStats={categoryStats}
                    weeklyCompleted={weeklyCompleted}
                    weeklyTotal={weeklyTotal}
                />

                {/* Bottom Middle: Priority Stats */}
                <PriorityStatsCard
                    tasks={tasks}
                />
            </div>
        </div>
    );
}
