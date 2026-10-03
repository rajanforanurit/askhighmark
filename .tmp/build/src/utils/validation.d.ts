import type { PropertyRecord } from "../api";
import type { MapProperty } from "../types";
export declare function isValidCoordinate(lat: unknown, lng: unknown): boolean;
export declare function toMapProperty(record: Record<string, unknown>, key: string, isSubject: boolean): MapProperty | null;
export declare function isPropertyRecord(value: unknown): value is PropertyRecord;
