import * as React from "react";
import type { ComparisonTableSettings } from "../settings";
import type { SelectionState, TableColumn, TableRow } from "../types";
import { formatValue, toNumber } from "../utils/format";

export interface PropertyComparisonProps {
    columns: TableColumn[];
    rows: TableRow[];
    notFound: string[];
    selectedKey: string | null;
    fontSize: number;
    settings: ComparisonTableSettings;
    onSelect: (key: string) => void;
    selection?: SelectionState | null;
    onSelectionChange?: (keys: string[]) => void;
}

const MAX_LISTED = 500;
const COLUMN_MIN_WIDTH = 150;
const LABEL_MIN_WIDTH = 160;

const DELTA_TYPES = new Set(["integer", "currency", "currency0", "percent", "distance", "number", "pct"]);

// Metrics are the row labels, so they stay pinned on the left while the property columns scroll sideways.
const CORNER_CELL: React.CSSProperties = {
    position: "sticky",
    left: 0,
    top: 0,
    zIndex: 4,
    minWidth: LABEL_MIN_WIDTH,
    verticalAlign: "bottom",
    background: "var(--ap-head-bg, #f3f5f9)",
    borderRight: "1px solid var(--ap-table-line, #e5e7eb)",
};
const LABEL_CELL: React.CSSProperties = {
    position: "sticky",
    left: 0,
    zIndex: 2,
    minWidth: LABEL_MIN_WIDTH,
    background: "inherit",
    fontWeight: 600,
    borderRight: "1px solid var(--ap-table-line, #e5e7eb)",
};
const HEAD_CELL: React.CSSProperties = {
    minWidth: COLUMN_MIN_WIDTH,
    verticalAlign: "bottom",
    borderLeft: "1px solid var(--ap-table-line, #e5e7eb)",
};
const SELECTED_BG = "var(--ap-accent-soft)";

function delta(value: unknown, base: unknown, column: TableColumn): { text: string; up: boolean } | null {
    if (!DELTA_TYPES.has(column.type)) return null;
    const v = toNumber(value);
    const b = toNumber(base);
    if (v === null || b === null || v === b) return null;
    const diff = v - b;
    const sign = diff > 0 ? "+" : "−";
    const text = `${sign}${formatValue(Math.abs(diff), column.type === "percent" && Math.abs(diff) <= 1 ? "percent" : column.type, column.decimals)} vs subject`;
    return { text, up: diff > 0 };
}

