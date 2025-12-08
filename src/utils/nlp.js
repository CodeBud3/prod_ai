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
    'medium priority': 'medium',
    'low priority': 'low',
    'whenever': 'low'
};

export function parseTaskInput(text) {
    if (!text) return null;

    const doc = nlp(text);
    const result = {
        title: text,
        assignee: null,
        priority: 'none',
        dueDate: null,
        dueTime: null,
        tags: [],
        extractedText: [] // Parts of text that were extracted
    };

    // 1. Extract Assignees (People)
    // We look for "Call [Person]", "Meeting with [Person]", "Assign to [Person]"
    // Or just names if they are capitalized and look like people.
    // Compromise is good at this.
    const people = doc.people().out('array');
    if (people.length > 0) {
        // Simple heuristic: take the first person found
        // We might want to be careful not to capture "John" in "John's report" if it's the object.
        // But for QuickAdd, assuming the first person is the assignee is a reasonable start.
        // However, "Call John" -> Assignee: John? Or is the task "Call John"?
        // If the task starts with a verb like "Call", "Email", "Meet", the person is likely the object/subject of the task, NOT necessarily the assignee.
        // BUT, if the user types "Assign John to fix bug", then John is assignee.
        // OR "Fix bug @John".

        // Let's look for explicit "assign to [Person]" or "@[Person]" patterns first?
        // Compromise doesn't handle "@" well by default as a "Person" tag trigger, but it might.

        // For now, let's stick to the user request: "extract assignee... from what user types".
        // If I type "John to finish report", John is likely assignee.
        // If I type "Finish report John", John might be assignee.
        // If I type "Call John", John is part of the title.

        // Let's try to be smart:
        // If the name is at the start or end, or preceded by "by", "for", "with" (maybe not with).
        // Actually, let's just capture people and let the user confirm via suggestion.
        // We will return the *suggestion*, not auto-apply immediately without user intent (which QuickAdd handles via Tab).

        result.assignee = people[0];
        result.extractedText.push(people[0]);
    }

    // 2. Extract Priority
    // Check for keywords
    for (const [keyword, level] of Object.entries(PRIORITY_MAP)) {
        if (doc.has(keyword)) {
            result.priority = level;
            result.extractedText.push(keyword);
            break; // Take first match
        }
    }

    // 3. Extract Dates (using Chrono for robustness as it handles "next friday" etc well)
    // We use chrono.parse to get the text range too.
    const dateResults = chrono.parse(text);
    if (dateResults.length > 0) {
        const dateResult = dateResults[0];
        const date = dateResult.start.date();

        // Format date YYYY-MM-DD
        result.dueDate = date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0');

        // Check for time
        if (dateResult.start.isCertain('hour')) {
            result.dueTime = String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
        } else {
            // Default to 5 PM if no time specified (as per previous feature)
            // But only if we are "suggesting". The caller can decide default.
            // We'll return null for dueTime if not found.
        }

        result.extractedText.push(dateResult.text);
    }

    // 4. Clean Title
    // Remove extracted parts from title
    let cleanTitle = text;
    result.extractedText.forEach(part => {
        // Case insensitive replace, but be careful not to replace parts of words
        // Using a simple replace for now, can be improved.
        cleanTitle = cleanTitle.replace(part, '');
    });

    // Clean up extra spaces
    result.title = cleanTitle.replace(/\s{2,}/g, ' ').trim();

    // If nothing extracted, return null to indicate no suggestion needed
    if (!result.assignee && result.priority === 'none' && !result.dueDate) {
        return null;
    }

    return result;
}
