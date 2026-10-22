import type { PropertyRecord } from "../api";
import type { MapProperty } from "../types";
import { toNumber } from "./format";

export function isValidCoordinate(lat: unknown, lng: unknown): boolean {
    const la = toNumber(lat);
    const ln = toNumber(lng);
    if (la === null || ln === null) return false;
    if (la === 0 && ln === 0) return false;
    return la >= -90 && la <= 90 && ln >= -180 && ln <= 180;
}

export function toMapProperty(
    record: Record<string, unknown>,
    key: string,
    isSubject: boolean,
): MapProperty | null {
    if (!isValidCoordinate(record.Latitude, record.Longitude)) return null;
    return {
        key,
        name: String(record.PropertyName ?? "Property"),
        lat: toNumber(record.Latitude) as number,
        lng: toNumber(record.Longitude) as number,
        isSubject,
        values: record,
    };
}

export function isPropertyRecord(value: unknown): value is PropertyRecord {
    return typeof value === "object" && value !== null && "PropertyName" in value;
}
