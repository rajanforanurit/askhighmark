import * as React from "react";
import type { FinancialPeriod, FinancialsPayload } from "../api";
import type { VisualSettings } from "../settings";
import type { ChatEntry, FilterOptions, FilterState } from "../types";
export interface ResponseWorkspaceProps {
    entry: ChatEntry | null;
    busy: boolean;
    thinkingLabel: string | null;
    filters: FilterState;
    options: FilterOptions;
    settings: VisualSettings;
    onFiltersReset: () => void;
    onRetry: (entry: ChatEntry) => void;
    onLoadFinancials?: (keys: string[], view: "actual" | "budget", period: FinancialPeriod | null) => Promise<FinancialsPayload>;
}
export declare const ResponseWorkspace: React.FC<ResponseWorkspaceProps>;
export default ResponseWorkspace;
