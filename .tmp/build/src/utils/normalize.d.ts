import type { AskAIResult, ComparisonResult, ContractTable, FinancialsPayload, PropertyRecord, SelectionFields, TaskInfo } from "../api";
import type { AnalysisResult, AreaInfo, ChartRequest, LayoutInfo, LocationInfo, MapProperty, Metric, ResultWarning, SelectionState, TableRow } from "../types";
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
    financialsPending?: {
        keys: string[];
        view: "actual" | "budget" | "both";
    } | null;
    selection?: SelectionState | null;
    layout?: LayoutInfo | null;
    location?: LocationInfo | null;
    warnings?: ResultWarning[];
    referenceKeys?: string[];
}
export declare function selectionFrom(result: SelectionFields & {
    task?: TaskInfo;
    financials?: FinancialsPayload | null;
    view?: string | null;
}, fallbackKind?: SelectionState["kind"]): SelectionState | null;
export declare function fromSelection(prev: AnalysisResult, response: AskAIResult, sentKeys: string[]): AnalysisResult;
export declare function fromNearest(target: PropertyRecord, nearby: PropertyRecord[], comparison: ComparisonResult | undefined, answer: string, raw: unknown, extras?: ResultExtras): AnalysisResult;
export interface AskOptionsNormalize {
    wantsNearby?: boolean;
    scope?: boolean;
}
export declare function fromAsk(input: AskAIResult, options?: AskOptionsNormalize): AnalysisResult;
export declare function toMapProperties(rows: TableRow[]): MapProperty[];
export declare function buildMetrics(rows: TableRow[]): Metric[];
export declare function withChart(result: AnalysisResult, chart: ChartRequest | null, answer: string): AnalysisResult;
