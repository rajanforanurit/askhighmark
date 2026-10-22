import { type BackendConfig, type ComparisonResult, type NearestResult } from "../api";
export type NearestWithComparison = NearestResult & {
    comparison: ComparisonResult;
};
export declare function compareWithinRadius(cfg: BackendConfig, bizKey: string, radiusMiles: number): Promise<NearestWithComparison>;
