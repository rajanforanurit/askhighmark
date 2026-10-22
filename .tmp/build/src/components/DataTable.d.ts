import * as React from "react";
import type { ComparisonTableSettings } from "../settings";
import type { SelectionState, TableColumn, TableRow } from "../types";
export interface DataTableProps {
    columns: TableColumn[];
    rows: TableRow[];
    selectedKey: string | null;
    fontSize: number;
    settings: ComparisonTableSettings;
    onSelect: (key: string) => void;
    selection?: SelectionState | null;
    onSelectionChange?: (keys: string[]) => void;
    query?: string;
    maxHeight?: number;
}
export declare const DataTable: React.FC<DataTableProps>;
declare const _default: React.NamedExoticComponent<DataTableProps>;
export default _default;
