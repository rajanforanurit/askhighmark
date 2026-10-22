import type { FilterOptions, FilterState, TableRow } from "../types";
export declare const CLASS_OPTIONS: string[];
export declare function createDefaultFilters(): FilterState;
export declare function classifyClass(value: unknown): string;
export declare function buildOptions(rows: TableRow[]): FilterOptions;
export declare function countActive(filters: FilterState, options: FilterOptions): number;
export declare function applyFilters(rows: TableRow[], filters: FilterState, options: FilterOptions): TableRow[];
export declare function toPayload(filters: FilterState, options: FilterOptions): Record<string, string | string[] | [number, number]>;
