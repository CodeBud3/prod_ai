import React, { useState, useEffect } from 'react';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function RecurrenceSelector({ value, onChange, defaultExpanded = false }) {
    const defaultRecurrence = {
        enabled: false,
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [new Date().getDay()],
        dayOfMonth: new Date().getDate(),
        endType: 'never',
        endDate: null,
        endCount: 10,
        time: '09:00' // Default time
    };

    const recurrence = value || defaultRecurrence;
    const [isExpanded, setIsExpanded] = useState(defaultExpanded || recurrence.enabled);

    const updateRecurrence = (updates) => {
        onChange({ ...recurrence, ...updates });
    };

    const toggleEnabled = () => {
        const newEnabled = !recurrence.enabled;
        updateRecurrence({ enabled: newEnabled });
        if (newEnabled) setIsExpanded(true);
    };

    const toggleDay = (dayIndex) => {
        const days = recurrence.daysOfWeek || [];
        if (days.includes(dayIndex)) {
            if (days.length > 1) {
                updateRecurrence({ daysOfWeek: days.filter(d => d !== dayIndex) });
            }
        } else {
            updateRecurrence({ daysOfWeek: [...days, dayIndex].sort() });
        }
    };

    const getSummary = () => {
        if (!recurrence.enabled) return 'Not repeating';

        const interval = recurrence.interval || 1;
        const time = recurrence.time || '09:00';
        const [hours, mins] = time.split(':').map(Number);
        const timeStr = `${hours > 12 ? hours - 12 : hours || 12}:${String(mins).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;

        let text = '';
        switch (recurrence.frequency) {
            case 'daily':
                text = interval === 1 ? `Daily at ${timeStr}` : `Every ${interval} days at ${timeStr}`;
                break;
            case 'weekly':
                const days = (recurrence.daysOfWeek || []).map(d => DAY_NAMES[d]).join(', ');
                text = interval === 1 ? `Weekly on ${days} at ${timeStr}` : `Every ${interval} weeks on ${days} at ${timeStr}`;
                break;
            case 'monthly':
                const day = recurrence.dayOfMonth || 1;
                const suffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
                text = interval === 1 ? `Monthly on the ${day}${suffix} at ${timeStr}` : `Every ${interval} months on the ${day}${suffix} at ${timeStr}`;
                break;
            default:
                text = 'Custom';
        }

        if (recurrence.endType === 'date' && recurrence.endDate) {
            text += ` until ${new Date(recurrence.endDate).toLocaleDateString()}`;
        } else if (recurrence.endType === 'count' && recurrence.endCount) {
            text += `, ${recurrence.endCount}x`;
        }

        return text;
    };

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

    const dayButtonStyle = (isActive) => ({
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        border: 'none',
        background: isActive ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
        color: isActive ? 'white' : 'var(--text-secondary)',
        fontSize: '10px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s'
    });

    const formatEndDate = (timestamp) => {
        if (!timestamp) return '';
        const d = new Date(timestamp);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // Collapsed view - just a clickable summary with toggle
    if (!isExpanded) {
        return (
            <div
                style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
            >
                <div
                    onClick={() => setIsExpanded(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1 }}
                >
                    <span style={{ fontSize: '14px' }}>🔁</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Repeat</span>
                    <span style={{ fontSize: '12px', color: recurrence.enabled ? '#34d399' : 'var(--text-muted)', marginLeft: '8px' }}>
                        {getSummary()}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px', marginLeft: 'auto' }}>▼</span>
                </div>
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleEnabled(); }}
                    style={{
                        width: '40px',
                        height: '22px',
                        borderRadius: '11px',
                        border: 'none',
                        background: recurrence.enabled ? 'var(--accent-primary)' : 'rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background 0.2s',
                        marginLeft: '12px'
                    }}
                >
                    <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: 'white',
                        position: 'absolute',
                        top: '3px',
                        left: recurrence.enabled ? '21px' : '3px',
                        transition: 'left 0.2s'
                    }} />
                </button>
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
            {/* Header with Toggle */}
            <div
                onClick={() => setIsExpanded(false)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: recurrence.enabled ? '12px' : 0, cursor: 'pointer' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                        🔁 Repeat
                    </label>
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>▲</span>
                </div>
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleEnabled(); }}
                    style={{
                        width: '44px',
                        height: '24px',
                        borderRadius: '12px',
                        border: 'none',
                        background: recurrence.enabled ? 'var(--accent-primary)' : 'rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background 0.2s'
                    }}
                >
                    <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: 'white',
                        position: 'absolute',
                        top: '3px',
                        left: recurrence.enabled ? '23px' : '3px',
                        transition: 'left 0.2s'
                    }} />
                </button>
            </div>

            {recurrence.enabled && (
                <>
                    {/* Frequency Buttons */}
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>FREQUENCY</div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {['daily', 'weekly', 'monthly'].map(freq => (
                                <button
                                    key={freq}
                                    type="button"
                                    onClick={() => updateRecurrence({ frequency: freq })}
                                    style={recurrence.frequency === freq ? activeButtonStyle : buttonStyle}
                                >
                                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Interval */}
                    <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Every</span>
                        <input
                            type="number"
                            min="1"
                            max="99"
                            value={recurrence.interval || 1}
                            onChange={(e) => updateRecurrence({ interval: Math.max(1, parseInt(e.target.value) || 1) })}
                            style={{
                                width: '50px',
                                padding: '4px 8px',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '4px',
                                color: 'var(--text-primary)',
                                fontSize: '12px',
                                textAlign: 'center'
                            }}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {recurrence.frequency === 'daily' ? 'day(s)' : recurrence.frequency === 'weekly' ? 'week(s)' : 'month(s)'}
                        </span>
                    </div>

                    {/* Weekly: Day of Week Selector */}
                    {recurrence.frequency === 'weekly' && (
                        <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>ON DAYS</div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {DAY_LABELS.map((label, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => toggleDay(idx)}
                                        style={dayButtonStyle((recurrence.daysOfWeek || []).includes(idx))}
                                        title={DAY_NAMES[idx]}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Monthly: Day of Month */}
                    {recurrence.frequency === 'monthly' && (
                        <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>ON DAY</div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={recurrence.dayOfMonth || 1}
                                    onChange={(e) => updateRecurrence({ dayOfMonth: Math.min(31, Math.max(1, parseInt(e.target.value) || 1)) })}
                                    style={{
                                        width: '50px',
                                        padding: '4px 8px',
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '4px',
                                        color: 'var(--text-primary)',
                                        fontSize: '12px',
                                        textAlign: 'center'
                                    }}
                                />
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>of each month</span>
                            </div>
                        </div>
                    )}

                    {/* Time Setting */}
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>AT TIME</div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                                type="time"
                                value={recurrence.time || '09:00'}
                                onChange={(e) => updateRecurrence({ time: e.target.value })}
                                style={{
                                    padding: '8px 12px',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '6px',
                                    color: 'var(--text-primary)',
                                    fontSize: '14px',
                                    fontWeight: 500
                                }}
                            />
                            {/* Quick time presets */}
                            {[9, 12, 17].map(h => (
                                <button
                                    key={h}
                                    type="button"
                                    onClick={() => updateRecurrence({ time: `${String(h).padStart(2, '0')}:00` })}
                                    style={(recurrence.time || '09:00') === `${String(h).padStart(2, '0')}:00` ? activeButtonStyle : buttonStyle}
                                >
                                    {h === 12 ? '12PM' : h < 12 ? `${h}AM` : `${h - 12}PM`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* End Condition */}
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>ENDS</div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <button
                                type="button"
                                onClick={() => updateRecurrence({ endType: 'never' })}
                                style={recurrence.endType === 'never' ? activeButtonStyle : buttonStyle}
                            >
                                Never
                            </button>
                            <button
                                type="button"
                                onClick={() => updateRecurrence({ endType: 'date' })}
                                style={recurrence.endType === 'date' ? activeButtonStyle : buttonStyle}
                            >
                                On Date
                            </button>
                            <button
                                type="button"
                                onClick={() => updateRecurrence({ endType: 'count' })}
                                style={recurrence.endType === 'count' ? activeButtonStyle : buttonStyle}
                            >
                                After
                            </button>
                        </div>

                        {recurrence.endType === 'date' && (
                            <div style={{ marginTop: '8px' }}>
                                <input
                                    type="date"
                                    value={formatEndDate(recurrence.endDate)}
                                    onChange={(e) => updateRecurrence({ endDate: new Date(e.target.value).getTime() })}
                                    style={{
                                        padding: '6px 10px',
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '4px',
                                        color: 'var(--text-primary)',
                                        fontSize: '12px'
                                    }}
                                />
                            </div>
                        )}

                        {recurrence.endType === 'count' && (
                            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="number"
                                    min="1"
                                    max="999"
                                    value={recurrence.endCount || 10}
                                    onChange={(e) => updateRecurrence({ endCount: Math.max(1, parseInt(e.target.value) || 1) })}
                                    style={{
                                        width: '60px',
                                        padding: '6px 10px',
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '4px',
                                        color: 'var(--text-primary)',
                                        fontSize: '12px',
                                        textAlign: 'center'
                                    }}
                                />
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>times</span>
                            </div>
                        )}
                    </div>

                    {/* Summary */}
                    <div style={{
                        padding: '8px 12px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: '#34d399',
                        textAlign: 'center'
                    }}>
                        🔁 {getSummary()}
                    </div>
                </>
            )}
        </div>
    );
}