export const PropertyComparison: React.FC<PropertyComparisonProps> = ({
    columns, rows, notFound, selectedKey, fontSize, settings, onSelect, selection, onSelectionChange,
}) => {
    const ordered = React.useMemo(
        () => [...rows.filter(r => r.isSubject), ...rows.filter(r => !r.isSubject)],
        [rows],
    );
    const subject = ordered.find(r => r.isSubject) ?? null;
    const fields = columns.filter(c => c.key !== "PropertyName");

    const chosenKeys = React.useMemo(() => new Set(selection?.selectedKeys ?? []), [selection]);
    const ticked = React.useMemo(
        () => (selection ? selection.options.filter(o => chosenKeys.has(o.key)) : []),
        [selection, chosenKeys],
    );
    const unticked = React.useMemo(
        () => (selection ? selection.options.filter(o => !chosenKeys.has(o.key)) : []),
        [selection, chosenKeys],
    );
    const toggle = (key: string) => {
        if (!selection || !onSelectionChange) return;
        onSelectionChange(chosenKeys.has(key) ? selection.selectedKeys.filter(k => k !== key) : [...selection.selectedKeys, key]);
    };
    const remove = (key: string) => {
        if (selection && onSelectionChange) onSelectionChange(selection.selectedKeys.filter(k => k !== key));
    };

    const style = {
        "--ap-table-fs": `${fontSize}px`,
        "--ap-head-bg": settings.headerBg,
        "--ap-head-text": settings.headerColor,
        "--ap-row-bg": settings.rowBg,
        "--ap-row-alt": settings.altRowBg,
        "--ap-table-line": settings.borderColor,
        "--ap-table-text": settings.textColor,
        height: "100%",
        maxHeight: "none",
        overflow: "auto",
    } as React.CSSProperties;

    return (
        <div className="ap-table-wrap" style={style}>
            <table className="ap-table">
                <thead>
                    <tr>
                        <th scope="col" style={CORNER_CELL}>Metric</th>
                        {ordered.map(r => {
                            const isSelected = r.key === selectedKey;
                            const pinned = Boolean(selection?.pinnedKeys.includes(r.key));
                            return (
                                <th key={r.key} scope="col" style={{ ...HEAD_CELL, ...(isSelected ? { background: SELECTED_BG } : null) }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                                        {selection && (
                                            <input
                                                type="checkbox"
                                                checked
                                                disabled={pinned}
                                                title={pinned ? "Reference properties are always shown" : "Remove from comparison"}
                                                aria-label={`Remove ${String(r.values.PropertyName ?? "property")}`}
                                                onChange={() => remove(r.key)}
                                                style={{ marginTop: 2, flexShrink: 0, accentColor: "var(--ap-accent)" }}
                                            />
                                        )}
                                        <div style={{ minWidth: 0, maxWidth: 220 }}>
                                            <button
                                                type="button"
                                                onClick={() => onSelect(r.key)}
                                                aria-pressed={isSelected}
                                                style={{
                                                    color: isSelected ? "var(--ap-accent-strong)" : undefined,
                                                    textAlign: "left",
                                                    whiteSpace: "normal",
                                                    lineHeight: 1.3,
                                                }}
                                            >
                                                {String(r.values.PropertyName ?? "Property")}
                                            </button>
                                            {r.isSubject && (
                                                <div>
                                                    <span className="ap-tag" style={{ marginLeft: 0 }}>
                                                        {selection && selection.pinnedKeys.length > 1 ? "Reference" : "Subject"}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {fields.map(f => {
                        const numeric = DELTA_TYPES.has(f.type);
                        return (
                            <tr key={f.key} style={{ cursor: "default" }}>
                                <td style={LABEL_CELL}>{f.label}</td>
                                {ordered.map(r => {
                                    const d = subject && !r.isSubject ? delta(r.values[f.key], subject.values[f.key], f) : null;
                                    return (
                                        <td
                                            key={r.key}
                                            style={{
                                                borderLeft: "1px solid var(--ap-table-line, #e5e7eb)",
                                                textAlign: numeric ? "right" : "left",
                                                ...(r.key === selectedKey ? { background: SELECTED_BG } : null),
                                            }}
                                        >
                                            {formatValue(r.values[f.key], f.type, f.decimals)}
                                            {d && <span className={`ap-delta ${d.up ? "ap-delta--up" : "ap-delta--down"}`}>{d.text}</span>}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                    {notFound.length > 0 && (
                        <tr style={{ cursor: "default" }}>
                            <td colSpan={ordered.length + 1} style={{ color: "var(--ap-danger)" }}>
                                Not found: {notFound.join(", ")}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            {selection && (
                <div style={{ position: "sticky", left: 0, padding: "10px 12px", borderTop: "1px solid var(--ap-table-line)", minWidth: 320 }}>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>
                        Select properties
                        <span style={{ color: "var(--ap-muted)", fontWeight: 500, marginLeft: 8 }}>
                            {ticked.length + selection.pinnedKeys.length} ticked · {unticked.length} not selected
                        </span>
                    </div>
                    <div style={{ maxHeight: 220, overflowY: "auto" }}>
                        {subject && (
                            <label style={{ display: "flex", gap: 8, alignItems: "center", padding: "3px 0", cursor: "default" }}>
                                <input type="checkbox" checked disabled style={{ accentColor: "var(--ap-accent)" }} />
                                <span>{String(subject.values.PropertyName ?? "Subject")}</span>
                                <span className="ap-tag">{selection.pinnedKeys.length > 1 ? "Reference" : "Subject"}</span>
                            </label>
                        )}
                        {ticked.map(o => (
                            <label key={o.key} style={{ display: "flex", gap: 8, alignItems: "center", padding: "3px 0", cursor: "pointer" }}>
                                <input type="checkbox" checked onChange={() => toggle(o.key)} style={{ accentColor: "var(--ap-accent)" }} />
                                <span>{o.name}</span>
                                {o.subtitle && <span style={{ color: "var(--ap-muted)" }}>{o.subtitle}</span>}
                                {o.distance !== null && <span style={{ color: "var(--ap-muted)" }}>{o.distance.toFixed(1)} mi</span>}
                            </label>
                        ))}
                        {unticked.slice(0, MAX_LISTED).map(o => (
                            <label key={o.key} style={{ display: "flex", gap: 8, alignItems: "center", padding: "3px 0", cursor: "pointer", color: "var(--ap-muted)" }}>
                                <input type="checkbox" checked={false} onChange={() => toggle(o.key)} style={{ accentColor: "var(--ap-accent)" }} />
                                <span>{o.name}</span>
                                {o.subtitle && <span>{o.subtitle}</span>}
                                {o.distance !== null && <span>{o.distance.toFixed(1)} mi</span>}
                            </label>
                        ))}
                        {unticked.length > MAX_LISTED && (
                            <div style={{ color: "var(--ap-muted)", padding: "4px 0" }}>Showing {MAX_LISTED} of {unticked.length} not selected.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(PropertyComparison);
