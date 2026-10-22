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
    background: "var(--ap-row-bg, #fff)",
    fontWeight: 600,
    borderRight: "1px solid var(--ap-table-line, #e5e7eb)",
};
const HEAD_CELL: React.CSSProperties = {
    minWidth: COLUMN_MIN_WIDTH,
    verticalAlign: "bottom",
    whiteSpace: "normal",
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
    // Distance (miles) comes first, right after the property name, then City, State and the rest.
    const fields = React.useMemo(() => {
        const rest = columns.filter(c => c.key !== "PropertyName");
        const isDistance = (c: TableColumn) => c.key === "distance_miles" || c.type === "distance";
        return [...rest.filter(isDistance), ...rest.filter(c => !isDistance(c))];
    }, [columns]);
    const alignOf = (f: TableColumn): "left" | "right" => (f.type === "distance" || f.key === "distance_miles" ? "left" : DELTA_TYPES.has(f.type) ? "right" : "left");

    const chosenKeys = React.useMemo(() => new Set(selection?.selectedKeys ?? []), [selection]);
    const unticked = React.useMemo(
        () => (selection ? selection.options.filter(o => !chosenKeys.has(o.key) && !selection.pinnedKeys.includes(o.key) && !rows.some(r => r.key === o.key)) : []),
        [selection, chosenKeys, rows],
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
                        <th scope="col" style={CORNER_CELL}>Property</th>
                        {fields.map(f => (
                            <th
                                key={f.key}
                                scope="col"
                                style={{ ...HEAD_CELL, textAlign: alignOf(f) }}
                            >
                                {f.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {ordered.map(r => {
                        const isSelected = r.key === selectedKey;
                        const pinned = Boolean(selection?.pinnedKeys.includes(r.key));
                        return (
                            <tr key={r.key} style={{ cursor: "default", ...(isSelected ? { background: SELECTED_BG } : null) }}>
                                <td style={LABEL_CELL}>
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
                                                    color: isSelected ? "var(--ap-accent-strong)" : "inherit",
                                                    textAlign: "left",
                                                    whiteSpace: "normal",
                                                    lineHeight: 1.3,
                                                    fontWeight: 600,
                                                    fontSize: "inherit",
                                                    border: 0,
                                                    background: "transparent",
                                                    padding: 0,
                                                    margin: 0,
                                                    borderRadius: 0,
                                                    boxShadow: "none",
                                                    cursor: "pointer",
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
                                </td>
                                {fields.map(f => {
                                    const d = subject && !r.isSubject ? delta(r.values[f.key], subject.values[f.key], f) : null;
                                    return (
                                        <td
                                            key={f.key}
                                            style={{
                                                borderLeft: "1px solid var(--ap-table-line, #e5e7eb)",
                                                textAlign: alignOf(f),
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
                    {selection && unticked.slice(0, MAX_LISTED).map(o => (
                        <tr key={`off-${o.key}`} style={{ cursor: "pointer", color: "var(--ap-muted)" }} onClick={() => toggle(o.key)}>
                            <td style={{ ...LABEL_CELL, fontWeight: 500, color: "var(--ap-muted)" }}>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                                    <input
                                        type="checkbox"
                                        checked={false}
                                        aria-label={`Add ${o.name}`}
                                        title="Add to comparison"
                                        onClick={e => e.stopPropagation()}
                                        onChange={() => toggle(o.key)}
                                        style={{ marginTop: 2, flexShrink: 0, accentColor: "var(--ap-accent)" }}
                                    />
                                    <div style={{ minWidth: 0, maxWidth: 220, lineHeight: 1.3, fontWeight: 600 }}>{o.name}</div>
                                </div>
                            </td>
                            {fields.map(f => {
                                const raw = o.values[f.key] ?? (f.key === "distance_miles" ? o.distance : undefined);
                                return (
                                    <td
                                        key={f.key}
                                        style={{
                                            borderLeft: "1px solid var(--ap-table-line, #e5e7eb)",
                                            textAlign: alignOf(f),
                                        }}
                                    >
                                        {formatValue(raw, f.type, f.decimals)}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                    {selection && unticked.length > MAX_LISTED && (
                        <tr style={{ cursor: "default" }}>
                            <td colSpan={fields.length + 1} style={{ color: "var(--ap-muted)" }}>
                                Showing {MAX_LISTED} of {unticked.length} not selected.
                            </td>
                        </tr>
                    )}
                    {notFound.length > 0 && (
                        <tr style={{ cursor: "default" }}>
                            <td colSpan={fields.length + 1} style={{ color: "var(--ap-danger)" }}>
                                Not found: {notFound.join(", ")}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default React.memo(PropertyComparison);
