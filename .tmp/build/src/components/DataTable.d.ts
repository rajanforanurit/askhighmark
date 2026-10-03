import * as React from "react";
import type { ComparisonTableSettings } from "../settings";
import type { TableColumn, TableRow } from "../types";
export interface DataTableProps {
    columns: TableColumn[];
    rows: TableRow[];
    selectedKey: string | null;
    fontSize: number;
    settings: ComparisonTableSettings;
    onSelect: (key: string) => void;
}
export declare const DataTable: React.FC<DataTableProps>;
export default DataTable;
