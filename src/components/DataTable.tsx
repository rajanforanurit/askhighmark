import * as React from "react";
import type { ComparisonTableSettings } from "../settings";
import type { TableColumn, TableRow } from "../types";
import { formatValue, toNumber } from "../utils/format";
import Icon from "./Icons";

export interface DataTableProps {
    columns: TableColumn[];
    rows: TableRow[];
    selectedKey: string | null;
    fontSize: number;
    settings: ComparisonTableSettings;
    onSelect: (key: string) => void;
}

type SortDir = "asc" | "desc";

const NUMERIC = new Set(["integer", "currency", "currency0", "percent", "distance"]);

function compareValues(a: unknown, b: unknown): number {
    const na = toNumber(a);
    const nb = toNumber(b);
    if (na !== null && nb !== null) return na - nb;
    if (a === undefined || a === null || a === "") return 1;
    if (b === undefined || b === null || b === "") return -1;
    return String(a).localeCompare(String(b));
}

export const DataTable: React.FC<DataTableProps> = ({ columns, rows, selectedKey, fontSize, settings, onSelect }) => {
    const [sortKey, setSortKey] = React.useState<string | null>(null);
    const [sortDir, setSortDir] = React.useState<SortDir>("asc");
    const wrapRef = React.useRef<HTMLDivElement>(null);

    const sorted = React.useMemo(() => {
        if (!sortKey) return rows;
        const copy = [...rows];
        copy.sort((a, b) => {
            const d = compareValues(a.values[sortKey], b.values[sortKey]);
            return sortDir === "asc" ? d : -d;
        });
        return copy;
    }, [rows, sortKey, sortDir]);

    React.useEffect(() => {
        const wrap = wrapRef.current;
        if (!wrap || !selectedKey) return;
        const tr = Array.from(wrap.querySelectorAll<HTMLTableRowElement>("tbody tr")).find(
            el => el.dataset.key === selectedKey,
        );
        if (!tr) return;
        const head = wrap.querySelector("thead")?.getBoundingClientRect().height ?? 0;
        const top = tr.offsetTop - head;
        const bottom = tr.offsetTop + tr.offsetHeight;
        if (top < wrap.scrollTop) wrap.scrollTop = top;
        else if (bottom > wrap.scrollTop + wrap.clientHeight) wrap.scrollTop = bottom - wrap.clientHeight;
    }, [selectedKey, sorted]);

    const toggleSort = (key: string) => {
        if (sortKey !== key) {
            setSortKey(key);
            setSortDir("asc");
        } else if (sortDir === "asc") {
            setSortDir("desc");
        } else {
            setSortKey(null);
            setSortDir("asc");
        }
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
        <div className="ap-table-wrap" ref={wrapRef} style={style}>
            <table className="ap-table">
                <thead>
                    <tr>
                        {columns.map(c => {
                            const numeric = NUMERIC.has(c.type);
                            const dir = sortKey === c.key ? (sortDir === "asc" ? "ascending" : "descending") : "none";
                            return (
                                <th key={c.key} className={numeric ? "ap-num" : undefined} aria-sort={dir}>
                                    <button type="button" onClick={() => toggleSort(c.key)} aria-label={`Sort by ${c.label}`}>
                                        {c.label}
                                        <span style={{ opacity: sortKey === c.key ? 1 : 0.35, display: "inline-flex" }}>
                                            <Icon name="sort" size={12} />
                                        </span>
                                    </button>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {sorted.map(row => (
                        <tr
                            key={row.key}
                            data-key={row.key}
                            tabIndex={0}
                            aria-selected={row.key === selectedKey}
                            onClick={() => onSelect(row.key)}
                            onKeyDown={e => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    onSelect(row.key);
                                }
                            }}
                        >
                            {columns.map((c, i) => (
                                <td key={c.key} className={NUMERIC.has(c.type) ? "ap-num" : undefined}>
                                    {formatValue(row.values[c.key], c.type)}
                                    {i === 0 && row.isSubject && <span className="ap-tag">Subject</span>}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;
