export const GREETINGS: readonly string[] = [
    "Hi, How are you?",
    "Hi, What is your agenda today?",
    "Hi, Which property are we exploring?",
    "Hi, Ready to dive into properties comparison?",
    "Hi, What would you like to know today?",
    "Hi, How can I help you today?",
];

// Picks a random greeting index that differs from the previous one whenever more than one greeting exists.
// Pass -1 for the first pick. Call it from event handlers only (never during render) so the greeting stays
// stable across rebuilds and state updates.
export function nextGreetingIndex(previous: number): number {
    const count = GREETINGS.length;
    if (count <= 1) return 0;
    if (previous < 0 || previous >= count) return Math.floor(Math.random() * count);
    return (previous + 1 + Math.floor(Math.random() * (count - 1))) % count;
}
