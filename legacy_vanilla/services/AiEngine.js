export class AiEngine {
    static generatePlan(tasks, userRole) {
        // Simulate AI processing delay
        return new Promise((resolve) => {
            setTimeout(() => {
                const prioritized = tasks.map(task => {
                    const quadrant = this.determineQuadrant(task.title);
                    return {
                        ...task,
                        quadrant,
                        score: this.calculateScore(quadrant)
                    };
                });

                // Sort by score (descending)
                prioritized.sort((a, b) => b.score - a.score);

                resolve({
                    id: Date.now(),
                    date: new Date().toISOString(),
                    tasks: prioritized,
                    summary: `Based on your role as ${userRole}, we've prioritized ${prioritized.length} tasks.`
                });
            }, 1500); // 1.5s "thinking" time
        });
    }

    static determineQuadrant(text) {
        const lower = text.toLowerCase();

        // Heuristic Rules (Simulating AI)
        if (lower.includes('urgent') || lower.includes('asap') || lower.includes('now') || lower.includes('deadline')) {
            return 'do'; // Q1: Urgent & Important
        }
        if (lower.includes('plan') || lower.includes('strategy') || lower.includes('learn') || lower.includes('goal')) {
            return 'decide'; // Q2: Not Urgent & Important
        }
        if (lower.includes('email') || lower.includes('call') || lower.includes('meeting') || lower.includes('send')) {
            return 'delegate'; // Q3: Urgent & Not Important
        }

        return 'decide'; // Default to Q2 (Growth mindset)
    }

    static calculateScore(quadrant) {
        switch (quadrant) {
            case 'do': return 100;
            case 'decide': return 80;
            case 'delegate': return 50;
            case 'delete': return 10;
            default: return 0;
        }
    }
}
