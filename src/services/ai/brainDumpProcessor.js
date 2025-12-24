import { getGeminiClient, isGeminiAvailable } from './geminiClient';
import { getBrainDumpPrompt } from './prompts/brainDump';
import { fallbackLocalParsing } from './fallback';

/**
 * Process a brain dump through the AI pipeline
 * Uses a simple chain approach (browser-compatible)
 * 
 * Flow:
 * 1. Send raw input to Gemini LLM
 * 2. Parse JSON response
 * 3. Enrich tasks with metadata
 * 4. Validate and return
 * 
 * Falls back to local NLP if LLM fails
 * 
 * @param {string} rawInput - User's brain dump text
 * @returns {Promise<Object>} Result with validated tasks
 */
export async function processBrainDump(rawInput) {
    // Debug: Check API key
    console.log('🔑 Checking Gemini availability:', {
        isAvailable: isGeminiAvailable(),
        keyPrefix: import.meta.env.VITE_GEMINI_API_KEY?.substring(0, 10) + '...'
    });

    // Check if Gemini is available
    if (!isGeminiAvailable()) {
        console.log('Gemini API not configured, using local parsing');
        const tasks = fallbackLocalParsing(rawInput);
        return {
            success: true,
            tasks,
            usedFallback: true,
            error: 'API key not configured'
        };
    }

    try {
        // Get Gemini client
        const llm = getGeminiClient('flash');

        if (!llm) {
            throw new Error('Failed to initialize Gemini client');
        }

        // Get the prompt with today's date
        const systemPrompt = getBrainDumpPrompt();

        // Call the LLM with retry logic for rate limits
        let response;
        let retries = 3;
        let delay = 2000; // Start with 2 seconds

        while (retries > 0) {
            try {
                response = await llm.invoke([
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: rawInput }
                ]);
                break; // Success, exit retry loop
            } catch (e) {
                if (e.message?.includes('429') && retries > 1) {
                    console.log(`Rate limited, retrying in ${delay / 1000}s...`);
                    await new Promise(r => setTimeout(r, delay));
                    delay *= 2; // Double the delay
                    retries--;
                } else {
                    throw e; // Re-throw if not rate limit or out of retries
                }
            }
        }

        // Extract content from response
        let jsonContent = response.content;

        // Handle potential markdown code blocks
        if (jsonContent.includes('```json')) {
            jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonContent.includes('```')) {
            jsonContent = jsonContent.replace(/```\n?/g, '');
        }

        // Parse JSON
        const extractedTasks = JSON.parse(jsonContent.trim());

        if (!Array.isArray(extractedTasks)) {
            throw new Error('LLM did not return an array');
        }

        // Enrich and validate tasks
        const validatedTasks = enrichTasks(extractedTasks);

        return {
            success: true,
            tasks: validatedTasks,
            usedFallback: false,
            error: null
        };

    } catch (error) {
        console.error('Brain dump processing failed:', error);

        // Fallback to local parsing
        const fallbackTasks = fallbackLocalParsing(rawInput);

        return {
            success: true,
            tasks: fallbackTasks,
            usedFallback: true,
            error: error.message
        };
    }
}

/**
 * Enrich tasks with additional metadata
 * @param {Array} tasks - Raw tasks from LLM
 * @returns {Array} Enriched tasks
 */
function enrichTasks(tasks) {
    return tasks.map((task, index) => {
        // Generate unique ID
        const id = Date.now() + Math.random() + index;

        // Combine dueDate and dueTime if both present
        let finalDueDate = task.dueDate || null;
        if (task.dueDate && task.dueTime) {
            finalDueDate = `${task.dueDate}T${task.dueTime}`;
        }

        // Calculate followUp for delegated tasks with duration
        let followUp = null;
        if (task.assignee && task.estimatedDuration) {
            followUp = {
                dueAt: Date.now() + task.estimatedDuration * 60 * 1000,
                startedAt: Date.now(),
                status: 'pending'
            };
        }

        return {
            id,
            title: task.title || 'Untitled Task',
            description: task.description || null,
            priority: validatePriority(task.priority),
            category: validateCategory(task.category),
            dueDate: finalDueDate,
            assignee: task.assignee || null,
            project: task.project || null,
            estimatedDuration: task.estimatedDuration || null,
            status: 'todo',
            createdAt: Date.now(),
            ...(followUp && { followUp })
        };
    });
}

/**
 * Validate and normalize priority value
 */
function validatePriority(priority) {
    const validPriorities = ['critical', 'high', 'medium', 'low', 'none'];
    if (priority && validPriorities.includes(priority.toLowerCase())) {
        return priority.toLowerCase();
    }
    return 'none';
}

/**
 * Validate and normalize category value
 */
function validateCategory(category) {
    const validCategories = ['work', 'personal', 'errands', 'general'];
    if (category && validCategories.includes(category.toLowerCase())) {
        return category.toLowerCase();
    }
    return 'general';
}
