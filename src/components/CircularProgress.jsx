import React, { useState, useEffect } from 'react';

export function CircularProgress({ startTime, endTime, size = 24 }) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const updateProgress = () => {
            const now = Date.now();
            const total = endTime - startTime;
            const elapsed = now - startTime;
            const percent = Math.min((elapsed / total) * 100, 100);
            setProgress(percent);

            if (percent >= 100) {
                clearInterval(interval);
            }
        };

        updateProgress();
        const interval = setInterval(updateProgress, 100);

        return () => clearInterval(interval);
    }, [startTime, endTime]);

    const radius = (size - 4) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div style={{ position: 'relative', width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="2"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="var(--accent-primary)"
                    strokeWidth="2"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                />
            </svg>
        </div>
    );
}
