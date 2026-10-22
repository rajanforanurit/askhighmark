import * as React from "react";
import type { ComparisonTableSettings } from "../settings";
import type { SelectionState, TableColumn, TableRow } from "../types";
export interface PropertyComparisonProps {
    columns: TableColumn[];
    rows: TableRow[];
    notFound: string[];
    selectedKey: string | null;
    fontSize: number;
    settings: ComparisonTableSettings;
    onSelect: (key: string) => void;
    selection?: SelectionState | null;
    onSelectionChange?: (keys: string[]) => void;
}
export declare const PropertyComparison: React.FC<PropertyComparisonProps>;
declare const _default: React.NamedExoticComponent<PropertyComparisonProps>;
export default _default;
