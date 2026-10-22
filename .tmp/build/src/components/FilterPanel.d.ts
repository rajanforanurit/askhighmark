import * as React from "react";
import type { FilterOptions, FilterState } from "../types";
export interface FilterPanelProps {
    filters: FilterState;
    options: FilterOptions;
    activeCount: number;
    onChange: (next: FilterState) => void;
    onReset: () => void;
}
export declare const FilterPanel: React.FC<FilterPanelProps>;
export default FilterPanel;
