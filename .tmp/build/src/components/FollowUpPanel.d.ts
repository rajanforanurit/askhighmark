import * as React from "react";
import type { FilterOptions, FilterState } from "../types";
export interface FollowUpPanelProps {
    open: boolean;
    suggestions: string[];
    disabled: boolean;
    filters: FilterState;
    options: FilterOptions;
    activeCount: number;
    onToggle: () => void;
    onSuggest: (text: string) => void;
    onFiltersChange: (next: FilterState) => void;
    onFiltersReset: () => void;
}
export declare const FollowUpPanel: React.FC<FollowUpPanelProps>;
export default FollowUpPanel;
