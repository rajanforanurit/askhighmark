import * as React from "react";
import type { ComparisonTableSettings } from "../settings";
import type { TableColumn, TableRow } from "../types";
export interface PropertyComparisonProps {
    columns: TableColumn[];
    rows: TableRow[];
    notFound: string[];
    selectedKey: string | null;
    fontSize: number;
    settings: ComparisonTableSettings;
    onSelect: (key: string) => void;
}
export declare const PropertyComparison: React.FC<PropertyComparisonProps>;
export default PropertyComparison;
