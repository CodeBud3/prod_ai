import React, { useEffect, useState } from 'react';

export function MotivationalPopup({ message, onComplete }) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onComplete, 300); // Wait for fade out
        }, 2000); // Show for 2 seconds

        return () => clearTimeout(timer);
    }, [onComplete]);

    if (!message) return null;

    return (
        <div style={{
            position: 'absolute',
            left: '0', // Align with checkbox
            top: '-25px', // Above checkbox
            background: 'linear-gradient(135deg, #c084fc, #ec4899)', // Purple to Pink
            color: '#fff',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '800',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 100,
            pointerEvents: 'none',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.8)',
            transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Bouncy
            whiteSpace: 'nowrap',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.2)'
        }}>
            {message}
        </div>
    );
}
