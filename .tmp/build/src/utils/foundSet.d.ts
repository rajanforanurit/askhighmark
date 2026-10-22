import type { AnalysisResult, SelectableProperty } from "../types";
export interface FoundSet {
    keys: string[];
    options: SelectableProperty[];
    pinnedKeys: string[];
    subjectKey: string | null;
}
export declare function isComparisonLike(a: AnalysisResult): boolean;
export declare function ownFilters(a: AnalysisResult): boolean;
export declare function foundKeysOf(a: AnalysisResult): string[];
export declare function resolveTicked(input: AnalysisResult, prior: FoundSet | null): {
    analysis: AnalysisResult;
    missing: string[] | null;
    found: FoundSet | null;
};
