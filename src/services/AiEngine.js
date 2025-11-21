export class AiEngine {
    static generatePlan(tasks, userRole) {
        // Simulate AI processing delay
        return new Promise((resolve) => {
            setTimeout(() => {
                const prioritized = tasks.map(task => {
                    // If priority is set manually, map it to a quadrant
                    let quadrant = task.quadrant;

                    if (task.priority === 'high') quadrant = 'do';
                    else if (task.priority === 'medium') quadrant = 'decide';
                    else if (task.priority === 'low') quadrant = 'delegate';
                    else if (!quadrant) {
                        // Only run heuristic if no manual priority and no existing quadrant
                        quadrant = this.determineQuadrant(task.title);
                    }

                    return {
                        ...task,
                        quadrant,
                        score: this.calculateScore(task, quadrant)
                    };
                });

                // Sort by score (descending)
                prioritized.sort((a, b) => b.score - a.score);

                resolve({
                    id: Date.now(),
                    date: new Date().toISOString(),
                    tasks: prioritized,
                    summary: `Prioritized ${prioritized.length} tasks based on urgency and importance.`
                });
            }, 500); // Faster response for updates
        });
    }

    static determineQuadrant(text) {
        const lower = text.toLowerCase();
        if (lower.includes('urgent') || lower.includes('asap') || lower.includes('now') || lower.includes('deadline')) {
            return 'do';
        }
        if (lower.includes('plan') || lower.includes('strategy') || lower.includes('learn') || lower.includes('goal')) {
            return 'decide';
        }
        if (lower.includes('email') || lower.includes('call') || lower.includes('meeting') || lower.includes('send')) {
            return 'delegate';
        }
        return 'decide';
    }

    static calculateScore(task, quadrant) {
        let score = 0;

        // Base score from Quadrant
        switch (quadrant) {
            case 'do': score += 100; break;
            case 'decide': score += 80; break;
            case 'delegate': score += 50; break;
            case 'delete': score += 10; break;
            default: score += 0;
        }

        // Manual Priority Boost
        if (task.priority === 'high') score += 50;
        if (task.priority === 'medium') score += 30;
        if (task.priority === 'low') score -= 10;

        // Due Date Boost (Simple check: is it today or past?)
        if (task.dueDate) {
            const due = new Date(task.dueDate);
            const now = new Date();
            const diffDays = (due - now) / (1000 * 60 * 60 * 24);

            if (diffDays < 0) score += 200; // Overdue!
            else if (diffDays < 1) score += 100; // Due today
            else if (diffDays < 3) score += 50; // Due soon
        }

        return score;
    }
}
