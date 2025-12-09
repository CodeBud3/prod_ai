import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../userSelectors';
import { updateName, updateRole } from '../userSlice';

export function UserSettingsModal({ onClose }) {
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const [name, setName] = useState(user.name || '');
    const [role, setRole] = useState(user.role || '');

    useEffect(() => {
        setName(user.name || '');
        setRole(user.role || '');
    }, [user]);

    const handleSave = () => {
        if (name.trim()) {
            dispatch(updateName(name.trim()));
        }
        if (role.trim()) {
            dispatch(updateRole(role.trim()));
        }
        onClose();
    };

    const roles = [
        { id: 'founder', label: 'Founder / CEO', emoji: '👑' },
        { id: 'executive', label: 'Executive / Director', emoji: '📊' },
        { id: 'manager', label: 'Manager / Team Lead', emoji: '👔' },
        { id: 'individual', label: 'Individual Contributor', emoji: '💻' },
        { id: 'freelancer', label: 'Freelancer / Solopreneur', emoji: '🚀' },
        { id: 'student', label: 'Student', emoji: '📚' },
        { id: 'other', label: 'Other', emoji: '✨' }
    ];

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                animation: 'fadeIn 0.2s ease'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%)',
                    borderRadius: '16px',
                    padding: '32px',
                    maxWidth: '450px',
                    width: '90%',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '22px', color: 'white', margin: 0 }}>
                        ⚙️ Settings
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'rgba(255,255,255,0.5)',
                            fontSize: '20px',
                            cursor: 'pointer'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Name Input */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                        Your Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'white',
                            fontSize: '16px',
                            outline: 'none'
                        }}
                    />
                </div>

                {/* Role Selection */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                        Your Role
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {roles.map(r => (
                            <button
                                key={r.id}
                                type="button"
                                onClick={() => setRole(r.id)}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    background: role === r.id
                                        ? 'linear-gradient(135deg, var(--accent-primary) 0%, #7c3aed 100%)'
                                        : 'rgba(255,255,255,0.08)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    transition: 'all 0.2s',
                                    boxShadow: role === r.id
                                        ? '0 4px 15px rgba(139, 92, 246, 0.3)'
                                        : 'none'
                                }}
                            >
                                {r.emoji} {r.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'transparent',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!name.trim()}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '10px',
                            border: 'none',
                            background: 'linear-gradient(135deg, var(--accent-primary) 0%, #7c3aed 100%)',
                            color: 'white',
                            cursor: name.trim() ? 'pointer' : 'not-allowed',
                            fontSize: '14px',
                            fontWeight: 600,
                            opacity: name.trim() ? 1 : 0.5
                        }}
                    >
                        Save Changes
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
