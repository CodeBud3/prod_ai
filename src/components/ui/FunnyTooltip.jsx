import React, { useState, useEffect, useRef } from 'react';

export function FunnyTooltip({ children, id, context = 'default', type = 'default' }) {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const timerRef = useRef(null);
    const tooltipRef = useRef(null);

    const messages = {
        delete: [
            "Gone forever!",
            "Hasta la vista!",
            "Into the void!",
            "No regrets?",
            "Bye bye task!",
            "Cleaning up?",
            "Poof! ✨"
        ],
        edit: [
            "Fixing typos?",
            "Change of plans?",
            "Pivot!",
            "Refining perfection?",
            "Make it better!",
            "Rewriting history?"
        ],
        focus: [
            "Eyes on the prize!",
            "Laser mode activated!",
            "Zone in!",
            "Distraction free!",
            "One thing at a time."
        ],
        reminder: [
            "Don't forget!",
            "I'll bug you later!",
            "Memory aid!",
            "Ping me!",
            "Future you says thanks!"
        ],
        add: [
            "More work?",
            "The list grows...",
            "Do it!",
            "Productivity +1",
            "Let's get it done!"
        ],
        sort: [
            "Order in the court!",
            "Shuffle time!",
            "Organize chaos!",
            "Sorting hat says..."
        ],
        group: [
            "Squad goals!",
            "Categorize me!",
            "Birds of a feather...",
            "Grouping logic!"
        ],
        theme: [
            "Mood lighting?",
            "Switch it up!",
            "Fresh look!",
            "Vibe check!"
        ],
        default: [
            "Click me!",
            "I do things!",
            "Why are you hovering?",
            "Waiting for click..."
        ]
    };

    const handleMouseEnter = () => {
        timerRef.current = setTimeout(() => {
            const pool = messages[context] || messages.default;
            const randomMsg = pool[Math.floor(Math.random() * pool.length)];
            setMessage(randomMsg);
            setVisible(true);
        }, 1000); // 1 second delay for "long hover"
    };

    const handleMouseLeave = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setVisible(false);
    };

    return (
        <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ position: 'relative', display: 'inline-flex' }}
        >
            {children}
            {visible && (
                <div
                    ref={tooltipRef}
                    className="funny-tooltip fade-in"
                    style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginBottom: '8px',
                        background: 'rgba(0, 0, 0, 0.8)',
                        color: 'white',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                        zIndex: 1000,
                        pointerEvents: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(4px)'
                    }}
                >
                    {message}
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        marginLeft: '-4px',
                        borderWidth: '4px',
                        borderStyle: 'solid',
                        borderColor: 'rgba(0, 0, 0, 0.8) transparent transparent transparent'
                    }} />
                </div>
            )}
        </div>
    );
}
