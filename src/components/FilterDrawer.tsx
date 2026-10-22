import * as React from "react";
import type { FilterOptions, FilterState } from "../types";
import FilterPanel from "./FilterPanel";
import Icon from "./Icons";

export interface FilterDrawerProps {
    open: boolean;
    filters: FilterState;
    options: FilterOptions;
    activeCount: number;
    onChange: (next: FilterState) => void;
    onReset: () => void;
    onClose: () => void;
}

const STYLES = `
.hm-drawer {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 20;
    width: 100%;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    background: #ffffff;
    border-right: 1px solid var(--ap-line, rgba(15, 23, 42, 0.12));
    box-shadow: 6px 0 24px rgba(15, 23, 42, 0.14);
    animation: hm-drawer-in 0.22s ease both;
}
.hm-drawer-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex: 0 0 auto;
    padding: 12px 14px;
    border-bottom: 1px solid var(--ap-line, rgba(15, 23, 42, 0.1));
}
.hm-drawer-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    font-size: 15px;
    color: var(--ap-ink, #0f172a);
}
.hm-drawer-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding: 14px;
}
@keyframes hm-drawer-in {
    from { transform: translateX(-100%); opacity: 0.6; }
    to { transform: translateX(0); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
    .hm-drawer { animation: none; }
}
`;

export const FilterDrawer: React.FC<FilterDrawerProps> = ({ open, filters, options, activeCount, onChange, onReset, onClose }) => {
    if (!open) return null;
    return (
        <aside
            className="hm-drawer"
            aria-label="Filters"
            onKeyDown={e => {
                if (e.key === "Escape") onClose();
            }}
        >
            <style>{STYLES}</style>
            <div className="hm-drawer-head">
                <div className="hm-drawer-title">
                    <Icon name="filter" size={16} />
                    Filters
                    {activeCount > 0 && <span className="ap-badge">{activeCount}</span>}
                </div>
                <button type="button" className="ap-btn ap-btn--ghost ap-icon-btn ap-tip" data-tip="Close filters" aria-label="Close filters" onClick={onClose}>
                    <Icon name="close" size={16} />
                </button>
            </div>
            <div className="hm-drawer-body">
                <FilterPanel
                    filters={filters}
                    options={options}
                    activeCount={activeCount}
                    onChange={onChange}
                    onReset={onReset}
                />
            </div>
        </aside>
    );
};

export default FilterDrawer;
