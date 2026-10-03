import type { ColumnType } from "../types";
export declare function humanize(key: string): string;
export declare function inferColumnType(key: string): ColumnType;
export declare function toNumber(value: unknown): number | null;
export declare function formatValue(value: unknown, type: ColumnType): string;
export declare function compact(n: number): string;
