import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

/**
 * Get a Gemini client instance with model switching capability
 * @param {'flash' | 'pro'} model - Model to use (flash = faster, pro = smarter)
 * @returns {ChatGoogleGenerativeAI} LangChain Gemini client
 */
export const getGeminiClient = (model = 'flash') => {
    const modelName = model === 'pro'
        ? 'gemini-3-flash'
        : 'gemini-2.5-flash';

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        console.warn('VITE_GEMINI_API_KEY not found in environment variables');
        return null;
    }

    return new ChatGoogleGenerativeAI({
        apiKey,
        model: modelName,
        temperature: 0.3, // Lower for more consistent parsing
        maxOutputTokens: 4096,
    });
};

/**
 * Check if Gemini API is available
 * @returns {boolean}
 */
export const isGeminiAvailable = () => {
    return !!import.meta.env.VITE_GEMINI_API_KEY;
};
