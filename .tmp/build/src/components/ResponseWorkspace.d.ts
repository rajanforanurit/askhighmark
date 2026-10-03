import * as React from "react";
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
}
export declare const ResponseWorkspace: React.FC<ResponseWorkspaceProps>;
export default ResponseWorkspace;
