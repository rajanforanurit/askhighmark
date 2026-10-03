import type { AskAIResult, ComparisonResult, PropertyRecord } from "../api";
import type { AnalysisResult, ColumnType, MapProperty, Metric, TableColumn, TableRow } from "../types";
import { FIELD_ALIASES, pick } from "./fields";
import { compact, formatValue, humanize, inferColumnType, toNumber } from "./format";
import { toMapProperty } from "./validation";

const HIDDEN_KEYS = new Set(["PropertyBizKey", "Latitude", "Longitude", "raw"]);

let resultCounter = 0;

function nextResultId(): string {
    resultCounter += 1;
    return `res-${resultCounter}`;
}

function isScalar(value: unknown): boolean {
    return value === null || ["string", "number", "boolean"].includes(typeof value);
}

function rowKey(values: Record<string, unknown>, index: number): string {
    const k = values.PropertyBizKey;
    if (k !== undefined && k !== null && String(k) !== "") return String(k);
    return `${String(values.PropertyName ?? "row")}-${index}`;
}

function buildColumns(records: Record<string, unknown>[], preferred?: string[]): TableColumn[] {
    const keys: string[] = [];
    const source = preferred && preferred.length > 0 ? preferred : records.flatMap(r => Object.keys(r));
    source.forEach(k => {
        if (!keys.includes(k) && !HIDDEN_KEYS.has(k)) keys.push(k);
    });
    const withData = keys.filter(k =>
        records.some(r => isScalar(r[k]) && r[k] !== null && r[k] !== undefined && r[k] !== ""),
    );
    const ordered = [
        ...withData.filter(k => k === "PropertyName"),
        ...withData.filter(k => k !== "PropertyName" && k !== "distance_miles"),
        ...withData.filter(k => k === "distance_miles"),
    ];
    return ordered.map(k => ({ key: k, label: humanize(k), type: inferColumnType(k) as ColumnType }));
}

function buildRows(records: Record<string, unknown>[], subjectKey: string | null): TableRow[] {
    return records.map((values, i) => {
        const key = rowKey(values, i);
        return { key, values, isSubject: subjectKey !== null && key === subjectKey };
    });
}

function finalize(
    answer: string,
    records: Record<string, unknown>[],
    subjectKey: string | null,
    comparable: boolean,
    unresolved: string[],
    raw: unknown,
    preferred?: string[],
): AnalysisResult {
    const rows = buildRows(records, subjectKey);
    const columns = buildColumns(records, preferred);
    const hasCoords = rows.some(r => toMapProperty(r.values, r.key, r.isSubject) !== null);
    let kind: AnalysisResult["kind"] = "text";
    if (rows.length > 0) {
        if (hasCoords) kind = "mixed";
        else kind = comparable ? "comparison" : "table";
    }
    return {
        id: nextResultId(),
        kind,
        answer,
        subjectKey,
        columns,
        rows,
        comparable,
        unresolved,
        raw,
    };
}

export function fromNearest(
    target: PropertyRecord,
    nearby: PropertyRecord[],
    comparison: ComparisonResult | undefined,
    answer: string,
    raw: unknown,
): AnalysisResult {
    const subjectKey = target.PropertyBizKey ? String(target.PropertyBizKey) : null;
    const byKey = new Map<string, Record<string, unknown>>();
    [target, ...nearby].forEach(p => byKey.set(String(p.PropertyBizKey), { ...p }));

    let records: Record<string, unknown>[];
    let preferred: string[] | undefined;
    if (comparison && comparison.properties.length > 0) {
        records = comparison.properties.map(p => {
            const k = String(p.PropertyBizKey ?? "");
            return { ...(byKey.get(k) ?? {}), ...p };
        });
        if (!records.some(r => String(r.PropertyBizKey) === subjectKey)) {
            records = [{ ...target }, ...records];
        }
        preferred = comparison.fields;
        if (!preferred.includes("distance_miles") && records.some(r => r.distance_miles !== undefined)) {
            preferred = [...preferred, "distance_miles"];
        }
    } else {
        records = [{ ...target }, ...nearby.map(p => ({ ...p }))];
    }
    const missing = comparison?.not_found ?? [];
    return finalize(answer, records, subjectKey, Boolean(comparison), missing, raw, preferred);
}

export function fromAsk(result: AskAIResult): AnalysisResult {
    const raw = result;
    if (result.target || result.comparison) {
        const target = result.target;
        if (target) {
            return fromNearest(
                target,
                result.nearby ?? [],
                result.comparison,
                result.message ?? "Here's what I found.",
                raw,
            );
        }
        const comparison = result.comparison as ComparisonResult;
        const answer = result.message ?? "Here's the comparison.";
        return finalize(
            answer,
            comparison.properties,
            null,
            true,
            [...(comparison.not_found ?? []), ...(result.unresolved ?? [])],
            raw,
            comparison.fields,
        );
    }
    if (result.results) {
        const n = result.results.length;
        const answer = result.message ?? (n > 0 ? `Found ${n} matching ${n === 1 ? "property" : "properties"}.` : "No matching properties found.");
        return finalize(answer, result.results.map(p => ({ ...p })), null, false, result.unresolved ?? [], raw);
    }
    return finalize(
        result.message ?? "I couldn't understand that. Try naming a specific property.",
        [],
        null,
        false,
        result.unresolved ?? [],
        raw,
    );
}

export function toMapProperties(rows: TableRow[]): MapProperty[] {
    const out: MapProperty[] = [];
    rows.forEach(r => {
        const p = toMapProperty(r.values, r.key, r.isSubject);
        if (p) out.push(p);
    });
    return out;
}

function average(values: number[]): number | null {
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

export function buildMetrics(rows: TableRow[]): Metric[] {
    const metrics: Metric[] = [];
    if (rows.length === 0) return metrics;
    const vals = rows.map(r => r.values);
    const nums = (aliases: readonly string[]) =>
        vals.map(v => toNumber(pick(v, [...aliases]))).filter((n): n is number => n !== null);

    metrics.push({ id: "count", label: "Properties", value: String(rows.length) });

    const distances = rows.filter(r => !r.isSubject)
        .map(r => toNumber(pick(r.values, [...FIELD_ALIASES.proximity])))
        .filter((n): n is number => n !== null);
    if (distances.length > 0) {
        metrics.push({ id: "nearest", label: "Nearest", value: formatValue(Math.min(...distances), "distance") });
        metrics.push({ id: "farthest", label: "Farthest", value: formatValue(Math.max(...distances), "distance") });
    }
    const occ = average(nums(FIELD_ALIASES.occupancy));
    if (occ !== null) metrics.push({ id: "occ", label: "Avg occupancy", value: formatValue(occ, "percent") });
    const rent = average(nums(FIELD_ALIASES.rentPsf));
    if (rent !== null) metrics.push({ id: "rent", label: "Avg rent / SqFt", value: formatValue(rent, "currency") });
    const unitList = nums(FIELD_ALIASES.units);
    if (unitList.length > 0) {
        metrics.push({ id: "units", label: "Total units", value: compact(unitList.reduce((a, b) => a + b, 0)) });
    }
    const years = average(nums(FIELD_ALIASES.yearBuilt));
    if (years !== null) metrics.push({ id: "year", label: "Avg year built", value: String(Math.round(years)) });
    return metrics.slice(0, 5);
}
