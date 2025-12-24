import { parseTaskInput } from '../../utils/nlp';

/**
 * Fallback to local NLP parsing when LLM is unavailable
 * Uses existing Compromise.js-based parser
 * 
 * @param {string} rawInput - Raw brain dump text
 * @returns {Array} Array of parsed tasks
 */
export function fallbackLocalParsing(rawInput) {
    // Split by newlines, periods, or semicolons
    const lines = rawInput
        .split(/[\n.;!?]/)
        .map(l => l.trim())
        .filter(l => l.length > 3); // Filter out very short fragments

    const tasks = lines.map((line, i) => {
        // Use existing NLP parser
        const parsed = parseTaskInput(line) || {};

        // Generate unique ID
        const id = Date.now() + Math.random() + i;

        // Build task object matching our schema
        return {
            id,
            title: parsed.title || line,
            description: null,
            priority: parsed.priority || 'none',
            category: inferCategory(line),
            dueDate: parsed.dueDate || null,
            dueTime: parsed.dueTime || null,
            assignee: parsed.assignee || null,
            project: parsed.project || null,
            estimatedDuration: parsed.duration ? parseDuration(parsed.duration) : null,
            status: 'todo',
            createdAt: Date.now(),
        };
    });

    return tasks.filter(t => t.title && t.title.length > 0);
}

/**
 * Infer category from task text
 * @param {string} text 
 * @returns {string}
 */
function inferCategory(text) {
    const lower = text.toLowerCase();

    // Work indicators
    if (/meeting|report|client|project|deadline|presentation|email|call|review/i.test(lower)) {
        return 'work';
    }

    // Errands indicators
    if (/buy|grocery|store|pick up|drop off|appointment|doctor|dentist/i.test(lower)) {
        return 'errands';
    }

    // Personal indicators
    if (/family|birthday|mom|dad|friend|dinner|lunch|exercise|gym/i.test(lower)) {
        return 'personal';
    }

    return 'general';
}

/**
 * Parse duration string to minutes
 * @param {string} durationStr - e.g., "1h", "30m", "2d"
 * @returns {number|null}
 */
function parseDuration(durationStr) {
    if (!durationStr) return null;

    const match = durationStr.match(/(\d+(?:\.\d+)?)(h|m|d)/i);
    if (!match) return null;

    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    if (unit === 'h') return Math.round(value * 60);
    if (unit === 'm') return Math.round(value);
    if (unit === 'd') return Math.round(value * 24 * 60);

    return null;
}
