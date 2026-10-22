import type { FinancialsPayload, FinancialView, TaskInfo } from "./api";
export type ColumnType = "text" | "integer" | "currency" | "currency0" | "percent" | "year" | "distance" | "number" | "pct";
export interface TableColumn {
    key: string;
    label: string;
    type: ColumnType;
    decimals?: number;
}
export interface TableRow {
    key: string;
    values: Record<string, unknown>;
    isSubject: boolean;
}
export interface Metric {
    id: string;
    label: string;
    value: string;
    hint?: string;
}
export type ResultKind = "map" | "comparison" | "table" | "text" | "mixed";
export type LayoutSection = "map" | "financial" | "properties";
export interface LayoutInfo {
    focus: string;
    sections: LayoutSection[];
}
export interface LocationInfo {
    requested: string;
    type: string;
    status: "exact" | "nearby" | "empty" | "unresolved";
    message: string | null;
    scope?: string | null;
    radiusMiles?: number | null;
    origin?: {
        lat: number;
        lng: number;
    } | null;
}
export interface ResultWarning {
    code: string;
    message: string;
}
export interface ConversationContext {
    reference_keys?: string[];
    result_keys?: string[];
    [key: string]: unknown;
}
export interface SelectableProperty {
    key: string;
    name: string;
    subtitle: string;
    distance: number | null;
    values: Record<string, unknown>;
}
export type SelectionStatus = "idle" | "loading" | "error";
export interface SelectionState {
    options: SelectableProperty[];
    selectedKeys: string[];
    subjectKey: string | null;
    pinnedKeys: string[];
    defaultCount: number;
    totalAvailable?: number | null;
    kind: "nearest" | "compare" | "list" | "search";
    fields: string[];
    view: FinancialView | null;
    status: SelectionStatus;
}
export interface AnalysisResult {
    id: string;
    kind: ResultKind;
    answer: string;
    subjectKey: string | null;
    columns: TableColumn[];
    rows: TableRow[];
    comparable: boolean;
    unresolved: string[];
    raw: unknown;
    notes?: string[];
    taskId?: string | null;
    taskKind?: TaskInfo["kind"] | null;
    financials?: FinancialsPayload | null;
    financialsError?: string | null;
    chart?: ChartRequest | null;
    period?: TaskInfo["period"] | null;
    metricKeys?: string[];
    area?: AreaInfo | null;
    financialsPending?: {
        keys: string[];
        view: "actual" | "budget" | "both";
    } | null;
    selection?: SelectionState | null;
    layout?: LayoutInfo | null;
    location?: LocationInfo | null;
    warnings?: ResultWarning[];
    showProperties?: boolean;
}
export interface AreaBounds {
    north: number;
    south: number;
    east: number;
    west: number;
}
export interface AreaRetry {
    name: string;
    lat: number;
    lng: number;
    bounds: AreaBounds | null;
}
export interface AreaInfo {
    name: string;
    lat: number;
    lng: number;
    bounds: AreaBounds | null;
    radiusMiles: number | null;
    total: number;
}
export interface ChartRequest {
    type: string;
    metric: string | null;
    title?: string | null;
}
export type FinancialMode = "off" | "actual" | "budget";
export interface MapProperty {
    key: string;
    name: string;
    lat: number;
    lng: number;
    isSubject: boolean;
    values: Record<string, unknown>;
}
export type SaveState = "idle" | "saving" | "saved" | "failed";
export interface ChatEntry {
    id: string;
    role: "user" | "ai";
    text: string;
    query?: string;
    isError?: boolean;
    result?: AnalysisResult;
    saveState?: SaveState;
    errorTitle?: string;
    retry?: {
        type: "ask" | "nearby" | "area";
        text: string;
        area?: AreaRetry;
    };
}
export type RangeKey = "units" | "yearBuilt" | "stories" | "unitSize" | "proximity" | "rentPsf";
export interface FilterState {
    submarket: string;
    zip: string;
    classes: string[];
    ranges: Partial<Record<RangeKey, [number, number]>>;
}
export interface RangeBounds {
    min: number;
    max: number;
}
export interface FilterOptions {
    submarkets: string[];
    zips: string[];
    bounds: Partial<Record<RangeKey, RangeBounds>>;
    hasSubmarket: boolean;
    hasZip: boolean;
    hasClass: boolean;
}
export type Phase = "idle" | "analyzing" | "locating" | "nearby" | "preparing" | "area";
export interface ToastMessage {
    id: number;
    text: string;
    tone: "info" | "error";
}
