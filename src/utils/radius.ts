import {
    ApiError,
    compareWithNearest,
    type BackendConfig,
    type ComparisonResult,
    type NearestResult,
    type PropertyRecord,
} from "../api";

export type NearestWithComparison = NearestResult & { comparison: ComparisonResult };

const COUNT_STEPS = [25, 50, 100, 200, 500];

function distanceOf(p: PropertyRecord): number | null {
    if (p.distance_miles === undefined || p.distance_miles === null) return null;
    const n = Number(p.distance_miles);
    return isFinite(n) ? n : null;
}

function within(found: NearestWithComparison, radius: number): NearestWithComparison {
    const nearby = found.nearby.filter(p => {
        const d = distanceOf(p);
        return d === null || d <= radius;
    });
    const keys = new Set<string>([found.target.PropertyBizKey, ...nearby.map(p => p.PropertyBizKey)]);
    const names = new Set<string>([found.target.PropertyName, ...nearby.map(p => p.PropertyName)]);
    const comparison: ComparisonResult = found.comparison
        ? {
            ...found.comparison,
            properties: (found.comparison.properties ?? []).filter(item => {
                const key = item["PropertyBizKey"];
                if (typeof key === "string") return keys.has(key);
                const name = item["PropertyName"];
                return typeof name !== "string" || names.has(name);
            }),
        }
        : found.comparison;
    return { ...found, nearby, comparison };
}

export async function compareWithinRadius(
    cfg: BackendConfig,
    bizKey: string,
    radiusMiles: number,
): Promise<NearestWithComparison> {
    let last: NearestWithComparison | null = null;
    for (const count of COUNT_STEPS) {
        let found: NearestWithComparison;
        try {
            found = await compareWithNearest(cfg, bizKey, count);
        } catch (err) {
            if (last && err instanceof ApiError && err.kind === "server") return within(last, radiusMiles);
            throw err;
        }
        if (!found || !found.target || !Array.isArray(found.nearby)) throw new ApiError("invalid");
        last = found;
        const distances = found.nearby.map(distanceOf);
        const unknown = distances.some(d => d === null);
        const farthest = Math.max(0, ...distances.filter((d): d is number => d !== null));
        if (unknown || found.nearby.length < count || farthest > radiusMiles) return within(found, radiusMiles);
    }
    if (!last) throw new ApiError("invalid");
    return within(last, radiusMiles);
}