import type { ChartRequest, TableColumn, TableRow } from "../types";
import { formatValue, toNumber } from "./format";

export interface ChartPoint {
    key: string;
    label: string;
    value: number;
    isOther?: boolean;
}

export interface ChartData {
    type: string;
    title: string;
    metric: string;
    metricLabel: string;
    column: TableColumn;
    points: ChartPoint[];
    total: number;
}

export const MAX_BARS = 50;
export const MAX_SLICES = 12;

const CHARTABLE_TYPES = new Set(["integer", "number", "pct", "percent", "currency", "currency0", "distance"]);
const RATIO_TYPES = new Set(["pct", "percent", "currency", "distance"]);

export const CHART_KEYWORDS: Record<string, RegExp> = {
    bar: /\b(bar\s*(chart|graph|plot)s?|bars|column\s*chart|histogram)\b/i,
    pie: /\b(pie\s*(chart|graph)s?|pie|donut\s*chart|doughnut\s*chart)\b/i,
};

const TABLE_KEYWORD = /\b(table|tabular|grid|list view)\b/i;
const REFERENCE_WORDS = /\b(this|that|it|these|those|same|results?|previous|last|current|them|the above)\b/i;
const DATA_WORDS = /\d|\b(within|miles?|near|nearest|nearby|compare|comparison|largest|smallest|biggest|top|bottom|most|least|where|whose|than|between|state|city|market|property|properties|name)\b/i;

export function isChartable(column: TableColumn): boolean {
    return CHARTABLE_TYPES.has(column.type);
}

export function supportsShare(column: TableColumn): boolean {
    return !RATIO_TYPES.has(column.type);
}

export function chartableColumns(columns: TableColumn[], rows: TableRow[]): TableColumn[] {
    return columns.filter(c => isChartable(c) && rows.some(r => toNumber(r.values[c.key]) !== null));
}

export function defaultMetric(columns: TableColumn[], rows: TableRow[], preferred?: string | null): string | null {
    const options = chartableColumns(columns, rows);
    if (options.length === 0) return null;
    if (preferred) {
        const hit = options.find(c => c.key === preferred || c.key.toLowerCase() === preferred.toLowerCase());
        if (hit) return hit.key;
    }
    const units = options.find(c => /^units$/i.test(c.key));
    return (units ?? options[0]).key;
}

export function buildChartData(
    type: string,
    columns: TableColumn[],
    rows: TableRow[],
    metric: string | null,
    title?: string | null,
): ChartData | null {
    if (!metric) return null;
    const column = columns.find(c => c.key === metric);
    if (!column || !isChartable(column)) return null;
    let points: ChartPoint[] = [];
    rows.forEach(r => {
        const value = toNumber(r.values[metric]);
        const label = r.values.PropertyName;
        if (value === null || label === undefined || label === null) return;
        points.push({ key: r.key, label: String(label), value });
    });
    if (type === "pie") {
        if (!supportsShare(column)) return null;
        points = points.filter(p => p.value > 0);
    }
    if (points.length === 0) return null;
    points.sort((a, b) => b.value - a.value);
    if (type === "pie") {
        if (points.length > MAX_SLICES) {
            const head = points.slice(0, MAX_SLICES - 1);
            const rest = points.slice(MAX_SLICES - 1).reduce((s, p) => s + p.value, 0);
            head.push({ key: "__other__", label: "Other", value: rest, isOther: true });
            points = head;
        }
    } else {
        points = points.slice(0, MAX_BARS);
    }
    const total = points.reduce((s, p) => s + p.value, 0);
    const fallbackTitle = type === "pie" ? `${column.label} share by property` : `${column.label} by property`;
    return { type, title: title || fallbackTitle, metric, metricLabel: column.label, column, points, total };
}

export function formatPoint(data: ChartData, value: number): string {
    return formatValue(value, data.column.type, data.column.decimals);
}

export function chartTypeFromText(query: string): string | null {
    for (const [type, pattern] of Object.entries(CHART_KEYWORDS)) {
        if (pattern.test(query)) return type;
    }
    return null;
}

export interface ChartFollowUp {
    chart: ChartRequest | null;
    label: string;
}

function metricFromText(query: string, columns: TableColumn[], rows: TableRow[]): string | null {
    const text = query.toLowerCase();
    for (const column of chartableColumns(columns, rows)) {
        const words = [column.label.toLowerCase(), column.key.toLowerCase()];
        if (words.some(w => w.length > 2 && text.includes(w))) return column.key;
    }
    if (/\boccupanc/.test(text)) {
        const hit = chartableColumns(columns, rows).find(c => /occup/i.test(c.key));
        if (hit) return hit.key;
    }
    return null;
}

export function detectChartFollowUp(
    query: string,
    columns: TableColumn[],
    rows: TableRow[],
    current: ChartRequest | null,
): ChartFollowUp | null {
    const text = query.trim();
    if (!text || rows.length === 0) return null;
    const words = text.split(/\s+/);
    if (words.length > 14) return null;
    if (DATA_WORDS.test(text)) return null;

    const asTable = TABLE_KEYWORD.test(text) && chartTypeFromText(text) === null;
    if (asTable) {
        if (!REFERENCE_WORDS.test(text) && words.length > 6) return null;
        return { chart: null, label: "Showing the results as a table." };
    }

    const type = chartTypeFromText(text);
    if (!type) return null;
    if (!REFERENCE_WORDS.test(text) && !/^(please\s+)?(show|display|make|turn|convert|switch|plot|draw|chart|as|in)\b/i.test(text)) return null;

    const metric = metricFromText(text, columns, rows) ?? defaultMetric(columns, rows, current?.metric ?? null);
    if (!metric) return null;
    const data = buildChartData(type, columns, rows, metric);
    if (!data) return null;
    const noun = type === "pie" ? "pie chart" : type === "bar" ? "bar chart" : `${type} chart`;
    return { chart: { type, metric }, label: `Here's ${data.metricLabel.toLowerCase()} as a ${noun}.` };
}

export function paletteFor(primary: string, secondary: string, count: number): string[] {
    const base = [
        primary, "#0f9d8a", "#e8833a", "#8b5cf6", "#d9486e", "#3b9ae1",
        "#7a8b2a", "#c28a00", "#5b6b7f", "#14b8a6", "#a855f7", "#ef4444",
    ];
    if (secondary && !base.includes(secondary)) base.splice(1, 0, secondary);
    const out: string[] = [];
    for (let i = 0; i < count; i += 1) out.push(base[i % base.length]);
    return out;
}
