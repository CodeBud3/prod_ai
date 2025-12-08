import nlp from 'compromise';
import datePlugin from 'compromise-dates';
import * as chrono from 'chrono-node';

// Extend compromise with date plugin
nlp.plugin(datePlugin);

// Priority keywords mapping
const PRIORITY_MAP = {
    'urgent': 'critical',
    'asap': 'critical',
    'critical': 'critical',
    'high priority': 'high',
    'important': 'high',
    'high': 'high',
    'medium priority': 'medium',
    'medium': 'medium',
    'low priority': 'low',
    'low': 'low',
    'whenever': 'low'
};

export function parseTaskInput(text) {
    if (!text) return null;

    const result = {
        title: text,
        assignee: null,
        project: null,
        priority: 'none',
        dueDate: null,
        dueTime: null,
        duration: null,
        extractedText: []
    };

    let workingText = text;

    // Strip special markers for date parsing (they might interfere with chrono)
    const textForDateParsing = text
        .replace(/@\w+/g, '')           // Remove @assignee
        .replace(/#[\w-]+/g, '')        // Remove #project
        .replace(/!(critical|high|medium|low)/gi, '')  // Remove !priority
        .replace(/~\d+(?:\.\d+)?[hmd]/gi, '')  // Remove ~duration
        .replace(/\s+/g, ' ')           // Normalize spaces
        .trim();

    // 1. FIRST extract dates using Chrono (on cleaned text)
    const dateResults = chrono.parse(textForDateParsing, new Date(), { forwardDate: true });
    if (dateResults.length > 0) {
        const dateResult = dateResults[0];
        const date = dateResult.start.date();

        result.dueDate = date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0');

        if (dateResult.start.isCertain('hour')) {
            const hour = dateResult.start.get('hour');
            const minute = dateResult.start.get('minute') || 0;
            result.dueTime = String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0');
        }

        // Find and remove the original date text from working text
        // Try to match the parsed text in the original
        const dateText = dateResult.text;
        result.extractedText.push(dateText);
        workingText = workingText.replace(new RegExp(dateText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '');
    }

    // 2. Extract @assignee (e.g., "@john", "@John Smith")
    const assigneeMatch = workingText.match(/@(\w+(?:\s+\w+)?)/);
    if (assigneeMatch) {
        result.assignee = assigneeMatch[1];
        result.extractedText.push(assigneeMatch[0]);
        workingText = workingText.replace(assigneeMatch[0], '');
    }

    // 3. Extract #project (e.g., "#MARS", "#project-name")
    const projectMatch = workingText.match(/#([\w-]+)/);
    if (projectMatch) {
        result.project = projectMatch[1];
        result.extractedText.push(projectMatch[0]);
        workingText = workingText.replace(projectMatch[0], '');
    }

    // 4. Extract !priority (e.g., "!critical", "!high")
    const priorityMatch = workingText.match(/!(critical|high|medium|low)/i);
    if (priorityMatch) {
        result.priority = priorityMatch[1].toLowerCase();
        result.extractedText.push(priorityMatch[0]);
        workingText = workingText.replace(priorityMatch[0], '');
    }

    // 5. Extract ~duration (e.g., "~1h", "~30m", "~2d")
    const durationMatch = workingText.match(/~(\d+(?:\.\d+)?)(h|m|d)/i);
    if (durationMatch) {
        result.duration = durationMatch[0].slice(1); // Remove the ~
        result.extractedText.push(durationMatch[0]);
        workingText = workingText.replace(durationMatch[0], '');
    }

    // 6. Extract priority keywords if not found via !syntax
    if (result.priority === 'none') {
        const doc = nlp(workingText);
        for (const [keyword, level] of Object.entries(PRIORITY_MAP)) {
            if (doc.has(keyword)) {
                result.priority = level;
                result.extractedText.push(keyword);
                const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'gi');
                workingText = workingText.replace(keywordRegex, '');
                break;
            }
        }
    }

    // 7. Clean title - remove all extracted parts and clean up whitespace
    let cleanTitle = workingText
        .replace(/\s{2,}/g, ' ')  // Multiple spaces to single
        .replace(/^[\s"']+|[\s"']+$/g, '') // Trim + remove leading/trailing quotes
        .replace(/^[,\s]+|[,\s]+$/g, '') // Remove leading/trailing commas
        // Remove leftover time patterns that might have been missed or partially matched
        // e.g. ":50 pm", "at 5pm", "5pm" (if not captured by chrono for some reason)
        .replace(/\b(?:at\s+)?\d{1,2}:\d{2}(?:\s?[ap]m)?\b/gi, '')
        .replace(/(?:^|\s):\d{2}(?:\s?[ap]m)?\b/gi, '') // Matches :50 pm (colon start)
        .replace(/\b\d{1,2}\s?[ap]m\b/gi, '') // Matches 5pm, 5 pm
        .replace(/\s{2,}/g, ' ') // Clean up spaces again
        .trim();

    result.title = cleanTitle || text; // Fallback to original if empty

    // Only return if something was extracted
    if (!result.assignee && !result.project && result.priority === 'none' && !result.dueDate && !result.duration) {
        return null;
    }

    return result;
}

