import * as React from "react";
import type { FilterOptions, FilterState } from "../types";
export interface FilterDrawerProps {
    open: boolean;
    filters: FilterState;
    options: FilterOptions;
    activeCount: number;
    onChange: (next: FilterState) => void;
    onReset: () => void;
    onClose: () => void;
}
export declare const FilterDrawer: React.FC<FilterDrawerProps>;
export default FilterDrawer;
