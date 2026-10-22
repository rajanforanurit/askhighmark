const NEARBY = /\b(?:near(?:by|est|er)?|closest|around|surrounding|neighbou?ring|radius|\d+(?:\.\d+)?\s*(?:mi|miles?))\b/i;

// True when the user is asking about properties around another property (nearest, nearby, within 5 miles...).
export function asksForNearby(query: string): boolean {
    return NEARBY.test(query);
}
