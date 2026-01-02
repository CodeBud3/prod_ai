import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { signIn, signUp, signInWithGoogle, setGuest, clearError } from '../authSlice';
import { selectAuthLoading, selectAuthError, selectIsSupabaseAvailable, selectNeedsEmailVerification, selectIsAuthenticated } from '../authSelectors';

export function AuthModal({ isOpen, onClose }) {
    const dispatch = useDispatch();
    const loading = useSelector(selectAuthLoading);
    const error = useSelector(selectAuthError);
    const isSupabaseAvailable = useSelector(selectIsSupabaseAvailable);
    const needsVerification = useSelector(selectNeedsEmailVerification);
    const isAuthenticated = useSelector(selectIsAuthenticated);

    const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Auto-close modal when user becomes authenticated
    useEffect(() => {
        if (isAuthenticated && isOpen) {
            onClose();
        }
    }, [isAuthenticated, isOpen, onClose]);

    const handleSignIn = async (e) => {
        e.preventDefault();
        if (!email || !password) return;

        const result = await dispatch(signIn({ email, password }));
        // Check if the action was fulfilled (not rejected)
        if (signIn.fulfilled.match(result)) {
            onClose();
        }
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        if (!email || !password || !name) return;
        if (password !== confirmPassword) {
            return; // Show error
        }

        const result = await dispatch(signUp({ email, password, name }));
        if (signUp.fulfilled.match(result) && !needsVerification) {
            onClose();
        }
    };

    const handleGoogleSignIn = () => {
        dispatch(signInWithGoogle());
    };

    const handleContinueAsGuest = () => {
        dispatch(setGuest());
        onClose();
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        dispatch(clearError());
    };

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                style={{
                    background: 'linear-gradient(135deg, rgba(30, 32, 40, 0.98), rgba(20, 22, 28, 0.98))',
                    borderRadius: '20px',
                    padding: '40px',
                    width: '100%',
                    maxWidth: '420px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
                        {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {mode === 'signin'
                            ? 'Sign in to sync across devices'
                            : 'Start your productivity journey'}
                    </p>
                </div>

                {/* Verification Message */}
                {needsVerification && (
                    <div style={{
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '20px',
                        textAlign: 'center'
                    }}>
                        <span style={{ fontSize: '24px', marginBottom: '8px', display: 'block' }}>📧</span>
                        <p style={{ color: '#60a5fa', fontSize: '14px' }}>
                            Check your email to verify your account
                        </p>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        marginBottom: '20px',
                        color: '#f87171',
                        fontSize: '13px'
                    }}>
                        {error}
                    </div>
                )}

                {!isSupabaseAvailable && (
                    <div style={{
                        background: 'rgba(251, 191, 36, 0.15)',
                        border: '1px solid rgba(251, 191, 36, 0.3)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '20px',
                        textAlign: 'center'
                    }}>
                        <span style={{ fontSize: '20px', marginRight: '8px' }}>⚠️</span>
                        <span style={{ color: '#fbbf24', fontSize: '13px' }}>
                            Cloud sync not configured. Please set up Supabase credentials.
                        </span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}>
                    {mode === 'signup' && (
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Your Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '15px',
                                    boxSizing: 'border-box'
                                }}
                                required
                            />
                        </div>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '15px',
                                boxSizing: 'border-box'
                            }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: mode === 'signup' ? '16px' : '24px' }}>
                        <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '15px',
                                boxSizing: 'border-box'
                            }}
                            required
                            minLength={6}
                        />
                    </div>

                    {mode === 'signup' && (
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: password && confirmPassword && password !== confirmPassword
                                        ? '1px solid #ef4444'
                                        : '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '15px',
                                    boxSizing: 'border-box'
                                }}
                                required
                            />
                            {password && confirmPassword && password !== confirmPassword && (
                                <p style={{ color: '#f87171', fontSize: '12px', marginTop: '6px' }}>
                                    Passwords don't match
                                </p>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !isSupabaseAvailable}
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            border: 'none',
                            borderRadius: '12px',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: 600,
                            cursor: loading || !isSupabaseAvailable ? 'not-allowed' : 'pointer',
                            opacity: loading || !isSupabaseAvailable ? 0.6 : 1,
                            transition: 'all 0.2s'
                        }}
                    >
                        {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
                    <span style={{ padding: '0 16px', color: 'var(--text-muted)', fontSize: '12px' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
                </div>

                {/* Google Sign In */}
                {/* Google Sign In - Coming Soon */}
                <button
                    disabled={true}
                    style={{
                        width: '100%',
                        padding: '14px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: 'var(--text-muted)',
                        fontSize: '15px',
                        fontWeight: 500,
                        cursor: 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        opacity: 0.5,
                        marginBottom: '16px'
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google (Coming Soon)
                </button>

                {/* Continue as Guest */}
                <button
                    onClick={handleContinueAsGuest}
                    style={{
                        width: '100%',
                        padding: '14px',
                        background: 'transparent',
                        border: '1px dashed rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        color: 'var(--text-secondary)',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    Continue as Guest (data stays on this device)
                </button>

                {/* Mode Switch */}
                <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    {mode === 'signin' ? (
                        <>
                            Don't have an account?{' '}
                            <button
                                onClick={() => switchMode('signup')}
                                style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontWeight: 500 }}
                            >
                                Sign Up
                            </button>
                        </>
                    ) : (
                        <>
                            Already have an account?{' '}
                            <button
                                onClick={() => switchMode('signin')}
                                style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontWeight: 500 }}
                            >
                                Sign In
                            </button>
                        </>
                    )}
                </p>
            </div>
        </div>
    );
}
