import type { RangeKey } from "../types";
export declare function normalizeKey(key: string): string;
export declare function pick(record: Record<string, unknown>, aliases: string[]): unknown;
export declare function hasAlias(records: Record<string, unknown>[], aliases: string[]): boolean;
export declare const FIELD_ALIASES: {
    readonly submarket: readonly ["Submarket", "SubMarket", "Market"];
    readonly zip: readonly ["ZIP", "Zip", "ZipCode", "PostalCode"];
    readonly propertyClass: readonly ["PropertyClass", "Class", "AssetClass", "BuildingClass"];
    readonly units: readonly ["NumberOfUnits", "Units", "UnitCount", "TotalUnits", "NumUnits"];
    readonly yearBuilt: readonly ["YearBuilt"];
    readonly stories: readonly ["Stories", "BuildingHeight", "NumberOfStories", "BuildingHeightStories", "NumStories"];
    readonly unitSize: readonly ["AverageUnitSize", "AvgUnitSize", "AvgUnitSizeSqFt", "AverageUnitSizeSqFt", "AvgSqFt"];
    readonly proximity: readonly ["distance_miles", "DistanceMiles", "Distance"];
    readonly rentPsf: readonly ["RentPerSqFt", "RentPerSquareFoot", "RentPSF", "AvgRentPerSqFt", "RentPerSF"];
    readonly occupancy: readonly ["Occupancy", "OccupancyRate", "OccupancyPct", "PhysicalOccupancy"];
    readonly rent: readonly ["Rent", "AvgRent", "AverageRent"];
};
export declare const RANGE_DEFS: {
    key: RangeKey;
    label: string;
    aliases: readonly string[];
    step: number;
    type: "integer" | "year" | "currency" | "distance";
}[];
