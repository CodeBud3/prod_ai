import { getGeminiClient, isGeminiAvailable } from './geminiClient';
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

/**
 * Generate AI suggestions for a batch of tasks
 * @param {Array} tasks - List of task objects
 * @returns {Promise<Object>} Map of taskId -> suggestion string
 */
export const generateBatchTaskSuggestions = async (tasks) => {
    if (!tasks || tasks.length === 0) return {};

    // 1. Try Gemini API first
    if (isGeminiAvailable()) {
        try {
            const suggestions = await generateGeminiBatchSuggestions(tasks);
            if (suggestions) return suggestions;
        } catch (error) {
            console.warn('Gemini batch suggestion generation failed, falling back to local:', error);
        }
    }

    // 2. Fallback to local heuristics
    return generateLocalBatchSuggestions(tasks);
};

// --- Gemini Implementation ---

const generateGeminiBatchSuggestions = async (tasks) => {
    const client = getGeminiClient('flash');
    if (!client) return null;

    const now = new Date();
    const currentTime = now.toISOString();

    const tasksJson = tasks.map(t => {
        // Calculate time context
        const dueDate = t.dueDate ? new Date(t.dueDate) : null;
        const createdAt = t.createdAt ? new Date(t.createdAt) : null;

        let timeContext = null;
        if (dueDate) {
            const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
            const totalDuration = createdAt ? (dueDate - createdAt) / (1000 * 60 * 60) : null;
            const percentTimeElapsed = totalDuration ? Math.round(((now - createdAt) / (dueDate - createdAt)) * 100) : null;

            timeContext = {
                hoursUntilDue: Math.round(hoursUntilDue),
                percentTimeElapsed: percentTimeElapsed,
                isOverdue: hoursUntilDue < 0,
                isDueToday: hoursUntilDue > 0 && hoursUntilDue < 24,
                isDueTomorrow: hoursUntilDue > 24 && hoursUntilDue < 48
            };
        }

        return {
            id: t.id,
            title: t.title,
            priority: t.priority || 'none',
            status: t.status || 'todo', // 'todo', 'in_progress', 'done'
            due: t.dueDate || 'no date',
            createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : null,
            description: t.description || '',
            timeContext: timeContext
        };
    });

    const prompt = `
    You are a strategic productivity coach analyzing a user's task list. Current time: ${currentTime}

    TASK LIST:
    ${JSON.stringify(tasksJson, null, 2)}

    YOUR ROLE: Give each task a SHORT (max 12 words), ACTIONABLE tip. Be a smart assistant who notices patterns.

    STRATEGIC CONSIDERATIONS:
    - If timeContext.percentTimeElapsed > 50% and status is 'todo': "⚠️ 60% of time gone, hasn't started!"
    - If timeContext.hoursUntilDue < 4: "🔥 Due very soon, prioritize now!"
    - If timeContext.isOverdue: "🚨 Overdue! Reschedule or escalate."
    - If priority is 'critical' or 'high' and status is 'todo': "🎯 High priority, tackle first."
    - If title suggests a quick task (call, email, buy): "⚡ Quick win (<5 min), do it now."
    - If multiple tasks seem related: "📦 Batch with [related task name]."
    - If a task has been created > 7 days ago and is still 'todo': "🕸️ Stale task, review if still relevant."
    - If a task is low priority with no deadline: "📋 Backlog item, defer if busy."

    OUTPUT FORMAT:
    Return a JSON object where keys are task IDs (as strings) and values are the suggestion strings.
    Include an appropriate emoji at the start of each suggestion to convey urgency/type at a glance.

    Example:
    {
        "abc123": "⚡ Quick 2-min task, knock it out now.",
        "def456": "⚠️ 70% of deadline passed, start ASAP!",
        "ghi789": "📦 Batch with 'Call John' task."
    }
    
    Output ONLY the valid JSON object. No markdown, no explanation.
    `;

    const response = await client.invoke([
        new SystemMessage("You are a concise, strategic productivity coach. Output only JSON."),
        new HumanMessage(prompt)
    ]);

    // Clean up response if it contains markdown code blocks
    let content = response.content;
    if (content.startsWith('```json')) {
        content = content.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (content.startsWith('```')) {
        content = content.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    try {
        return JSON.parse(content);
    } catch (e) {
        console.error("Failed to parse Gemini batch response:", e);
        return null;
    }
};

// --- Local Fallback Implementation ---

const generateLocalBatchSuggestions = (tasks) => {
    const suggestions = {};
    tasks.forEach(task => {
        suggestions[task.id] = generateLocalSuggestion(task);
    });
    return suggestions;
};

const generateLocalSuggestion = (task) => {
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

/* Legacy Single Item Function (Kept for backward compatibility if needed, though mostly unused now) */
export const generateTaskSuggestions = async (task) => {
    const batchResult = await generateBatchTaskSuggestions([task]);
    return batchResult[task.id];
};
