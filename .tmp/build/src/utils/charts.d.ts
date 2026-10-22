import type { ChartRequest, TableColumn, TableRow } from "../types";
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
export declare const MAX_BARS = 50;
export declare const MAX_SLICES = 12;
export declare const CHART_KEYWORDS: Record<string, RegExp>;
export declare function isChartable(column: TableColumn): boolean;
export declare function supportsShare(column: TableColumn): boolean;
export declare function chartableColumns(columns: TableColumn[], rows: TableRow[]): TableColumn[];
export declare function defaultMetric(columns: TableColumn[], rows: TableRow[], preferred?: string | null): string | null;
export declare function buildChartData(type: string, columns: TableColumn[], rows: TableRow[], metric: string | null, title?: string | null): ChartData | null;
export declare function formatPoint(data: ChartData, value: number): string;
export declare function chartTypeFromText(query: string): string | null;
export interface ChartFollowUp {
    chart: ChartRequest | null;
    label: string;
}
export declare function detectChartFollowUp(query: string, columns: TableColumn[], rows: TableRow[], current: ChartRequest | null): ChartFollowUp | null;
export declare function paletteFor(primary: string, secondary: string, count: number): string[];
