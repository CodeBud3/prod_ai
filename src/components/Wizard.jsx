import React, { useState } from 'react';

export function Wizard({ onComplete }) {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({
        name: '',
        role: '',
        rawTasks: '',
        gamification: false,
        focusMode: false
    });

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setData({ ...data, [e.target.name]: value });
    };

    const handleNext = () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            finish();
        }
    };

    const finish = () => {
        const tasks = data.rawTasks.split('\n').filter(t => t.trim()).map(t => ({
            id: Date.now() + Math.random(),
            title: t.replace(/^- /, '').trim(),
            status: 'todo',
            quadrant: null
        }));

        onComplete({
            user: {
                name: data.name,
                role: data.role,
                onboarded: true,
                preferences: {
                    gamification: data.gamification,
                    focusMode: data.focusMode
                }
            },
            tasks
        });
    };

    return (
        <div className="glass-panel fade-in" style={{ maxWidth: '600px', width: '100%', padding: '40px' }}>
            {step === 1 && (
                <>
                    <h2 style={{ marginBottom: '24px' }}>Welcome to ProdAI</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Let's get to know you to optimize your workflow.</p>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>What should we call you?</label>
                        <input type="text" name="name" value={data.name} onChange={handleChange} placeholder="e.g. Alex" autoFocus />
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>What is your primary role?</label>
                        <input type="text" name="role" value={data.role} onChange={handleChange} placeholder="e.g. Product Manager, Developer, Student" />
                    </div>
                </>
            )}

            {step === 2 && (
                <>
                    <h2 style={{ marginBottom: '24px' }}>Brain Dump</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Clear your mind. List everything you need to do right now. Don't worry about order.</p>

                    <div style={{ marginBottom: '32px' }}>
                        <textarea name="rawTasks" rows="8" value={data.rawTasks} onChange={handleChange} placeholder="- Finish the report&#10;- Email Sarah&#10;- Buy groceries" />
                    </div>
                </>
            )}

            {step === 3 && (
                <>
                    <h2 style={{ marginBottom: '24px' }}>Preferences</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Customize your experience.</p>

                    <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)' }}>
                        <div>
                            <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>Gamification</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Earn XP and maintain streaks.</p>
                        </div>
                        <label className="switch">
                            <input type="checkbox" name="gamification" checked={data.gamification} onChange={handleChange} />
                            <span className="slider"></span>
                        </label>
                    </div>

                    <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)' }}>
                        <div>
                            <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>Focus Mode</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Hide everything except your top priority.</p>
                        </div>
                        <label className="switch">
                            <input type="checkbox" name="focusMode" checked={data.focusMode} onChange={handleChange} />
                            <span className="slider"></span>
                        </label>
                    </div>
                </>
            )}

            <div style={{ textAlign: 'right' }}>
                <button onClick={handleNext} className="btn-primary">
                    {step < 3 ? 'Next Step →' : 'Initialize ProdAI'}
                </button>
            </div>
        </div>
    );
}
