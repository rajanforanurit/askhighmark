import type {
    AskAIResult, ComparisonResult, ContractTable, FinancialsPayload, PropertyRecord, SelectionFields, TaskInfo,
} from "../api";
import type {
    AnalysisResult, AreaInfo, ChartRequest, ColumnType, LayoutInfo, LayoutSection, LocationInfo, MapProperty, Metric,
    ResultWarning, SelectionState, TableColumn, TableRow,
} from "../types";
import { FIELD_ALIASES, normalizeKey, pick } from "./fields";
import { compact, formatValue, humanize, inferColumnType, toNumber } from "./format";
import { scopeNearest } from "./nearbyScope";
import { toMapProperty } from "./validation";

const HIDDEN_KEYS = new Set(["PropertyBizKey", "Latitude", "Longitude", "raw"]);

export interface ResultExtras {
    notes?: string[];
    taskId?: string | null;
    taskKind?: TaskInfo["kind"] | null;
    financials?: FinancialsPayload | null;
    financialsError?: string | null;
    chart?: ChartRequest | null;
    period?: TaskInfo["period"] | null;
    metricKeys?: string[];
    contract?: ContractTable | null;
    area?: AreaInfo | null;
    financialsPending?: { keys: string[]; view: "actual" | "budget" | "both" } | null;
    selection?: SelectionState | null;
    layout?: LayoutInfo | null;
    location?: LocationInfo | null;
    warnings?: ResultWarning[];
    referenceKeys?: string[];
}

const METRIC_LABELS: Record<string, string> = {
    units: "unit count",
    occupied_units: "occupied units",
    occupancy_pct: "occupancy",
    avg_unit_sqft: "average unit size",
    total_sqft: "total square footage",
    unit_days: "unit days",
};

const CONTRACT_TYPES: Record<string, ColumnType> = {
    number: "number",
    percent: "pct",
    year: "year",
    distance: "distance",
};

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

// Columns shown in a side-by-side comparison when the backend sent no field list. Without this the
// comparison would list every raw column the property record happens to have.
const CURATED_GROUPS: readonly (readonly string[])[] = [
    ["PropertyName"],
    ["City"],
    ["State"],
    ["AssetType"],
    FIELD_ALIASES.propertyClass,
    FIELD_ALIASES.yearBuilt,
    FIELD_ALIASES.units,
    FIELD_ALIASES.unitSize,
    FIELD_ALIASES.occupancy,
    FIELD_ALIASES.rentPsf,
    FIELD_ALIASES.rent,
    FIELD_ALIASES.proximity,
];

function curatedKeys(records: Record<string, unknown>[]): string[] | undefined {
    const keys: string[] = [];
    CURATED_GROUPS.forEach(group => {
        const wanted = group.map(normalizeKey);
        const found = records
            .flatMap(r => Object.keys(r))
            .find(k => wanted.includes(normalizeKey(k)) && records.some(r => isScalar(r[k]) && r[k] !== null && r[k] !== undefined && r[k] !== ""));
        if (found && !keys.includes(found)) keys.push(found);
    });
    return keys.length >= 3 ? keys : undefined;
}

function buildRows(records: Record<string, unknown>[], subjectKey: string | null, referenceKeys: string[] = []): TableRow[] {
    const refs = new Set(referenceKeys);
    return records.map((values, i) => {
        const key = rowKey(values, i);
        return { key, values, isSubject: (subjectKey !== null && key === subjectKey) || refs.has(key) };
    });
}

function mergeContract(records: Record<string, unknown>[], contract?: ContractTable | null): Record<string, unknown>[] {
    if (!contract || contract.rows.length === 0) return records;
    const byKey = new Map<string, Record<string, unknown>>();
    contract.rows.forEach(r => byKey.set(String(r.key), r.values));
    return records.map(record => {
        const extra = byKey.get(String(record.PropertyBizKey ?? ""));
        if (!extra) return record;
        const out: Record<string, unknown> = { ...record };
        Object.keys(extra).forEach(k => {
            const v = extra[k];
            if (v === undefined || v === null) return;
            if (out[k] === undefined || out[k] === null || out[k] === "") out[k] = v;
        });
        return out;
    });
}

