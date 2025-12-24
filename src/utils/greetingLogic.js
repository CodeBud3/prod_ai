
/**
 * Returns a motivational greeting based on the current time and task progress.
 * 
 * @param {string} userName - The user's name
 * @param {number} completedCount - Number of completed tasks today
 * @param {number} totalCount - Total number of tasks for today
 * @returns {string} The formatted greeting message
 */
export const getMotivationalGreeting = (userName, completedCount, totalCount) => {
    const now = new Date();
    const hours = now.getHours();

    // Calculate progress percentage (avoid division by zero)
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    // Time periods
    const isMorning = hours >= 5 && hours < 12;
    const isAfternoon = hours >= 12 && hours < 17;
    const isEvening = hours >= 17 && hours < 22;
    const isLateNight = hours >= 22 || hours < 5;

    // Greeting pools based on context
    const greetings = {
        morning: {
            start: [
                `Rise and grind, ${userName}! Let's crush it.`,
                `Good morning, ${userName}. Big goals today?`,
                `Wake up with determination, ${userName}.`,
                `Fresh start, fresh wins. Ready, ${userName}?`
            ],
            progress: [
                `Off to a flying start, ${userName}!`,
                `Morning momentum looks good on you, ${userName}.`,
                `Keep that morning energy flowing, ${userName}!`
            ],
            completed: [
                `Morning warrior! You're already killing it, ${userName}.`,
                `Done by noon? You're a machine, ${userName}!`
            ]
        },
        afternoon: {
            start: [
                `Good afternoon, ${userName}. Time to eat the frog!`,
                `Refuel and refocus, ${userName}. You got this.`,
                `Afternoon slump? Not for you, ${userName}.`
            ],
            progress: [
                `Stay steady, ${userName}. The finish line is closer.`,
                `Powering through the afternoon like a pro, ${userName}.`,
                `Don't stop now, ${userName}. You're on a roll.`
            ],
            completed: [
                `Afternoon victory lap for ${userName}!`,
                `Look at you go, ${userName}. Unstoppable.`
            ]
        },
        evening: {
            start: [
                `Good evening, ${userName}. Let's finish strong.`,
                `One last push for the day, ${userName}?`,
                `Evening focus mode: Engaged.`
            ],
            progress: [
                `Wrapping up nicely, ${userName}.`,
                `Almost there, ${userName}. Finish strong!`,
                `Solid day of work, ${userName}. Keep it up.`
            ],
            completed: [
                `Rest easy, ${userName}. You earned it.`,
                `Day complete. You crushed it, ${userName}!`,
                `Time to relax, ${userName}. Great job today.`
            ]
        },
        lateNight: {
            any: [
                `Burning the midnight oil, ${userName}?`,
                `Late night hustle is real, ${userName}.`,
                `Still at it? Don't forget to sleep, ${userName}!`,
                `The world sleeps, but ${userName} grinds.`
            ]
        }
    };

    // Helper to pick random
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // Logic to select bucket
    if (isLateNight) return pick(greetings.lateNight.any);

    const period = isMorning ? greetings.morning : isAfternoon ? greetings.afternoon : greetings.evening;

    if (totalCount === 0) return period.start[0]; // Default start if no tasks

    if (progress === 100) return pick(period.completed);
    if (progress > 30) return pick(period.progress);
    return pick(period.start);
};
