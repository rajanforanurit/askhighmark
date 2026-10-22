import * as React from "react";
import type { ChartSettings } from "../settings";
import type { ChartRequest, TableColumn, TableRow } from "../types";
import { type ChartData } from "../utils/charts";
export interface ChartRendererProps {
    data: ChartData;
    settings: ChartSettings;
    selectedKey: string | null;
    subjectKey: string | null;
    width: number;
    onSelect: (key: string) => void;
}
export interface ChartTypeDefinition {
    type: string;
    label: string;
    supports: (column: TableColumn) => boolean;
    render: React.FC<ChartRendererProps>;
}
export declare function registerChartType(definition: ChartTypeDefinition): void;
export declare function chartTypes(): ChartTypeDefinition[];
export interface ChartPanelProps {
    columns: TableColumn[];
    rows: TableRow[];
    chart: ChartRequest;
    settings: ChartSettings;
    selectedKey: string | null;
    subjectKey: string | null;
    onSelect: (key: string) => void;
    onChange: (next: ChartRequest) => void;
}
export declare const ChartPanel: React.FC<ChartPanelProps>;
declare const _default: React.NamedExoticComponent<ChartPanelProps>;
export default _default;
