// AI Service Layer Exports
export { getGeminiClient, isGeminiAvailable } from './geminiClient';
export { processBrainDump } from './brainDumpProcessor';
export { fallbackLocalParsing } from './fallback';
export { getBrainDumpPrompt } from './prompts/brainDump';
export { generateTaskSuggestions, generateBatchTaskSuggestions } from './taskSuggester';
