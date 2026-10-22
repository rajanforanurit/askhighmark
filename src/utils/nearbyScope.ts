import type { AskAIResult } from "../api";
import { toNumber } from "./format";

// Default: a property compared with "nearby properties" and no filters gets its 6 nearest.
export const DEFAULT_NEARBY = 6;
// Safety ceiling for filtered queries (e.g. "within 20 miles"). The database is never returned wholesale.
export const MAX_NEARBY = 50;

type Scoped = Pick<AskAIResult, "target" | "nearby" | "comparison" | "properties" | "selection" | "task" | "markers" | "financial_keys" | "warnings">;

interface Candidate {
    key: string;
    distance: number | null;
}

function keyOf(p: Record<string, unknown>): string {
    return String(p.PropertyBizKey ?? "");
}

function byDistance(a: Candidate, b: Candidate): number {
    if (a.distance === null && b.distance === null) return 0;
    if (a.distance === null) return 1;
    if (b.distance === null) return -1;
    return a.distance - b.distance;
}

export interface NearbyScope {
    keys: string[];
    mode: "default" | "radius" | "filtered";
    matched: number;
}

// Decides which nearby properties belong to the answer, from what the user asked and nothing else.
//  - no filters:                      the requested count (default 6) of nearest properties
//  - radius only:                     properties within the radius, nearest first
//  - unit count / other criteria:     only what the backend matched against those criteria
export function nearbyScope(result: Scoped): NearbyScope | null {
    if (!result.target) return null;
    const task = result.task;
    const subject = keyOf(result.target as Record<string, unknown>);
    const radius = typeof task?.radius_miles === "number" && task.radius_miles > 0 ? task.radius_miles : null;
    const criteria = (task?.constraints_applied?.length ?? 0) + (task?.metric_constraints_applied?.length ?? 0) > 0;
    const requested = typeof task?.requested_count === "number" && task.requested_count > 0 ? task.requested_count : null;

    const seen = new Map<string, Candidate>();
    const add = (p: Record<string, unknown>) => {
        const key = keyOf(p);
        if (!key || key === subject) return;
        const distance = toNumber(p.distance_miles);
        const prior = seen.get(key);
        if (!prior || (prior.distance === null && distance !== null)) seen.set(key, { key, distance });
    };
    // Rows the backend answered with. With criteria these are the matches; the picker pool is not.
    (result.nearby ?? []).forEach(p => add(p as Record<string, unknown>));
    (result.selection?.selected_keys ?? []).forEach(k => {
        const hit = (result.properties ?? []).find(p => String(p.PropertyBizKey) === String(k));
        if (hit) add(hit as Record<string, unknown>);
    });
    if (!criteria) {
        // Without criteria any property near the subject may qualify, so rank the whole pool by distance.
        (result.properties ?? []).forEach(p => add(p as Record<string, unknown>));
        (result.comparison?.properties ?? []).forEach(p => add(p));
    }

    let pool = Array.from(seen.values()).sort(byDistance);
    if (radius !== null) pool = pool.filter(c => c.distance !== null && c.distance <= radius);
    const matched = pool.length;

    let mode: NearbyScope["mode"] = "default";
    let limit = requested ?? DEFAULT_NEARBY;
    if (criteria) {
        mode = "filtered";
        limit = requested ?? MAX_NEARBY;
    } else if (radius !== null) {
        mode = "radius";
        limit = requested ?? MAX_NEARBY;
    }
    limit = Math.min(limit, MAX_NEARBY);
    return { keys: pool.slice(0, limit).map(c => c.key), mode, matched };
}

// Trims a target-plus-nearby response to its scope: rows, comparison, map markers, financial keys and the
// ticked selection. The unticked pool is not trimmed. Everything downstream is derived from this one set.
export function scopeNearest<T extends Scoped>(result: T): T {
    const scope = nearbyScope(result);
    if (!scope || !result.target) return result;
    const subject = keyOf(result.target as Record<string, unknown>);
    const keep = new Set([subject, ...scope.keys]);
    const rank = new Map(scope.keys.map((k, i) => [k, i]));
    const order = (a: Record<string, unknown>, b: Record<string, unknown>) =>
        (rank.get(keyOf(a)) ?? -1) - (rank.get(keyOf(b)) ?? -1);

    const nearby = (result.nearby ?? []).filter(p => keep.has(keyOf(p as Record<string, unknown>)))
        .sort((a, b) => order(a as Record<string, unknown>, b as Record<string, unknown>));
    const comparison = result.comparison
        ? { ...result.comparison, properties: result.comparison.properties.filter(p => keep.has(keyOf(p))) }
        : result.comparison;
    // The picker pool (result.properties) is left whole: found properties are ticked, the rest stay listed unticked.
    const selection = result.selection
        ? { ...result.selection, selected_keys: scope.keys, default_count: Math.max(scope.keys.length, 1) }
        : result.selection;

    const warnings = [...(result.warnings ?? [])];
    if (scope.mode !== "default" && scope.matched > scope.keys.length) {
        warnings.push({
            code: "scope_capped",
            message: `${scope.matched} properties matched. Showing the nearest ${scope.keys.length}. Narrow the radius or add a filter to see fewer, or ask for a specific number.`,
        });
    }
    return {
        ...result,
        nearby,
        comparison,
        selection,
        warnings,
        markers: result.markers?.filter(m => keep.has(String(m.key))),
        financial_keys: result.financial_keys ? result.financial_keys.filter(k => keep.has(String(k))) : result.financial_keys,
    };
}