function applyContractColumns(columns: TableColumn[], contract?: ContractTable | null): TableColumn[] {
    if (!contract || contract.columns.length === 0) return columns;
    const meta = new Map(contract.columns.map(c => [c.key, c]));
    const mapped = columns.map(col => {
        const c = meta.get(col.key);
        if (!c) return col;
        const type = CONTRACT_TYPES[c.type] ?? col.type;
        return { key: col.key, label: c.label || col.label, type, decimals: c.decimals };
    });
    const isMetric = (c: TableColumn) => c.type === "number" || c.type === "pct";
    return [
        ...mapped.filter(c => c.key === "PropertyName"),
        ...mapped.filter(c => c.key !== "PropertyName" && c.key !== "distance_miles" && !isMetric(c)),
        ...mapped.filter(c => isMetric(c)),
        ...mapped.filter(c => c.key === "distance_miles"),
    ];
}

function finalize(
    answer: string,
    records: Record<string, unknown>[],
    subjectKey: string | null,
    comparable: boolean,
    unresolved: string[],
    raw: unknown,
    preferred?: string[],
    extras?: ResultExtras,
): AnalysisResult {
    const merged = mergeContract(records, extras?.contract);
    const rows = buildRows(merged, subjectKey, extras?.referenceKeys);
    // Never fall back to every raw column: use the curated comparison columns.
    const base = preferred ?? curatedKeys(merged);
    const preferredWithMetrics = base && extras?.contract
        ? [...base, ...extras.contract.columns.map(c => c.key).filter(k => !base.includes(k))]
        : base;
    const columns = applyContractColumns(buildColumns(merged, preferredWithMetrics), extras?.contract);
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
        notes: extras?.notes ?? [],
        taskId: extras?.taskId ?? null,
        taskKind: extras?.taskKind ?? null,
        financials: extras?.financials ?? null,
        financialsError: extras?.financialsError ?? null,
        chart: extras?.chart ?? null,
        period: extras?.period ?? null,
        metricKeys: extras?.metricKeys ?? [],
        area: extras?.area ?? null,
        financialsPending: extras?.financialsPending ?? null,
        selection: extras?.selection ?? null,
        layout: extras?.layout ?? null,
        location: extras?.location ?? null,
        warnings: extras?.warnings ?? [],
    };
}

function plural(n: number, one: string, many: string): string {
    return n === 1 ? one : many;
}

function pendingFrom(result: AskAIResult): ResultExtras["financialsPending"] {
    if (!result.financials_pending || !Array.isArray(result.financial_keys) || result.financial_keys.length === 0) return null;
    return { keys: result.financial_keys, view: result.financial_view ?? "actual" };
}

function areaFrom(result: AskAIResult): AreaInfo | null {
    const a = result.area;
    if (!a || !isFinite(a.lat) || !isFinite(a.lng)) return null;
    return { name: a.name, lat: a.lat, lng: a.lng, bounds: a.bounds ?? null, radiusMiles: a.radius_miles ?? null, total: a.total_matches };
}

function describeArea(area: AreaInfo, shown: number): string {
    if (area.total === 0) return `No properties found in ${area.name}. Try a nearby or larger area.`;
    const noun = area.total === 1 ? "property" : "properties";
    const tail = area.total > shown ? ` Showing the closest ${shown}.` : "";
    return `Found ${area.total} ${noun} in ${area.name}.${tail}`;
}

const SECTIONS: LayoutSection[] = ["map", "financial", "properties"];

function layoutFrom(result: AskAIResult): LayoutInfo | null {
    const raw = result.layout?.sections;
    if (!Array.isArray(raw)) return null;
    const sections = raw.filter((s): s is LayoutSection => (SECTIONS as string[]).includes(s));
    return { focus: result.layout?.focus ?? "", sections };
}

function locationFrom(result: AskAIResult): LocationInfo | null {
    const l = result.location;
    if (!l || !l.requested) return null;
    const status = l.status === "nearby" || l.status === "empty" || l.status === "unresolved" ? l.status : "exact";
    return {
        requested: l.requested,
        type: l.type ?? "place",
        status,
        message: l.message ?? null,
        scope: l.scope ?? null,
        radiusMiles: l.radius_miles ?? null,
        origin: typeof l.origin?.lat === "number" && typeof l.origin?.lng === "number" ? { lat: l.origin.lat, lng: l.origin.lng } : null,
    };
}

function warningsFrom(result: AskAIResult): ResultWarning[] {
    const out: ResultWarning[] = Array.isArray(result.warnings)
        ? result.warnings
            .filter(w => w && typeof w.message === "string" && w.message !== "")
            .map(w => ({ code: String(w.code ?? "warning"), message: w.message }))
        : [];
    return out;
}

