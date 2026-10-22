import * as React from "react";
import type { ComparisonTableSettings } from "../settings";
import type { SelectionState, TableColumn, TableRow } from "../types";
import { formatValue, toNumber } from "../utils/format";
import Icon from "./Icons";

export interface DataTableProps {
    columns: TableColumn[];
    rows: TableRow[];
    selectedKey: string | null;
    fontSize: number;
    settings: ComparisonTableSettings;
    onSelect: (key: string) => void;
    selection?: SelectionState | null;
    onSelectionChange?: (keys: string[]) => void;
    query?: string;
    maxHeight?: number;
}

const MAX_OFF_ROWS = 300;

const STYLES = `
.ap-table th.ap-chk,.ap-table td.ap-chk{width:30px;min-width:30px;padding:0 0 0 10px;text-align:center}
.ap-table input.ap-box{width:15px;height:15px;margin:0;vertical-align:middle;accent-color:var(--ap-accent);cursor:pointer}
.ap-table input.ap-box:disabled{cursor:default}
.ap-table tbody tr.ap-off{background:transparent;color:var(--ap-muted)}
.ap-table tbody tr.ap-off:nth-child(even){background:transparent}
.ap-table tbody tr.ap-sep{cursor:default;background:var(--ap-head-bg,#f3f5f9)}
.ap-table tbody tr.ap-sep:hover{background:var(--ap-head-bg,#f3f5f9)}
.ap-table tbody tr.ap-sep td{font-weight:600;color:var(--ap-muted);padding-top:5px;padding-bottom:5px;position:sticky;left:0}
`;

type SortDir = "asc" | "desc";

const NUMERIC = new Set(["integer", "currency", "currency0", "percent", "distance", "number", "pct"]);

function compareValues(a: unknown, b: unknown): number {
    const na = toNumber(a);
    const nb = toNumber(b);
    if (na !== null && nb !== null) return na - nb;
    if (a === undefined || a === null || a === "") return 1;
    if (b === undefined || b === null || b === "") return -1;
    return String(a).localeCompare(String(b));
}

export const DataTable: React.FC<DataTableProps> = ({
    columns, rows, selectedKey, fontSize, settings, onSelect, selection, onSelectionChange, query = "", maxHeight,
}) => {
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

    const needle = query.trim().toLowerCase();
    const matches = React.useCallback(
        (values: Record<string, unknown>) =>
            !needle || `${values.PropertyName ?? ""} ${values.City ?? ""} ${values.State ?? ""}`.toLowerCase().includes(needle),
        [needle],
    );
    const shownRows = React.useMemo(
        () => (selection && needle ? sorted.filter(r => matches(r.values)) : sorted),
        [sorted, selection, needle, matches],
    );
    const chosen = React.useMemo(() => new Set(selection?.selectedKeys ?? []), [selection]);
    const offRows = React.useMemo(() => {
        if (!selection) return [];
        const list = selection.options.filter(o => !chosen.has(o.key) && matches(o.values));
        if (!sortKey) return list;
        const copy = [...list];
        copy.sort((a, b) => {
            const d = compareValues(a.values[sortKey], b.values[sortKey]);
            return sortDir === "asc" ? d : -d;
        });
        return copy;
    }, [selection, chosen, matches, sortKey, sortDir]);

    const toggleKey = (key: string) => {
        if (!selection || !onSelectionChange) return;
        onSelectionChange(chosen.has(key) ? selection.selectedKeys.filter(k => k !== key) : [...selection.selectedKeys, key]);
    };
    const toggleAll = () => {
        if (!selection || !onSelectionChange) return;
        if (selection.selectedKeys.length > 0) onSelectionChange([]);
        else onSelectionChange(selection.options.map(o => o.key).filter(k => !selection.pinnedKeys.includes(k)));
    };
    const headBox = React.useRef<HTMLInputElement>(null);
    const selectedCount = selection?.selectedKeys.length ?? 0;
    const optionCount = selection?.options.length ?? 0;
    React.useEffect(() => {
        if (headBox.current) headBox.current.indeterminate = selectedCount > 0 && selectedCount < optionCount;
    }, [selectedCount, optionCount]);

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
        flex: "1 1 auto",
        minHeight: 0,
        maxHeight: maxHeight ? `${maxHeight}px` : "none",
        overflow: "auto",
    } as React.CSSProperties;

    return (
        <div className="ap-table-wrap" ref={wrapRef} style={style}>
            {selection && <style>{STYLES}</style>}
            <table className="ap-table">
                <thead>
                    <tr>
                        {selection && (
                            <th className="ap-chk" scope="col">
                                <input
                                    ref={headBox}
                                    type="checkbox"
                                    className="ap-box"
                                    checked={optionCount > 0 && selectedCount === optionCount}
                                    disabled={optionCount === 0}
                                    title={selectedCount > 0 ? "Clear selection" : `Select all ${optionCount}`}
                                    aria-label={selectedCount > 0 ? "Clear selected properties" : `Select all ${optionCount} properties`}
                                    onChange={toggleAll}
                                />
                            </th>
                        )}
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
                    {shownRows.map(row => (
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
                            {selection && (
                                <td className="ap-chk" onClick={e => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        className="ap-box"
                                        checked
                                        disabled={selection.pinnedKeys.includes(row.key)}
                                        title={selection.pinnedKeys.includes(row.key) ? "Reference properties are always shown" : "Remove from comparison"}
                                        aria-label={`Remove ${String(row.values.PropertyName ?? "property")}`}
                                        onChange={() => toggleKey(row.key)}
                                    />
                                </td>
                            )}
                            {columns.map((c, i) => (
                                <td key={c.key} className={NUMERIC.has(c.type) ? "ap-num" : undefined}>
                                    {formatValue(row.values[c.key], c.type, c.decimals)}
                                    {i === 0 && row.isSubject && <span className="ap-tag">{selection && selection.pinnedKeys.length > 1 ? "Reference" : "Subject"}</span>}
                                </td>
                            ))}
                        </tr>
                    ))}
                    {selection && offRows.length > 0 && (
                        <tr className="ap-sep">
                            <td colSpan={columns.length + 1}>
                                Not selected · {offRows.length} — tick to add
                            </td>
                        </tr>
                    )}
                    {selection && offRows.slice(0, MAX_OFF_ROWS).map(o => (
                        <tr key={`off-${o.key}`} className="ap-off" data-key={o.key} onClick={() => toggleKey(o.key)}>
                            <td className="ap-chk" onClick={e => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    className="ap-box"
                                    checked={false}
                                    aria-label={`Add ${o.name}`}
                                    onChange={() => toggleKey(o.key)}
                                />
                            </td>
                            {columns.map(c => (
                                <td key={c.key} className={NUMERIC.has(c.type) ? "ap-num" : undefined}>
                                    {formatValue(c.key === "PropertyName" ? o.name : o.values[c.key], c.type, c.decimals)}
                                </td>
                            ))}
                        </tr>
                    ))}
                    {selection && offRows.length > MAX_OFF_ROWS && (
                        <tr className="ap-sep">
                            <td colSpan={columns.length + 1}>Showing {MAX_OFF_ROWS} of {offRows.length}. Use search to find others.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default React.memo(DataTable);
