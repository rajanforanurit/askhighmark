import type { RangeKey } from "../types";

export function normalizeKey(key: string): string {
    return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function pick(record: Record<string, unknown>, aliases: string[]): unknown {
    const wanted = aliases.map(normalizeKey);
    for (const key of Object.keys(record)) {
        if (wanted.includes(normalizeKey(key))) {
            const v = record[key];
            if (v !== null && v !== undefined && v !== "") return v;
        }
    }
    return undefined;
}

export function hasAlias(records: Record<string, unknown>[], aliases: string[]): boolean {
    return records.some(r => pick(r, aliases) !== undefined);
}

export const FIELD_ALIASES = {
    submarket: ["Submarket", "SubMarket", "Market"],
    zip: ["ZIP", "Zip", "ZipCode", "PostalCode"],
    propertyClass: ["PropertyClass", "Class", "AssetClass", "BuildingClass"],
    units: ["NumberOfUnits", "Units", "UnitCount", "TotalUnits", "NumUnits"],
    yearBuilt: ["YearBuilt"],
    stories: ["Stories", "BuildingHeight", "NumberOfStories", "BuildingHeightStories", "NumStories"],
    unitSize: ["AverageUnitSize", "AvgUnitSize", "AvgUnitSizeSqFt", "AverageUnitSizeSqFt", "AvgSqFt"],
    proximity: ["distance_miles", "DistanceMiles", "Distance"],
    rentPsf: ["RentPerSqFt", "RentPerSquareFoot", "RentPSF", "AvgRentPerSqFt", "RentPerSF"],
    occupancy: ["Occupancy", "OccupancyRate", "OccupancyPct", "PhysicalOccupancy"],
    rent: ["Rent", "AvgRent", "AverageRent"],
} as const;

export const RANGE_DEFS: { key: RangeKey; label: string; aliases: readonly string[]; step: number; type: "integer" | "year" | "currency" | "distance" }[] = [
    { key: "units", label: "Number of Units", aliases: FIELD_ALIASES.units, step: 1, type: "integer" },
    { key: "yearBuilt", label: "Year Built", aliases: FIELD_ALIASES.yearBuilt, step: 1, type: "year" },
    { key: "stories", label: "Building Height (Stories)", aliases: FIELD_ALIASES.stories, step: 1, type: "integer" },
    { key: "unitSize", label: "Average Unit Size (SqFt)", aliases: FIELD_ALIASES.unitSize, step: 1, type: "integer" },
    { key: "proximity", label: "Proximity to Subject (Miles)", aliases: FIELD_ALIASES.proximity, step: 0.1, type: "distance" },
    { key: "rentPsf", label: "Rent Per Square Foot", aliases: FIELD_ALIASES.rentPsf, step: 0.01, type: "currency" },
];
