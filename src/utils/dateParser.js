import * as chrono from 'chrono-node';

/**
 * Custom refiner to handle "tommo" as "tomorrow"
 */
const tommoRefiner = {
    refine: (context, results) => {
        // If we already have results, we might want to skip or merge, 
        // but for now let's just look for "tommo" in the text if not found

        // Actually, chrono doesn't support "tommo" out of the box, so we need a parser, not just a refiner,
        // OR we can pre-process the text. Pre-processing is safer and easier for simple aliases.
        return results;
    }
};

/**
 * Pre-process text to handle slang/aliases that chrono doesn't know.
 * @param {string} text 
 * @returns {string}
 */
const preProcessText = (text) => {
    let processed = text;
    // Replace "tommo" with "tomorrow" (case insensitive)
    processed = processed.replace(/\btommo\b/gi, 'tomorrow');

    // Replace "day after" with "in 2 days" if it's not "day after tomorrow"
    // "day after tomorrow" is handled by chrono. "day after" alone is ambiguous but user wants +2 days.
    // We need to be careful not to break "day after tomorrow".
    // If we see "day after" NOT followed by "tomorrow", replace it.
    processed = processed.replace(/\bday after\b(?!\s+tomorrow)/gi, 'in 2 days');

    return processed;
};

/**
 * Parse a natural language date string.
 * @param {string} text 
 * @param {Date} [refDate] Reference date (default: now)
 * @returns {{ date: Date, text: string, index: number, length: number } | null}
 */
export const parseDate = (text, refDate = new Date()) => {
    if (!text) return null;

    const processedText = preProcessText(text);
    const results = chrono.parse(processedText, refDate, { forwardDate: true });

    if (results.length === 0) return null;

    // Use the first result
    const result = results[0];
    const date = result.start.date();

    let originalMatchText = result.text;
    let index = result.index;

    // If we replaced text, we need to map back to the original.
    if (processedText !== text) {
        // Strategy: 
        // 1. Identify what was replaced.
        // 2. If the result text contains the *replacement*, map it back to the *source*.

        // Check for "tommo" -> "tomorrow"
        if (result.text.toLowerCase().includes('tomorrow')) {
            // If the original text has "tommo" where "tomorrow" is in the result
            // We can try to reconstruct the original match text.
            // E.g. result.text = "tomorrow morning at 10"
            // original might be "tommo morning at 10"

            // Let's try to replace "tomorrow" back to "tommo" in the result text 
            // AND check if that string exists in the original text.
            const potentialOriginal = result.text.replace(/tomorrow/i, 'tommo');
            if (text.toLowerCase().includes(potentialOriginal.toLowerCase())) {
                // Find the actual case-sensitive match in original text
                const match = text.match(new RegExp(potentialOriginal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
                if (match) {
                    originalMatchText = match[0];
                    index = match.index;
                }
            }
        }

        // Check for "day after" -> "in 2 days"
        // This is harder because "in 2 days" is very different from "day after".
        // result.text might be "in 2 days at 5pm"
        // original: "day after at 5pm"
        if (result.text.toLowerCase().includes('in 2 days')) {
            const potentialOriginal = result.text.replace(/in 2 days/i, 'day after');
            if (text.toLowerCase().includes(potentialOriginal.toLowerCase())) {
                const match = text.match(new RegExp(potentialOriginal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
                if (match) {
                    originalMatchText = match[0];
                    index = match.index;
                }
            }
        }
    }

    return {
        date,
        text: originalMatchText,
        index,
        length: originalMatchText.length
    };
};
