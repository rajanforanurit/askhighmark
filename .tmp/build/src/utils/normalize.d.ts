import type { AskAIResult, ComparisonResult, PropertyRecord } from "../api";
import type { AnalysisResult, MapProperty, Metric, TableRow } from "../types";
export declare function fromNearest(target: PropertyRecord, nearby: PropertyRecord[], comparison: ComparisonResult | undefined, answer: string, raw: unknown): AnalysisResult;
export declare function fromAsk(result: AskAIResult): AnalysisResult;
export declare function toMapProperties(rows: TableRow[]): MapProperty[];
export declare function buildMetrics(rows: TableRow[]): Metric[];