function describeAsk(result: AskAIResult): string {
    const area = areaFrom(result);
    if (area) return describeArea(area, result.results?.length ?? 0);
    if (result.location?.message) return result.location.message;
    const base = describeBase(result);
    const unsupported = result.task?.constraints_unsupported ?? [];
    const tail = unsupported.length > 0 ? ` Not applied: ${unsupported.slice(0, 3).join("; ")}.` : "";
    return `${base}${tail}`;
}

function describeBase(result: AskAIResult): string {
    const task = result.task;
    const radius = task?.radius_miles ? ` within ${task.radius_miles} miles` : "";
    const attributeFields = (task?.constraints_applied ?? []).map(c => humanize(c.field).toLowerCase());
    const metricFields = (task?.metric_constraints_applied ?? []).map(c => METRIC_LABELS[c.metric] ?? humanize(c.metric).toLowerCase());
    const fields = Array.from(new Set([...attributeFields, ...metricFields]));
    const criteria = fields.length > 0 ? ` matching your ${fields.join(", ")} criteria` : "";

    if (result.target) {
        const name = String(result.target.PropertyName ?? "this property");
        const n = result.nearby?.length ?? 0;
        if (n === 0) return `I couldn't find other properties${radius}${criteria} for ${name}.`;
        if (task?.kind === "compare") {
            return `Comparing ${name} with ${n} ${plural(n, "property", "properties")}${radius}${criteria}.`;
        }
        return `Here's ${name} and ${n} nearby ${plural(n, "property", "properties")}${radius}${criteria}.`;
    }
    if (result.comparison) return "Here's the comparison.";
    if (result.results) {
        const n = result.results.length;
        if (n === 0) return "No matching properties found.";
        return `Found ${n} matching ${plural(n, "property", "properties")}${criteria}.`;
    }
    return "Here's what I found.";
}

function chartFrom(result: AskAIResult): ChartRequest | null {
    const viz = result.visualization;
    if (!viz || typeof viz.type !== "string") return null;
    return { type: viz.type, metric: viz.metric ?? null, title: viz.title ?? null };
}

function extrasFrom(result: AskAIResult): ResultExtras {
    return {
        chart: chartFrom(result),
        period: result.task?.period ?? null,
        metricKeys: result.task?.metrics ?? [],
        contract: result.table ?? null,
        area: areaFrom(result),
        financialsPending: pendingFrom(result),
        notes: result.task?.notes ?? [],
        taskId: result.task?.id ?? null,
        taskKind: result.task?.kind ?? null,
        financials: result.financials ?? null,
        financialsError: result.financials_error ?? null,
        selection: selectionFrom(result),
        layout: layoutFrom(result),
        location: locationFrom(result),
        warnings: warningsFrom(result),
        referenceKeys: (result.references ?? []).map(r => String(r.PropertyBizKey)),
    };
}

const SELECTION_KINDS = ["nearest", "compare", "list", "search"] as const;
const DEFAULT_SELECTED = 6;

export function selectionFrom(
    result: SelectionFields & { task?: TaskInfo; financials?: FinancialsPayload | null; view?: string | null },
    fallbackKind: SelectionState["kind"] = "search",
): SelectionState | null {
    if (!Array.isArray(result.properties) || !result.selection) return null;
    const taskKind = result.task?.kind;
    const kind = SELECTION_KINDS.find(k => k === taskKind) ?? fallbackKind;
    const subjectKey = result.selection.subject_key ? String(result.selection.subject_key) : null;
    const pinnedKeys = (result.selection.pinned_keys ?? (subjectKey ? [subjectKey] : [])).map(String);
    const options = result.properties
        .filter(p => p && p.PropertyBizKey !== undefined && p.PropertyBizKey !== null)
        .map(p => {
            const place = [p.City, p.State].filter(Boolean).join(", ");
            return {
                key: String(p.PropertyBizKey),
                name: String(p.PropertyName ?? p.PropertyBizKey),
                subtitle: place,
                distance: toNumber(p.distance_miles),
                values: { ...p, PropertyBizKey: String(p.PropertyBizKey) } as Record<string, unknown>,
            };
        });
    const known = new Set(options.map(o => o.key));
    // The selection is the backend's (already scoped) choice. The option list is only a picker pool and is
    // never selected wholesale.
    const selectAll = false;
    const selectedKeys = (result.selection.selected_keys ?? [])
        .map(String)
        .filter(k => !pinnedKeys.includes(k) && known.has(k));
    const viewValue = result.task?.view ?? result.financials?.view ?? result.view ?? null;
    const view = viewValue === "actual" || viewValue === "budget" || viewValue === "both" ? viewValue : null;
    return {
        options,
        selectedKeys,
        subjectKey,
        pinnedKeys,
        defaultCount: result.selection.default_count || DEFAULT_SELECTED,
        totalAvailable: result.selection.total_available ?? null,
        kind,
        fields: result.task?.fields ?? [],
        view,
        status: "idle",
    };
}

