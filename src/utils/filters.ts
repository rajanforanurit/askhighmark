import type { FilterOptions, FilterState, RangeBounds, RangeKey, TableRow } from "../types";
import { FIELD_ALIASES, RANGE_DEFS, hasAlias, pick } from "./fields";
import { toNumber } from "./format";

export const CLASS_OPTIONS = ["Class A", "Class B", "Class C", "None"];

export function createDefaultFilters(): FilterState {
    return { submarket: "", zip: "", classes: [...CLASS_OPTIONS], ranges: {} };
}

export function classifyClass(value: unknown): string {
    if (value === undefined || value === null) return "None";
    const m = /^\s*(?:class\s*)?([abc])\s*[+-]?\s*$/i.exec(String(value));
    return m ? `Class ${m[1].toUpperCase()}` : "None";
}

export function buildOptions(rows: TableRow[]): FilterOptions {
    const values = rows.map(r => r.values);
    const submarkets = new Set<string>();
    const zips = new Set<string>();
    values.forEach(v => {
        const sm = pick(v, [...FIELD_ALIASES.submarket]);
        const zp = pick(v, [...FIELD_ALIASES.zip]);
        if (sm !== undefined) submarkets.add(String(sm));
        if (zp !== undefined) zips.add(String(zp));
    });
    const bounds: Partial<Record<RangeKey, RangeBounds>> = {};
    RANGE_DEFS.forEach(def => {
        const nums = values
            .map(v => toNumber(pick(v, [...def.aliases])))
            .filter((n): n is number => n !== null);
        if (nums.length > 0) {
            bounds[def.key] = { min: Math.min(...nums), max: Math.max(...nums) };
        }
    });
    return {
        submarkets: Array.from(submarkets).sort(),
        zips: Array.from(zips).sort(),
        bounds,
        hasSubmarket: submarkets.size > 0,
        hasZip: zips.size > 0,
        hasClass: hasAlias(values, [...FIELD_ALIASES.propertyClass]),
    };
}

function rangeActive(range: [number, number] | undefined, bounds: RangeBounds | undefined): boolean {
    if (!range || !bounds) return false;
    return range[0] > bounds.min || range[1] < bounds.max;
}

export function countActive(filters: FilterState, options: FilterOptions): number {
    let n = 0;
    if (filters.submarket) n += 1;
    if (filters.zip) n += 1;
    if (filters.classes.length < CLASS_OPTIONS.length) n += 1;
    RANGE_DEFS.forEach(def => {
        if (rangeActive(filters.ranges[def.key], options.bounds[def.key])) n += 1;
    });
    return n;
}

export function applyFilters(
    rows: TableRow[],
    filters: FilterState,
    options: FilterOptions,
): TableRow[] {
    return rows.filter(row => {
        if (row.isSubject) return true;
        const v = row.values;
        if (filters.submarket) {
            const sm = pick(v, [...FIELD_ALIASES.submarket]);
            if (sm === undefined || String(sm) !== filters.submarket) return false;
        }
        if (filters.zip) {
            const zp = pick(v, [...FIELD_ALIASES.zip]);
            if (zp === undefined || String(zp) !== filters.zip) return false;
        }
        if (filters.classes.length < CLASS_OPTIONS.length) {
            const cls = classifyClass(pick(v, [...FIELD_ALIASES.propertyClass]));
            if (!filters.classes.includes(cls)) return false;
        }
        for (const def of RANGE_DEFS) {
            const range = filters.ranges[def.key];
            if (!rangeActive(range, options.bounds[def.key]) || !range) continue;
            const n = toNumber(pick(v, [...def.aliases]));
            if (n === null || n < range[0] || n > range[1]) return false;
        }
        return true;
    });
}

export function toPayload(filters: FilterState, options: FilterOptions): Record<string, string | string[] | [number, number]> {
    const payload: Record<string, string | string[] | [number, number]> = {};
    if (filters.submarket) payload["Submarket"] = filters.submarket;
    if (filters.zip) payload["ZIP"] = filters.zip;
    if (filters.classes.length < CLASS_OPTIONS.length) payload["Property Class"] = filters.classes;
    RANGE_DEFS.forEach(def => {
        const range = filters.ranges[def.key];
        if (range && rangeActive(range, options.bounds[def.key])) payload[def.label] = range;
    });
    return payload;
}
