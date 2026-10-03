import * as React from "react";
import type { ChatEntry } from "../types";
export type PanelView = "chat" | "history";
export interface TopActionsProps {
    view: PanelView;
    historyCount: number;
    filterOpen: boolean;
    activeFilters: number;
    filterDisabled: boolean;
    saveState: ChatEntry["saveState"];
    saveDisabled: boolean;
    clearDisabled: boolean;
    onChat: () => void;
    onHistory: () => void;
    onFilter: () => void;
    onSave: () => void;
    onClear: () => void;
}
export declare const TopActions: React.FC<TopActionsProps>;
export default TopActions;
