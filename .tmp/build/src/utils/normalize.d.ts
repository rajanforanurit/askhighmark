import type { AskAIResult, ComparisonResult, FinancialsPayload, PropertyRecord, TaskInfo } from "../api";
import type { AnalysisResult, MapProperty, Metric, TableRow } from "../types";
export interface ResultExtras {
    notes?: string[];
    taskId?: string | null;
    taskKind?: TaskInfo["kind"] | null;
    financials?: FinancialsPayload | null;
    financialsError?: string | null;
}
export declare function fromNearest(target: PropertyRecord, nearby: PropertyRecord[], comparison: ComparisonResult | undefined, answer: string, raw: unknown, extras?: ResultExtras): AnalysisResult;
export declare function fromAsk(result: AskAIResult): AnalysisResult;
export declare function toMapProperties(rows: TableRow[]): MapProperty[];
export declare function buildMetrics(rows: TableRow[]): Metric[];
