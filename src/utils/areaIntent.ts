export interface AreaQuery {
    kind: "explicit" | "bare";
    text: string;
}

const EXPLICIT = new RegExp(
    "^(?:please\\s+)?(?:(?:show|find|list|search(?:\\s+for)?|get|display|give|what\\s+are)\\s+(?:me\\s+)?)?" +
        "(?:(?:all|the|any)\\s+)*(?:properties|property|apartments?|communities|assets|buildings|listings)\\s+" +
        "(?:in|near|around|at|of)\\s+(.+?)[\\s.?!]*$",
    "i",
);
const EXPLICIT_SHORT = /^(?:in|near|around)\s+(.+?)[\s.?!]*$/i;

const CRITERIA = new RegExp(
    "\\b(with|where|whose|that|having|which|over|under|above|below|more|less|than|between|class|units?|occupancy|" +
        "rents?|noi|budget|actual|chart|graph|plot|pie|bar|sorted|top|largest|smallest|compare|within|miles?|and)\\b|" +
        "\\d+\\s*(?:mi|miles?|%)",
    "i",
);

const ANALYTIC = new RegExp(
    "\\b(compare|comparison|versus|vs|nearest|closest|nearby|within|miles?|occupancy|rents?|noi|budget|actual|variance|" +
        "financials?|units?|chart|graph|plot|pie|bar|top|largest|smallest|average|total|sorted|rank|percent|class|show|" +
        "find|list|give|what|which|who|how|why|when|is|are|do|does|can|tell|overview|details?|summary|map|draw|the|my|our|" +
        "all|any|me|please)\\b",
    "i",
);

const ZIP = /^\d{5}(?:-\d{4})?$/;

export function areaQueryText(input: string): AreaQuery | null {
    const text = input.trim().replace(/\s+/g, " ");
    if (text.length < 2 || text.length > 120) return null;

    const explicit = EXPLICIT.exec(text) ?? EXPLICIT_SHORT.exec(text);
    if (explicit) {
        const area = explicit[1].trim();
        if (area.length >= 2 && !CRITERIA.test(area) && !/^\d+$/.test(area.replace(/\s/g, "")) || ZIP.test(area)) {
            return { kind: "explicit", text: area };
        }
        return null;
    }

    if (text.length < 3 || text.includes("?")) return null;
    if (ZIP.test(text)) return { kind: "bare", text };
    if (/\d/.test(text)) return null;
    const words = text.split(" ");
    if (words.length > 5 || ANALYTIC.test(text)) return null;
    return { kind: "bare", text };
}

export function matchesBare(primary: string, typed: string): boolean {
    const p = primary.trim().toLowerCase();
    const t = typed.trim().toLowerCase();
    return p.length > 0 && t.length > 0 && (p.startsWith(t) || t.startsWith(p));
}
