import { getGeminiClient, isGeminiAvailable } from './geminiClient';
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

/**
 * Generate AI suggestions for a task (Single line scheduling/focus tip)
 * @param {Object} task - The task object
 * @returns {Promise<string>} Single string suggestion
 */
export const generateTaskSuggestions = async (task) => {
    // 1. Try Gemini API first
    if (isGeminiAvailable()) {
        try {
            const suggestions = await generateGeminiSuggestions(task);
            if (suggestions) return suggestions;
        } catch (error) {
            console.warn('Gemini suggestion generation failed, falling back to local:', error);
        }
    }

    // 2. Fallback to local heuristics
    return generateLocalSuggestions(task);
};

// --- Gemini Implementation ---

const generateGeminiSuggestions = async (task) => {
    const client = getGeminiClient('flash');
    if (!client) return null;

    const prompt = `
    You are an expert scheduler and task manager. Given this task:
    Title: "${task.title}"
    Description: "${task.description || ''}"
    Priority: ${task.priority || 'none'}
    Due: ${task.dueDate || 'no date'}
    
    Provide a single, short (max 10 words) tip on WHEN to schedule this or WHAT mental mode to use or how to tackle tasks.
    Examples: "If this task takes less than 5 minutes, do it now.", "Low energy task, perfectly fits 4pm slump.", "Batch with other errands.", "Half of the available time is over for this task, you may need to check this out, etc"
    
    Be tactical.
    Output ONLY the plain text string.
    `;

    const response = await client.invoke([
        new SystemMessage("You are a concise tactical scheduler."),
        new HumanMessage(prompt)
    ]);

    return response.content.replace(/['"]/g, '').trim();
};

// --- Local Fallback Implementation ---

const generateLocalSuggestions = (task) => {
    const title = task.title.toLowerCase();

    if (task.priority === 'critical') return "Do first thing in the morning.";
    if (task.priority === 'high') return "Schedule during high-energy peak.";
    if (task.priority === 'low') return "Good for low-energy afternoon slump.";

    if (title.includes('email') || title.includes('call') || title.includes('message')) return "Batch with other communications.";
    if (title.includes('buy') || title.includes('order') || title.includes('pay')) return "Quick 5-min admin task.";
    if (title.includes('plan') || title.includes('review') || title.includes('think')) return "Requires deep focus mode.";
    if (title.includes('meeting') || title.includes('sync')) return "Prepare agenda buffer before.";
    if (title.includes('workout') || title.includes('gym')) return "Lunch break or early morning.";

    return "Timeblock 15 mins to start.";
};
