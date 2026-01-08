import React, { useState, useEffect } from 'react';

const formatPreview = (timestamp) => {
    if (!timestamp) return 'Not set';
    const d = new Date(timestamp);
    return d.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

export function DateTimePicker({ value, onChange, onClear, label = 'Select Date & Time', defaultExpanded = false }) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded || !!value);
    const [selectedDate, setSelectedDate] = useState(() => value ? new Date(value) : null);
    const [currentMonth, setCurrentMonth] = useState(() => {
        const d = value ? new Date(value) : new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });
    const [timeInput, setTimeInput] = useState(() => {
        if (!value) return '17:30'; // Default to 5:30 PM EOD
        const d = new Date(value);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    });

    // Sync internal state when external value changes
    useEffect(() => {
        if (value) {
            const d = new Date(value);
            setSelectedDate(d);
            setTimeInput(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
        } else {
            setSelectedDate(null);
            setTimeInput('17:30'); // Default to 5:30 PM EOD
        }
    }, [value]);

    const emitChange = (date, time) => {
        if (!date) return;
        const [hours, minutes] = time.split(':').map(Number);
        const newDate = new Date(date);
        newDate.setHours(hours || 0, minutes || 0, 0, 0);
        onChange(newDate.getTime());
    };

    // Quick date handlers
    const setToday = () => {
        const today = new Date();
        setSelectedDate(today);
        setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
        emitChange(today, timeInput);
    };

    const setTomorrow = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setSelectedDate(tomorrow);
        setCurrentMonth(new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 1));
        emitChange(tomorrow, timeInput);
    };

    const setNextWeek = () => {
        const next = new Date();
        const daysUntilMonday = (8 - next.getDay()) % 7 || 7;
        next.setDate(next.getDate() + daysUntilMonday);
        setSelectedDate(next);
        setCurrentMonth(new Date(next.getFullYear(), next.getMonth(), 1));
        emitChange(next, timeInput);
    };

    // Helper to get friendly date label
    const getDateContextLabel = (date) => {
        if (!date) return null;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date(today);
        dayAfter.setDate(dayAfter.getDate() + 2);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const [hours] = timeInput.split(':').map(Number);

        // Time context
        let timeContext = '';
        if (hours >= 5 && hours < 12) timeContext = 'Morning';
        else if (hours >= 12 && hours < 17) timeContext = 'Afternoon';
        else if (hours >= 17 && hours < 21) timeContext = 'EOD';
        else timeContext = 'Evening';

        // Date context
        if (targetDate.getTime() === today.getTime()) {
            return `Today ${timeContext}`;
        } else if (targetDate.getTime() === tomorrow.getTime()) {
            return `Tomorrow ${timeContext}`;
        } else if (targetDate.getTime() === dayAfter.getTime()) {
            return `Day After ${timeContext}`;
        } else {
            // Check for next Monday
            const dayOfWeek = targetDate.getDay();
            const daysFromNow = Math.floor((targetDate - today) / (1000 * 60 * 60 * 24));
            if (dayOfWeek === 1 && daysFromNow <= 7) {
                return `Next Monday ${timeContext}`;
            }
            // Show day name if within a week
            if (daysFromNow <= 7) {
                const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
                return `${dayName} ${timeContext}`;
            }
        }
        return null;
    };

    // Quick time handlers
    const setQuickTime = (hours) => {
        const newTime = `${String(hours).padStart(2, '0')}:00`;
        setTimeInput(newTime);
        if (selectedDate) {
            emitChange(selectedDate, newTime);
        }
    };

    const handleTimeChange = (e) => {
        const newTime = e.target.value;
        setTimeInput(newTime);
        if (selectedDate && newTime.match(/^\d{2}:\d{2}$/)) {
            emitChange(selectedDate, newTime);
        }
    };

    // Calendar helpers
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const days = [];

        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({ day: daysInPrevMonth - i, isCurrentMonth: false, date: new Date(year, month - 1, daysInPrevMonth - i) });
        }

        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
        }

        const remaining = 35 - days.length;
        for (let i = 1; i <= remaining && i <= 7; i++) {
            days.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
        }

        return days;
    };

    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    const selectDay = (dayObj) => {
        setSelectedDate(dayObj.date);
        if (!dayObj.isCurrentMonth) {
            setCurrentMonth(new Date(dayObj.date.getFullYear(), dayObj.date.getMonth(), 1));
        }
        emitChange(dayObj.date, timeInput);
    };

    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    };

    const isSelected = (date) => {
        if (!selectedDate) return false;
        return date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear();
    };

    const days = getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    const buttonStyle = {
        background: 'rgba(255,255,255,0.1)',
        border: 'none',
        borderRadius: '6px',
        padding: '6px 12px',
        fontSize: '11px',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'all 0.2s'
    };

    const activeButtonStyle = {
        ...buttonStyle,
        background: 'var(--accent-primary)',
        color: 'white'
    };

    const currentHour = parseInt(timeInput.split(':')[0]);

    // Collapsed view - just a clickable summary
    if (!isExpanded) {
        return (
            <div
                onClick={() => setIsExpanded(true)}
                style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'background 0.2s'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px' }}>📅</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: value ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                        {value ? formatPreview(value) : 'Not set'}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>▼</span>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '16px'
        }}>
            {/* Header */}
            <div
                onClick={() => setIsExpanded(false)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', cursor: 'pointer' }}
            >
                <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                    📅 {label}
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {value && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onClear(); }}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '10px', cursor: 'pointer' }}
                        >
                            Clear
                        </button>
                    )}
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>▲</span>
                </div>
            </div>

            {/* Quick Date Buttons */}
            <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>QUICK DATE</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={setToday} style={buttonStyle}>Today</button>
                    <button type="button" onClick={setTomorrow} style={buttonStyle}>Tomorrow</button>
                    <button type="button" onClick={setNextWeek} style={buttonStyle}>Next Week</button>
                </div>
            </div>

            {/* Quick Time Buttons */}
            <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>QUICK TIME</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                        { h: 9, label: '9 AM' },
                        { h: 12, label: '12 PM' },
                        { h: 17, m: 30, label: 'EOD' },
                        { h: 21, label: '9 PM' }
                    ].map(({ h, m = 0, label }) => {
                        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                        const isActive = timeInput === timeStr;
                        return (
                            <button
                                key={label}
                                type="button"
                                onClick={() => {
                                    setTimeInput(timeStr);
                                    if (selectedDate) emitChange(selectedDate, timeStr);
                                }}
                                style={isActive ? activeButtonStyle : buttonStyle}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Mini Calendar */}
            <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <button type="button" onClick={prevMonth} style={{ ...buttonStyle, padding: '4px 8px' }}>←</button>
                    <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>{monthName}</span>
                    <button type="button" onClick={nextMonth} style={{ ...buttonStyle, padding: '4px 8px' }}>→</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                        <div key={d} style={{ textAlign: 'center', fontSize: '9px', color: 'var(--text-muted)', padding: '4px' }}>{d}</div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                    {days.map((dayObj, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => selectDay(dayObj)}
                            style={{
                                background: isSelected(dayObj.date) ? 'var(--accent-primary)' : 'transparent',
                                border: isToday(dayObj.date) ? '1px solid var(--accent-primary)' : '1px solid transparent',
                                borderRadius: '4px',
                                padding: '6px',
                                fontSize: '11px',
                                color: isSelected(dayObj.date) ? 'white' : dayObj.isCurrentMonth ? 'var(--text-primary)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                opacity: dayObj.isCurrentMonth ? 1 : 0.4
                            }}
                        >
                            {dayObj.day}
                        </button>
                    ))}
                </div>
            </div>

            {/* Time Input */}
            <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>SET TIME</div>
                <input
                    type="time"
                    value={timeInput}
                    onChange={handleTimeChange}
                    style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '18px',
                        fontWeight: 500,
                        textAlign: 'center',
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            {/* Preview */}
            {value && (
                <div style={{
                    padding: '10px 12px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'var(--accent-primary)',
                    textAlign: 'center',
                    fontWeight: 500
                }}>
                    📅 {formatPreview(value)}
                    {selectedDate && getDateContextLabel(selectedDate) && (
                        <div style={{ fontSize: '11px', color: 'var(--accent-success)', marginTop: '4px', fontWeight: 600 }}>
                            ✨ {getDateContextLabel(selectedDate)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
