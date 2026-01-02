import React, { useState } from 'react';

export function Wizard({ onComplete }) {
    const [name, setName] = useState('');

    const finish = () => {
        if (!name.trim()) return;

        onComplete({
            user: {
                name,
                role: 'Explorer', // Default role since we aren't asking
                onboarded: true,
                preferences: {
                    gamification: false, // Default off
                    focusMode: false     // Default off
                }
            },
            tasks: [] // No initial tasks
        });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            finish();
        }
    };

    return (
        <div className="glass-panel fade-in" style={{ maxWidth: '600px', width: '100%', padding: '40px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '24px', fontSize: '32px' }}>Welcome to ProdAI</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '18px' }}>
                Your personal AI-enhanced productivity workspace.
            </p>

            <div style={{ marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px' }}>
                <label style={{ display: 'block', marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    What should we call you?
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter your name"
                    autoFocus
                    style={{
                        textAlign: 'center',
                        fontSize: '24px',
                        padding: '16px',
                        width: '100%',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        outline: 'none',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                />
            </div>

            <button
                onClick={finish}
                className="btn-primary"
                disabled={!name.trim()}
                style={{
                    padding: '16px 40px',
                    fontSize: '18px',
                    borderRadius: '16px'
                }}
            >
                Get Started →
            </button>
        </div>
    );
}
