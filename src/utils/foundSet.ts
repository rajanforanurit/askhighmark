import type { TaskInfo } from "../api";
import type { AnalysisResult, SelectableProperty } from "../types";
import { MAX_NEARBY } from "./nearbyScope";

export interface FoundSet {
    keys: string[];
    options: SelectableProperty[];
    pinnedKeys: string[];
    subjectKey: string | null;
}

export function isComparisonLike(a: AnalysisResult): boolean {
    return a.taskKind === "compare" || a.taskKind === "nearest" || a.comparable
        || a.selection?.kind === "nearest" || a.selection?.kind === "compare";
}

export function ownFilters(a: AnalysisResult): boolean {
    const t = (a.raw as { task?: TaskInfo } | null)?.task;
    return Boolean(
        t?.radius_miles || t?.requested_count || t?.constraints_applied?.length || t?.metric_constraints_applied?.length
        || a.location?.radiusMiles,
    );
}

// The properties a result found, i.e. what gets ticked. Nearest/compare results are already scoped.
// Area and list results tick everything the backend said it found (e.g. "the 15 closest"), nearest first.
export function foundKeysOf(a: AnalysisResult): string[] {
    const sel = a.selection;
    if (!sel) return [];
    if (sel.kind === "nearest" || sel.kind === "compare") return sel.selectedKeys;
    const known = new Set(sel.options.map(o => o.key));
    const fromRows = a.rows.map(r => r.key).filter(k => known.has(k) && !sel.pinnedKeys.includes(k));
    const n = Math.max(a.area?.total ?? 0, sel.selectedKeys.length, fromRows.length);
    const ranked = sel.options
        .filter(o => o.distance !== null && !sel.pinnedKeys.includes(o.key))
        .sort((x, y) => (x.distance as number) - (y.distance as number))
        .map(o => o.key);
    const keys = ranked.length >= n ? ranked.slice(0, n) : Array.from(new Set([...sel.selectedKeys, ...fromRows]));
    return keys.slice(0, MAX_NEARBY);
}

// Decides what is ticked for a freshly received answer. Returns the answer with its selection filled in,
// the keys that still need fetching (ticked but not in the rows yet), and the found set to remember.
export function resolveTicked(
    input: AnalysisResult,
    prior: FoundSet | null,
): { analysis: AnalysisResult; missing: string[] | null; found: FoundSet | null } {
    let analysis = input;
    let keys: string[] | null = null;

    // "Compare" after a search: keep every property that search found, not the backend's first six.
    const follow = prior !== null && isComparisonLike(analysis) && !ownFilters(analysis) && analysis.rows.length > 0
        && analysis.rows.every(r => prior.keys.includes(r.key) || prior.pinnedKeys.includes(r.key));
    if (follow && prior) {
        const pool = analysis.selection?.options ?? prior.options;
        const known = new Set(pool.map(o => o.key));
        keys = prior.keys.filter(k => known.has(k));
        if (!analysis.selection) {
            analysis = {
                ...analysis,
                selection: {
                    options: pool, selectedKeys: keys, subjectKey: prior.subjectKey, pinnedKeys: prior.pinnedKeys,
                    defaultCount: keys.length || 6, kind: "compare", fields: [],
                    view: analysis.financialsPending?.view ?? analysis.financials?.view ?? "actual",
                    status: "idle", totalAvailable: null,
                },
            };
        }
    } else if (analysis.selection) {
        keys = foundKeysOf(analysis);
    }
    if (!keys || !analysis.selection) return { analysis, missing: null, found: prior };

    const have = new Set(analysis.rows.map(r => r.key));
    const missing = keys.some(k => !have.has(k)) ? keys : null;
    const sel = { ...analysis.selection, selectedKeys: keys, status: (missing ? "loading" : "idle") as "loading" | "idle" };
    return {
        analysis: { ...analysis, selection: sel },
        missing,
        found: { keys, options: sel.options, pinnedKeys: sel.pinnedKeys, subjectKey: sel.subjectKey },
    };
}
