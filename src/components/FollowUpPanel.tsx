import * as React from "react";
import type { FilterOptions, FilterState } from "../types";
import FilterPanel from "./FilterPanel";
import Icon from "./Icons";

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

const LINE = "1px solid var(--ap-line, rgba(15, 23, 42, 0.12))";

export const FollowUpPanel: React.FC<FollowUpPanelProps> = ({
    open, suggestions, disabled, filters, options, activeCount, onToggle, onSuggest, onFiltersChange, onFiltersReset,
}) => {
    const badge = activeCount > 0 ? <span className="ap-badge">{activeCount}</span> : null;

    return (
        <section
            aria-label="Follow-up questions and filters"
            style={{
                flex: open ? "0 0 30%" : "0 0 auto",
                minHeight: open ? 160 : 0,
                display: "flex",
                flexDirection: "column",
                borderTop: LINE,
                background: "#ffffff",
            }}
        >
            {open ? (
                <>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "8px 14px", flex: "0 0 auto" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
                            <span>Follow-up questions &amp; filters</span>
                            {badge}
                        </div>
                        <button type="button" className="ap-btn ap-btn--ghost ap-icon-btn ap-tip" data-tip="Close" aria-label="Close follow-up questions and filters" onClick={onToggle}>
                            <Icon name="close" size={16} />
                        </button>
                    </div>
                    <div style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", padding: "0 14px 14px" }}>
                        {suggestions.length > 0 && (
                            <div className="ap-chips" style={{ marginBottom: 14 }}>
                                {suggestions.map(s => (
                                    <button key={s} type="button" className="ap-chip" disabled={disabled} onClick={() => onSuggest(s)}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="ap-field-label" style={{ marginBottom: 8 }}>Filters</div>
                        <FilterPanel
                            filters={filters}
                            options={options}
                            activeCount={activeCount}
                            onChange={onFiltersChange}
                            onReset={onFiltersReset}
                        />
                    </div>
                </>
            ) : (
                <button
                    type="button"
                    aria-expanded={false}
                    onClick={onToggle}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        width: "100%",
                        padding: "10px 14px",
                        border: 0,
                        background: "transparent",
                        color: "var(--ap-ink, #0f172a)",
                        font: "inherit",
                        fontWeight: 600,
                        cursor: "pointer",
                    }}
                >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        Follow-up questions &amp; filters
                        {badge}
                    </span>
                    <Icon name="chevron" size={16} />
                </button>
            )}
        </section>
    );
};

export default FollowUpPanel;
