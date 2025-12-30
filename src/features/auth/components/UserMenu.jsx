import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { signOut } from '../authSlice';
import { selectIsAuthenticated, selectIsGuest, selectAuthUser, selectIsSupabaseAvailable } from '../authSelectors';

export function UserMenu({ onSignInClick }) {
    const dispatch = useDispatch();
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const isGuest = useSelector(selectIsGuest);
    const user = useSelector(selectAuthUser);
    const isSupabaseAvailable = useSelector(selectIsSupabaseAvailable);

    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await dispatch(signOut());
        setIsOpen(false);
    };

    // Get user display info
    const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
    const displayEmail = user?.email;
    const avatarLetter = displayName.charAt(0).toUpperCase();

    // If guest mode and no Supabase, just show guest indicator but allow clicking to see setup info
    if (isGuest && !isSupabaseAvailable) {
        return (
            <button
                onClick={onSignInClick}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
                title="Click to set up cloud sync"
            >
                <span>👤</span>
                <span>Guest Mode</span>
            </button>
        );
    }

    // If guest, show sign in button
    if (isGuest) {
        return (
            <button
                onClick={onSignInClick}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                Sign In
            </button>
        );
    }

    // Authenticated user menu
    return (
        <div ref={menuRef} style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                {/* Avatar */}
                <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 600
                }}>
                    {avatarLetter}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>{displayName}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.6 }}>
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    minWidth: '220px',
                    background: 'rgba(30, 32, 40, 0.98)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '8px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                    zIndex: 1000
                }}>
                    {/* User Info */}
                    <div style={{
                        padding: '12px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        marginBottom: '8px'
                    }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '2px' }}>
                            {displayName}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {displayEmail}
                        </div>
                    </div>

                    {/* Sync Status */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 12px',
                        fontSize: '13px',
                        color: '#34d399'
                    }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399' }} />
                        Synced to cloud
                    </div>

                    {/* Sign Out */}
                    <button
                        onClick={handleSignOut}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#f87171',
                            fontSize: '13px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s'
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
}
