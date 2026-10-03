import type { ColumnType } from "../types";

const FIELD_LABELS: Record<string, string> = {
    PropertyName: "Property",
    City: "City",
    State: "State",
    Market: "Market",
    AssetType: "Asset Type",
    PropertySizeCategory: "Size",
    PropertyAgeBucket: "Age",
    YearBuilt: "Year Built",
    PropertyStatus: "Status",
    ManagementCompany: "Management Co.",
    Latitude: "Latitude",
    Longitude: "Longitude",
    distance_miles: "Distance",
};

export function humanize(key: string): string {
    if (FIELD_LABELS[key]) return FIELD_LABELS[key];
    return key
        .replace(/[_\-]+/g, " ")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^./, c => c.toUpperCase());
}

export function inferColumnType(key: string): ColumnType {
    const k = key.toLowerCase();
    if (/occup/.test(k)) return "percent";
    if (/rent|psf|persqft|persquare/.test(k)) {
        return /sqft|psf|square|sf/.test(k) ? "currency" : "currency0";
    }
    if (/year/.test(k)) return "year";
    if (/distance|mile/.test(k)) return "distance";
    if (/unit|stories|story|height|sqft|size|count|number/.test(k) && !/category|bucket|status/.test(k)) return "integer";
    return "text";
}

export function toNumber(value: unknown): number | null {
    if (typeof value === "number") return isFinite(value) ? value : null;
    if (typeof value === "string" && value.trim() !== "") {
        const n = Number(value.replace(/[$,%\s,]/g, ""));
        return isFinite(n) ? n : null;
    }
    return null;
}

export function formatValue(value: unknown, type: ColumnType): string {
    if (value === null || value === undefined || value === "") return "—";
    if (type === "text") return String(value);
    const n = toNumber(value);
    if (n === null) return String(value);
    switch (type) {
        case "currency":
            return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        case "currency0":
            return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
        case "percent": {
            const pct = n > 0 && n <= 1 ? n * 100 : n;
            return `${pct.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
        }
        case "year":
            return String(Math.round(n));
        case "distance":
            return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} mi`;
        case "integer":
            return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
        default:
            return String(value);
    }
}

export function compact(n: number): string {
    return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}
