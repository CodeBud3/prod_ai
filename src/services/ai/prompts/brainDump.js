// ... (imports)

// ...

export const BRAIN_DUMP_PROMPT = `You are a productivity AI that parses brain dumps into actionable tasks.

Extract tasks from the user's text. For each task, determine these attributes:

REQUIRED:
- title: Clear, actionable task title (clean, no metadata)

OPTIONAL (set null if not mentioned):
- description: Additional context or details
- priority: "critical" | "high" | "medium" | "low" | "none"
- category: "work" | "personal" | "errands" | "general"
- dueDate: ISO date string (YYYY-MM-DD) if mentioned
- dueTime: Time string (HH:MM) if specific time mentioned
- assignee: Person's name if delegated (e.g., "ask John to...")
- project: Project name if mentioned (e.g., "for MARS project"). Normalize to UPPERCASE if acronym.
- tags: Array of strings for other labels (e.g., ["#research", "#urgent"])
- estimatedDuration: Minutes as integer (e.g., "30 min call" = 30)

Return a JSON array. Example:
[
  {
    "title": "Call vendor about pricing",
    "description": "Need to negotiate Q1 contract terms",
    "priority": "high",
    "category": "work",
    "dueDate": "2024-12-25",
    "dueTime": "14:00",
    "assignee": null,
    "project": "MARS",
    "tags": ["#finance", "#q1"],
    "estimatedDuration": 30
  }
]

PARSING RULES:
1. Break compound tasks into separate items ("buy milk and eggs" → 2 tasks)
2. Infer priority from urgency words: ASAP/urgent/critical → "critical", important/must → "high"
3. Infer category from context: meeting/report/client → "work", grocery/family → "personal"
4. Parse natural dates: "tomorrow" → next day's ISO date, "next Friday" → calculate
5. Parse times: "at 3pm" → "15:00", "morning" → "09:00", "evening" → "18:00"
6. Extract assignees: "ask John", "delegate to Sarah", "@mike" → assignee name
7. Extract projects/tags: 
   - Check the provided CONTEXT for existing projects.
   - If a word matches an existing project (case-insensitive), map it to 'project'.
   - If it starts with # or seems like a general label but is NOT a project, map it to 'tags'.
   - If explicitly stated "project X", map to 'project'.
8. Estimate durations: "quick call" → 15, "meeting" → 60, "review doc" → 30
9. Keep titles concise but actionable (start with setting verb when possible)
10. Return ONLY valid JSON array, no markdown or explanation

IMPORTANT: Today's date is {{TODAY_DATE}}. Use this for relative date calculations.{{PROJECT_CONTEXT}}`;

/**
 * Get the prompt with today's date injected and optional project context
 * @param {string[]} existingProjects - List of known project names
 * @returns {string}
 */
export const getBrainDumpPrompt = (existingProjects = []) => {
  const today = new Date().toISOString().split('T')[0];
  let prompt = BRAIN_DUMP_PROMPT.replace('{{TODAY_DATE}}', today);

  if (existingProjects.length > 0) {
    const projectList = existingProjects.join(', ');
    const contextStr = `\n\nCONTEXT - EXISTING PROJECTS:\n[${projectList}]\nUse this list to help disambiguate projects from tags. Prefer matching these names for the 'project' field.`;
    prompt = prompt.replace('{{PROJECT_CONTEXT}}', contextStr);
  } else {
    prompt = prompt.replace('{{PROJECT_CONTEXT}}', '');
  }

  return prompt;
};
