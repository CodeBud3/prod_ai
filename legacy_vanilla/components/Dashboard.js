import { store } from '../store.js';
import { AiEngine } from '../services/AiEngine.js';

export async function renderDashboard(container) {
    const user = store.getUser();
    let plan = store.getPlan();
    let tasks = store.getTasks();

    // If no plan exists, generate one
    if (!plan && tasks.length > 0) {
        container.innerHTML = `
            <div class="glass-panel fade-in" style="padding: 40px; text-align: center;">
                <h2 style="margin-bottom: 16px;">Analyzing your workload...</h2>
                <div class="loader"></div> 
                <p style="color: var(--text-secondary);">Applying ${user.role} context...</p>
            </div>
        `;

        plan = await AiEngine.generatePlan(tasks, user.role);
        store.setPlan(plan);
        store.setTasks(plan.tasks); // Update tasks with metadata
    }

    renderMainView(container, plan, user);
}

function renderMainView(container, plan, user) {
    const isFocusMode = user.preferences.focusMode;
    const currentTask = plan.tasks.find(t => t.status !== 'done');

    if (isFocusMode && currentTask) {
        renderFocusMode(container, currentTask);
    } else {
        renderListView(container, plan, user);
    }
}

function renderFocusMode(container, task) {
    container.innerHTML = `
        <div class="glass-panel fade-in" style="padding: 60px; text-align: center; max-width: 800px; width: 100%;">
            <div style="margin-bottom: 24px; color: var(--accent-primary); font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">
                Current Focus
            </div>
            
            <h1 style="font-size: 48px; margin-bottom: 40px; line-height: 1.2;">
                ${task.title}
            </h1>
            
            <div style="display: flex; justify-content: center; gap: 20px;">
                <button id="completeBtn" class="btn-primary" style="font-size: 18px; padding: 16px 32px;">
                    Mark Complete
                </button>
                <button id="exitFocusBtn" class="btn-secondary">
                    Exit Focus
                </button>
            </div>
        </div>
    `;

    container.querySelector('#completeBtn').addEventListener('click', () => {
        completeTask(task.id);
        renderDashboard(container);
    });

    container.querySelector('#exitFocusBtn').addEventListener('click', () => {
        toggleFocusMode(false);
        renderDashboard(container);
    });
}

function renderListView(container, plan, user) {
    const tasksHtml = plan.tasks.map(task => `
        <div class="task-item ${task.status === 'done' ? 'done' : ''}" style="
            display: flex; 
            align-items: center; 
            padding: 16px; 
            background: rgba(255,255,255,0.03); 
            margin-bottom: 8px; 
            border-radius: var(--radius-md);
            border-left: 4px solid ${getQuadrantColor(task.quadrant)};
        ">
            <input type="checkbox" ${task.status === 'done' ? 'checked' : ''} 
                onchange="window.handleTaskToggle(${task.id})"
                style="width: 20px; height: 20px; margin-right: 16px; cursor: pointer;">
            
            <div style="flex: 1;">
                <div style="font-weight: 500; ${task.status === 'done' ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">
                    ${task.title}
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                    ${task.quadrant.toUpperCase()} • Score: ${task.score}
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <div style="width: 100%; max-width: 800px; padding: 20px;">
            <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;">
                <div>
                    <h1 style="font-size: 24px; margin-bottom: 4px;">Good Morning, ${user.name}</h1>
                    <p style="color: var(--text-secondary);">${plan.summary}</p>
                </div>
                <button id="enterFocusBtn" class="btn-primary">
                    Enter Focus Mode
                </button>
            </header>
            
            <div class="task-list">
                ${tasksHtml}
            </div>
        </div>
    `;

    // Global handler for checkbox (simplification for vanilla JS event delegation)
    window.handleTaskToggle = (id) => {
        completeTask(id);
        renderDashboard(container);
    };

    container.querySelector('#enterFocusBtn').addEventListener('click', () => {
        toggleFocusMode(true);
        renderDashboard(container);
    });
}

function getQuadrantColor(q) {
    switch (q) {
        case 'do': return 'var(--accent-danger)';
        case 'decide': return 'var(--accent-primary)';
        case 'delegate': return 'var(--accent-warning)';
        default: return 'var(--text-muted)';
    }
}

function completeTask(id) {
    const tasks = store.getTasks();
    const task = tasks.find(t => t.id === id); // Note: id might be number or string depending on generation
    // Loose comparison for ID safety
    const target = tasks.find(t => t.id == id);
    if (target) {
        target.status = target.status === 'done' ? 'todo' : 'done';
        store.setTasks(tasks);
        // Update plan as well
        const plan = store.getPlan();
        const planTask = plan.tasks.find(t => t.id == id);
        if (planTask) planTask.status = target.status;
        store.setPlan(plan);
    }
}

function toggleFocusMode(active) {
    store.updateUser({ preferences: { ...store.getUser().preferences, focusMode: active } });
}
