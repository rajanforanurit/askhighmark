import * as React from "react";
import type { ComparisonTableSettings } from "../settings";
import type { TableColumn, TableRow } from "../types";
import { formatValue, toNumber } from "../utils/format";

export interface PropertyComparisonProps {
    columns: TableColumn[];
    rows: TableRow[];
    notFound: string[];
    selectedKey: string | null;
    fontSize: number;
    settings: ComparisonTableSettings;
    onSelect: (key: string) => void;
}

const DELTA_TYPES = new Set(["integer", "currency", "currency0", "percent", "distance"]);

function delta(value: unknown, base: unknown, column: TableColumn): { text: string; up: boolean } | null {
    if (!DELTA_TYPES.has(column.type)) return null;
    const v = toNumber(value);
    const b = toNumber(base);
    if (v === null || b === null || v === b) return null;
    const diff = v - b;
    const sign = diff > 0 ? "+" : "−";
    const text = `${sign}${formatValue(Math.abs(diff), column.type === "percent" && Math.abs(diff) <= 1 ? "percent" : column.type)} vs subject`;
    return { text, up: diff > 0 };
}

export const PropertyComparison: React.FC<PropertyComparisonProps> = ({
    columns, rows, notFound, selectedKey, fontSize, settings, onSelect,
}) => {
    const ordered = React.useMemo(
        () => [...rows.filter(r => r.isSubject), ...rows.filter(r => !r.isSubject)],
        [rows],
    );
    const subject = ordered.find(r => r.isSubject) ?? null;
    const fields = columns.filter(c => c.key !== "PropertyName");

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
                        <th scope="col">Metric</th>
                        {ordered.map(r => (
                            <th key={r.key} scope="col">
                                <button
                                    type="button"
                                    onClick={() => onSelect(r.key)}
                                    aria-pressed={r.key === selectedKey}
                                    style={{ color: r.key === selectedKey ? "var(--ap-accent-strong)" : undefined }}
                                >
                                    {String(r.values.PropertyName ?? "Property")}
                                </button>
                                {r.isSubject && <span className="ap-tag">Subject</span>}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {fields.map(f => (
                        <tr key={f.key} style={{ cursor: "default" }}>
                            <td style={{ fontWeight: 600 }}>{f.label}</td>
                            {ordered.map(r => {
                                const d = subject && !r.isSubject ? delta(r.values[f.key], subject.values[f.key], f) : null;
                                return (
                                    <td key={r.key}>
                                        {formatValue(r.values[f.key], f.type)}
                                        {d && <span className={`ap-delta ${d.up ? "ap-delta--up" : "ap-delta--down"}`}>{d.text}</span>}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                    {notFound.length > 0 && (
                        <tr style={{ cursor: "default" }}>
                            <td colSpan={ordered.length + 1} style={{ color: "var(--ap-danger)" }}>
                                Not found: {notFound.join(", ")}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default PropertyComparison;
