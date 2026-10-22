import type { AskAIResult } from "../api";
export declare const DEFAULT_NEARBY = 6;
export declare const MAX_NEARBY = 50;
type Scoped = Pick<AskAIResult, "target" | "nearby" | "comparison" | "properties" | "selection" | "task" | "markers" | "financial_keys" | "warnings">;
export interface NearbyScope {
    keys: string[];
    mode: "default" | "radius" | "filtered";
    matched: number;
}
export declare function nearbyScope(result: Scoped): NearbyScope | null;
export declare function scopeNearest<T extends Scoped>(result: T): T;
export {};
