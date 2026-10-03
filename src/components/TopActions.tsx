import * as React from "react";
import type { ChatEntry } from "../types";
import Icon from "./Icons";

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

const STYLES = `
.hm-top {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 0 0 auto;
    padding: 10px 16px;
    box-sizing: border-box;
    background: #ffffff;
    border-bottom: 1px solid var(--ap-line, rgba(15, 23, 42, 0.1));
    overflow-x: auto;
    scrollbar-width: none;
}
.hm-top::-webkit-scrollbar { display: none; }
.hm-top-tabs {
    display: inline-flex;
    gap: 2px;
    padding: 3px;
    border-radius: 11px;
    background: #f1f5f9;
    flex: 0 0 auto;
}
.hm-top-tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 16px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: #475569;
    font: inherit;
    font-size: 13.5px;
    font-weight: 600;
    white-space: nowrap;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}
.hm-top-tab:hover { color: #0f172a; }
.hm-top-tab[aria-pressed="true"] {
    background: #ffffff;
    color: #0f172a;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.18);
}
.hm-top-count {
    min-width: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: #e2e8f0;
    color: #334155;
    font-size: 11px;
    line-height: 18px;
    text-align: center;
}
.hm-top-sep {
    flex: 0 0 auto;
    width: 1px;
    height: 24px;
    background: var(--ap-line, rgba(15, 23, 42, 0.14));
}
.hm-top-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    flex: 0 0 auto;
    padding: 7px 16px;
    border: 1.5px solid rgba(15, 23, 42, 0.16);
    border-radius: 10px;
    background: #ffffff;
    color: #0f172a;
    font: inherit;
    font-size: 13.5px;
    font-weight: 600;
    white-space: nowrap;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.hm-top-btn:hover:not(:disabled) { background: #f8fafc; border-color: rgba(15, 23, 42, 0.3); }
.hm-top-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.hm-top-btn:focus-visible,
.hm-top-tab:focus-visible { outline: 2px solid var(--ap-accent, #14b8a6); outline-offset: 2px; }
.hm-top-filter {
    border-color: var(--ap-accent, #14b8a6);
    background: var(--ap-accent-soft, rgba(20, 184, 166, 0.1));
    color: var(--ap-accent-strong, #0f766e);
}
.hm-top-filter:hover:not(:disabled) { background: var(--ap-accent-soft, rgba(20, 184, 166, 0.18)); border-color: var(--ap-accent-strong, #0f766e); }
.hm-top-filter[aria-pressed="true"] {
    background: var(--ap-accent, #14b8a6);
    border-color: var(--ap-accent, #14b8a6);
    color: #ffffff;
}
.hm-top-badge {
    min-width: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: #ffffff;
    color: var(--ap-accent-strong, #0f766e);
    font-size: 11px;
    font-weight: 700;
    line-height: 18px;
    text-align: center;
}
.hm-top-saved { color: #15803d; border-color: rgba(21, 128, 61, 0.45); }
.hm-top-clear { border-color: transparent; background: transparent; color: #475569; }
.hm-top-clear:hover:not(:disabled) { background: #f1f5f9; border-color: transparent; }
`;

function saveLabel(state: ChatEntry["saveState"]): string {
    if (state === "saving") return "Saving…";
    if (state === "saved") return "Saved";
    if (state === "failed") return "Retry Save";
    return "Save";
}

export const TopActions: React.FC<TopActionsProps> = ({
    view, historyCount, filterOpen, activeFilters, filterDisabled, saveState, saveDisabled, clearDisabled,
    onChat, onHistory, onFilter, onSave, onClear,
}) => (
    <nav className="hm-top" aria-label="Actions">
        <style>{STYLES}</style>
        <div className="hm-top-tabs" role="group" aria-label="Panel">
            <button type="button" className="hm-top-tab" aria-pressed={view === "chat"} onClick={onChat}>
                <Icon name="chat" size={15} />
                Chat
            </button>
            <button type="button" className="hm-top-tab" aria-pressed={view === "history"} onClick={onHistory}>
                <Icon name="history" size={15} />
                History
                {historyCount > 0 && <span className="hm-top-count">{historyCount}</span>}
            </button>
        </div>
        <span className="hm-top-sep" aria-hidden="true" />
        <button
            type="button"
            className="hm-top-btn hm-top-filter"
            aria-pressed={filterOpen}
            aria-expanded={filterOpen}
            disabled={filterDisabled}
            title={filterDisabled ? "Filters are available once you have a result" : filterOpen ? "Hide filters" : "Show filters"}
            onClick={onFilter}
        >
            <Icon name="filter" size={15} />
            Filter
            {activeFilters > 0 && <span className="hm-top-badge">{activeFilters}</span>}
        </button>
        <button
            type="button"
            className={`hm-top-btn${saveState === "saved" ? " hm-top-saved" : ""}`}
            disabled={saveDisabled}
            title="Save this response to your History"
            onClick={onSave}
        >
            <Icon name={saveState === "saved" ? "check" : "save"} size={15} />
            {saveLabel(saveState)}
        </button>
        <button type="button" className="hm-top-btn hm-top-clear" disabled={clearDisabled} title="Clear and start a new chat" onClick={onClear}>
            <Icon name="reset" size={15} />
            Clear
        </button>
    </nav>
);

export default TopActions;