export function fromSelection(prev: AnalysisResult, response: AskAIResult, sentKeys: string[]): AnalysisResult {
    const next = fromAsk(response, { scope: false });
    const current = prev.selection;
    const missing = new Set((response.unresolved ?? []).map(String));
    let answer = next.answer;
    if (next.rows.length === 0) {
        answer = "No properties are selected. Tick one or more properties to see them on the map and in the comparison.";
    }
    return {
        ...next,
        id: prev.id,
        showProperties: prev.showProperties,
        answer,
        chart: prev.chart ?? null,
        area: null,
        layout: prev.layout ?? next.layout ?? null,
        location: prev.location ?? null,
        selection: current
            ? {
                ...current,
                selectedKeys: sentKeys.filter(k => !missing.has(k)),
                status: "idle",
            }
            : null,
    };
}

export function fromNearest(
    target: PropertyRecord,
    nearby: PropertyRecord[],
    comparison: ComparisonResult | undefined,
    answer: string,
    raw: unknown,
    extras?: ResultExtras,
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
        preferred = curatedKeys(records);
    }
    const missing = comparison?.not_found ?? [];
    // A subject with at least one other property is always presented as a comparison, never a raw list.
    const comparable = Boolean(comparison) || records.length > 1;
    return finalize(answer, records, subjectKey, comparable, missing, raw, preferred, extras);
}

export interface AskOptionsNormalize {
    // False when the user named a property but did not ask for nearby ones.
    wantsNearby?: boolean;
    // False for responses to the user's own add/remove choices: those must not be trimmed again.
    scope?: boolean;
}

// Reduces a target-plus-nearby response to the properties the user actually named.
function withoutUnrequestedNearby(result: AskAIResult): AskAIResult {
    if (!result.target) return result;
    const keep = new Set([String(result.target.PropertyBizKey), ...(result.references ?? []).map(r => String(r.PropertyBizKey))]);
    const comparison = result.comparison
        ? { ...result.comparison, properties: result.comparison.properties.filter(p => keep.has(String(p.PropertyBizKey ?? ""))) }
        : result.comparison;
    return {
        ...result,
        nearby: [],
        comparison,
        properties: undefined,
        selection: undefined,
        markers: result.markers?.filter(m => keep.has(String(m.key))),
        financial_keys: result.financial_keys?.filter(k => keep.has(String(k))),
    };
}

export function fromAsk(input: AskAIResult, options: AskOptionsNormalize = {}): AnalysisResult {
    const unscoped = options.wantsNearby === false && input.task?.kind === "compare" ? withoutUnrequestedNearby(input) : input;
    // Hard limit on what a property-vs-nearby answer may contain, whatever the backend sent back.
    const result = options.scope === false ? unscoped : scopeNearest(unscoped);
    const raw = result;
    const extras = extrasFrom(result);
    if (result.target || result.comparison) {
        const target = result.target;
        if (target) {
            return fromNearest(
                target,
                result.nearby ?? [],
                result.comparison,
                result.message ?? describeAsk(result),
                raw,
                extras,
            );
        }
        const comparison = result.comparison as ComparisonResult;
        const answer = result.message ?? describeAsk(result);
        return finalize(
            answer,
            comparison.properties,
            result.task?.subject_key ?? null,
            true,
            [...(comparison.not_found ?? []), ...(result.unresolved ?? [])],
            raw,
            comparison.fields,
            extras,
        );
    }
    if (result.results) {
        return finalize(
            result.message ?? describeAsk(result),
            result.results.map(p => ({ ...p })),
            null,
            false,
            result.unresolved ?? [],
            raw,
            undefined,
            extras,
        );
    }
    return finalize(
        result.message ?? "I couldn't understand that. Try naming a specific property.",
        [],
        null,
        false,
        result.unresolved ?? [],
        raw,
        undefined,
        extras,
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

export function withChart(result: AnalysisResult, chart: ChartRequest | null, answer: string): AnalysisResult {
    return { ...result, id: nextResultId(), answer, chart };
}
