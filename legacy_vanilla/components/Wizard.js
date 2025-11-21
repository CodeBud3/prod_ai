import { store } from '../store.js';

export function renderWizard(container, onComplete) {
    let step = 1;
    let data = {
        name: '',
        role: '',
        rawTasks: '',
        gamification: false,
        focusMode: false
    };

    function render() {
        container.innerHTML = `
            <div class="glass-panel fade-in" style="max-width: 600px; width: 100%; padding: 40px;">
                ${renderStep()}
            </div>
        `;

        // Bind events
        const nextBtn = container.querySelector('#nextBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', handleNext);
        }

        const inputs = container.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                data[e.target.name] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
            });
        });
    }

    function renderStep() {
        if (step === 1) {
            return `
                <h2 style="margin-bottom: 24px;">Welcome to ProdAI</h2>
                <p style="color: var(--text-secondary); margin-bottom: 32px;">Let's get to know you to optimize your workflow.</p>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">What should we call you?</label>
                    <input type="text" name="name" value="${data.name}" placeholder="e.g. Alex" autofocus>
                </div>
                
                <div style="margin-bottom: 32px;">
                    <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">What is your primary role?</label>
                    <input type="text" name="role" value="${data.role}" placeholder="e.g. Product Manager, Developer, Student">
                </div>
                
                <div style="text-align: right;">
                    <button id="nextBtn" class="btn-primary">Next Step →</button>
                </div>
            `;
        }

        if (step === 2) {
            return `
                <h2 style="margin-bottom: 24px;">Brain Dump</h2>
                <p style="color: var(--text-secondary); margin-bottom: 32px;">Clear your mind. List everything you need to do right now. Don't worry about order.</p>
                
                <div style="margin-bottom: 32px;">
                    <textarea name="rawTasks" rows="8" placeholder="- Finish the report&#10;- Email Sarah&#10;- Buy groceries">${data.rawTasks}</textarea>
                </div>
                
                <div style="text-align: right;">
                    <button id="nextBtn" class="btn-primary">Next Step →</button>
                </div>
            `;
        }

        if (step === 3) {
            return `
                <h2 style="margin-bottom: 24px;">Preferences</h2>
                <p style="color: var(--text-secondary); margin-bottom: 32px;">Customize your experience.</p>
                
                <div style="margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; padding: 16px; background: rgba(255,255,255,0.05); border-radius: var(--radius-md);">
                    <div>
                        <h3 style="font-size: 16px; margin-bottom: 4px;">Gamification</h3>
                        <p style="font-size: 12px; color: var(--text-secondary);">Earn XP and maintain streaks.</p>
                    </div>
                    <label class="switch">
                        <input type="checkbox" name="gamification" ${data.gamification ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div style="margin-bottom: 32px; display: flex; align-items: center; justify-content: space-between; padding: 16px; background: rgba(255,255,255,0.05); border-radius: var(--radius-md);">
                    <div>
                        <h3 style="font-size: 16px; margin-bottom: 4px;">Focus Mode</h3>
                        <p style="font-size: 12px; color: var(--text-secondary);">Hide everything except your top priority.</p>
                    </div>
                    <label class="switch">
                        <input type="checkbox" name="focusMode" ${data.focusMode ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div style="text-align: right;">
                    <button id="nextBtn" class="btn-primary">Initialize ProdAI</button>
                </div>
            `;
        }
    }

    function handleNext() {
        if (step < 3) {
            step++;
            render();
        } else {
            finish();
        }
    }

    function finish() {
        // Process tasks (simple split by newline for now)
        const tasks = data.rawTasks.split('\n').filter(t => t.trim()).map(t => ({
            id: Date.now() + Math.random(),
            title: t.replace(/^- /, '').trim(),
            status: 'todo',
            quadrant: null // To be filled by AI
        }));

        store.updateUser({
            name: data.name,
            role: data.role,
            onboarded: true,
            preferences: {
                gamification: data.gamification,
                focusMode: data.focusMode
            }
        });

        store.setTasks(tasks);

        onComplete();
    }

    render();
}
