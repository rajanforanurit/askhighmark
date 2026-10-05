import type { FinancialsPayload, TaskInfo } from "./api";

export type ColumnType = "text" | "integer" | "currency" | "currency0" | "percent" | "year" | "distance";

export interface TableColumn {
    key: string;
    label: string;
    type: ColumnType;
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
    retry?: { type: "ask" | "nearby"; text: string };
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

export type Phase = "idle" | "analyzing" | "locating" | "nearby" | "preparing";

export interface ToastMessage {
    id: number;
    text: string;
    tone: "info" | "error";
}