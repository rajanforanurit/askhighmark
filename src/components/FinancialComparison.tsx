import * as React from "react";
import type { ComparisonTableSettings } from "../settings";
import type { AmountSet, ComparisonFinancials, FinancialPeriod, FinancialsPayload } from "../api";
import { toNumber } from "../utils/format";
import { ErrorState } from "./StateViews";
import ThinkingIndicator from "./ThinkingIndicator";

export interface FinancialComparisonProps {
    financials: FinancialsPayload;
    subjectKey: string | null;
    allowedKeys: Set<string> | null;
    onLoadFinancials?: (
        keys: string[],
        view: "actual" | "budget",
        period: FinancialPeriod | null,
    ) => Promise<FinancialsPayload>;
    fontSize: number;
    settings: ComparisonTableSettings;
}

type Tab = "top" | "budget" | "all";
type Measure = "actual" | "budget" | "variance";
type SectionKey = "revenue" | "operating_expenses" | "capital_expenses" | "replacements" | "other";
type Source = "actual" | "budget";

interface Column {
    key: string;
    name: string;
    assetType: string;
    location: string;
    yearBuilt: string;
    units: number | null;
    hasData: boolean;
}

interface Line {
    id: string;
    label: string;
    kind: "detail" | "subtotal" | "total";
    values: Record<string, AmountSet>;
}

const SECTION_BY_LABEL: Record<string, SectionKey> = {
    Revenue: "revenue",
    "Operating Expenses": "operating_expenses",
    "Capital Expenses": "capital_expenses",
    Replacements: "replacements",
    Other: "other",
};

const SECTION_TITLES: Record<SectionKey, string> = {
    revenue: "Revenue",
    operating_expenses: "Operating Expenses",
    capital_expenses: "Capital Expenses",
    replacements: "Replacements",
    other: "Other / Unmapped",
};

// Sections that show individual GL accounts; the rest show their total only.
const DETAIL_SECTIONS: SectionKey[] = ["revenue", "operating_expenses"];
const TOP_ACCOUNTS = 10;

const MONEY = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function isComparison(payload: FinancialsPayload): payload is ComparisonFinancials {
    return "properties" in payload;
}

function money(value: number | null | undefined): string {
    if (value === null || value === undefined || !isFinite(value)) return "–";
    const formatted = `$${MONEY.format(Math.abs(Math.round(value)))}`;
    return value < 0 ? `(${formatted})` : formatted;
}

function text(value: unknown): string {
    return value === null || value === undefined ? "" : String(value).trim();
}

function monthLabel(key: number): string {
    const year = Math.floor(key / 100);
    const month = key % 100;
    return new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    });
}

function monthCount(from: number, to: number): number {
    return (Math.floor(to / 100) - Math.floor(from / 100)) * 12 + ((to % 100) - (from % 100)) + 1;
}

function pickAmount(amounts: AmountSet | undefined, measure: Measure): number | null {
    if (!amounts) return null;
    const v = measure === "actual" ? amounts.actual : measure === "budget" ? amounts.budget : amounts.variance;
    return typeof v === "number" ? v : null;
}

function propertyKeys(payload: FinancialsPayload): string[] {
    if (isComparison(payload)) {
        return payload.properties.map(p => text(p.PropertyBizKey)).filter(Boolean);
    }
    const key = text(payload.property.PropertyBizKey);
    return key ? [key] : [];
}

interface Model {
    columns: Column[];
    lines: Line[];
}

function buildModel(
    payload: FinancialsPayload,
    allowedKeys: Set<string> | null,
    showAll: boolean,
    weightMeasure: "actual" | "budget",
): Model {
    let columns: Column[];
    let summary: { key: string; label: string; values: Record<string, AmountSet> }[];
    let accounts: { section: string; label: string; values: Record<string, AmountSet> }[];

    const toColumn = (p: Record<string, unknown>, hasData: boolean): Column => {
        const state = text(p.State);
        const city = text(p.City);
        const year = toNumber(p.YearBuilt);
        return {
            key: text(p.PropertyBizKey),
            name: text(p.PropertyName) || text(p.PropertyBizKey) || "Property",
            assetType: text(p.AssetType),
            location: [state, city].filter(Boolean).join(" / "),
            yearBuilt: year !== null ? String(Math.round(year)) : "",
            units: toNumber(p.Units),
            hasData,
        };
    };

    if (isComparison(payload)) {
        columns = payload.properties.map(p => toColumn(p as Record<string, unknown>, p.has_data));
        summary = payload.summary;
        accounts = payload.accounts.map(a => ({
            section: a.GLAccountSection,
            label: a.GLAccountName,
            values: a.values,
        }));
    } else {
        const key = text(payload.property.PropertyBizKey) || "property";
        columns = [toColumn(payload.property as Record<string, unknown>, payload.has_data)];
        summary = payload.summary.map(l => ({ key: l.key, label: l.label, values: { [key]: l } }));
        accounts = payload.accounts.map(a => ({
            section: a.GLAccountSection,
            label: a.GLAccountName,
            values: { [key]: a },
        }));
    }

    if (allowedKeys && allowedKeys.size > 0) {
        columns = columns.filter(c => allowedKeys.has(c.key));
    }
    const keys = columns.map(c => c.key);

    const summaryByKey = new Map(summary.map(l => [l.key, l]));
    const weight = (values: Record<string, AmountSet>) =>
        keys.reduce((sum, k) => sum + Math.abs(values[k]?.[weightMeasure] ?? 0), 0);

    const bySection = new Map<SectionKey, typeof accounts>();
    accounts.forEach(a => {
        const section = SECTION_BY_LABEL[a.section] ?? "other";
        const list = bySection.get(section) ?? [];
        list.push(a);
        bySection.set(section, list);
    });

    const lines: Line[] = [];

    const addSection = (section: SectionKey) => {
        const total = summaryByKey.get(section);
        if (!total) return;
        if (DETAIL_SECTIONS.includes(section)) {
            const sorted = [...(bySection.get(section) ?? [])].sort((a, b) => weight(b.values) - weight(a.values));
            const shown = showAll ? sorted : sorted.slice(0, TOP_ACCOUNTS);
            shown.forEach((a, i) =>
                lines.push({ id: `${section}-${i}`, label: a.label, kind: "detail", values: a.values }),
            );
            if (!showAll && sorted.length > shown.length) {
                const rest = sorted.slice(shown.length);
                const values: Record<string, AmountSet> = {};
                keys.forEach(k => {
                    const sum = (field: "actual" | "budget") =>
                        rest.reduce((s, a) => s + (a.values[k]?.[field] ?? 0), 0);
                    const actual = sum("actual");
                    const budget = sum("budget");
                    values[k] = { actual, budget, variance: actual - budget };
                });
                lines.push({
                    id: `${section}-rest`,
                    label: `All other ${SECTION_TITLES[section].toLowerCase()} (${rest.length})`,
                    kind: "detail",
                    values,
                });
            }
        }
        lines.push({ id: section, label: `Total ${total.label}`, kind: "subtotal", values: total.values });
    };

    addSection("revenue");
    addSection("operating_expenses");
    const noi = summaryByKey.get("noi");
    if (noi) lines.push({ id: "noi", label: noi.label, kind: "total", values: noi.values });
    addSection("capital_expenses");
    addSection("replacements");
    addSection("other");
    const net = summaryByKey.get("net_cash_flow");
    if (net) lines.push({ id: "net", label: net.label, kind: "total", values: net.values });

    return { columns, lines };
}

type Sources = Partial<Record<Source, FinancialsPayload>>;

function seedSources(payload: FinancialsPayload): Sources {
    if (payload.view === "both") return { actual: payload, budget: payload };
    if (payload.view === "budget") return { budget: payload };
    return { actual: payload };
}

export const FinancialComparison: React.FC<FinancialComparisonProps> = ({
    financials, subjectKey, allowedKeys, onLoadFinancials, fontSize, settings,
}) => {
    const [sources, setSources] = React.useState<Sources>(() => seedSources(financials));
    const [tab, setTab] = React.useState<Tab>(financials.view === "budget" ? "budget" : "top");
    const [variance, setVariance] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const requestId = React.useRef(0);

    // A new result replaces everything, including any lazily loaded budget/actual data.
    React.useEffect(() => {
        requestId.current += 1;
        setSources(seedSources(financials));
        setTab(financials.view === "budget" ? "budget" : "top");
        setVariance(false);
        setLoading(false);
        setError(null);
    }, [financials]);

    const source: Source = tab === "budget" ? "budget" : "actual";
    const active = sources[source] ?? null;

    const load = React.useCallback(() => {
        if (!onLoadFinancials) {
            setError("Figures for this view are unavailable.");
            return;
        }
        const id = ++requestId.current;
        setLoading(true);
        setError(null);
        onLoadFinancials(propertyKeys(financials), source, financials.period)
            .then(payload => {
                if (id !== requestId.current) return;
                setSources(prev => ({ ...prev, [source]: payload }));
                setLoading(false);
            })
            .catch(() => {
                if (id !== requestId.current) return;
                setError(source === "budget" ? "Couldn't load the budget figures." : "Couldn't load the actual figures.");
                setLoading(false);
            });
    }, [financials, onLoadFinancials, source]);

    React.useEffect(() => {
        if (!active && !loading && !error) load();
    }, [active, loading, error, load]);

    // Switching tabs clears a stale error so the other view can load on its own.
    const selectTab = (next: Tab) => {
        if (next !== tab) setError(null);
        setTab(next);
    };

    const showVariance = tab !== "budget" && active?.view === "both";
    const measure: Measure = tab === "budget" ? "budget" : showVariance && variance ? "variance" : "actual";
    const showAll = tab === "all";

    const model = React.useMemo(
        () => (active ? buildModel(active, allowedKeys, showAll, source) : null),
        [active, allowedKeys, showAll, source],
    );

    const period = active?.period ?? financials.period;
    const months = period ? monthCount(period.year_month_from, period.year_month_to) : 0;
    const amountLabel = months === 12 ? "Annual" : period && period.year_month_from % 100 === 1 ? "YTD" : "Period";
    const periodText = period
        ? `${monthLabel(period.year_month_from)} – ${monthLabel(period.year_month_to)}`
        : "";

    const vars = {
        "--ap-table-fs": `${fontSize}px`,
        "--ap-head-bg": settings.headerBg,
        "--ap-head-text": settings.headerColor,
        "--ap-row-bg": settings.rowBg,
        "--ap-row-alt": settings.altRowBg,
        "--ap-table-line": settings.borderColor,
        "--ap-table-text": settings.textColor,
    } as React.CSSProperties;

    // Every header row is sticky at its own fixed offset, so the rows stack cleanly
    // instead of sitting on top of each other (or of the data) while scrolling.
    const rowH = Math.max(24, Math.round(fontSize * 2.2));
    const headCell = (row: number, extra?: React.CSSProperties): React.CSSProperties => ({
        position: "sticky",
        top: row * rowH,
        zIndex: 3,
        height: rowH,
        boxSizing: "border-box",
        background: "var(--ap-head-bg)",
        color: "var(--ap-head-text)",
        border: "1px solid var(--ap-table-line)",
        textAlign: "center",
        padding: "0 8px",
        fontWeight: 600,
        whiteSpace: "nowrap",
        ...extra,
    });
    const cornerCell = (row: number, extra?: React.CSSProperties): React.CSSProperties =>
        headCell(row, { left: 0, zIndex: 5, textAlign: "left", minWidth: 220, ...extra });

    // Opaque backgrounds only: translucent ones let scrolled content show through the sticky column.
    const bodyBg = (kind: Line["kind"], index: number): React.CSSProperties => {
        const base = index % 2 === 0 ? "var(--ap-row-bg)" : "var(--ap-row-alt)";
        if (kind === "total") {
            return { backgroundColor: base, backgroundImage: "linear-gradient(rgba(0,0,0,0.16), rgba(0,0,0,0.16))" };
        }
        if (kind === "subtotal") {
            return { backgroundColor: base, backgroundImage: "linear-gradient(rgba(0,0,0,0.08), rgba(0,0,0,0.08))" };
        }
        return { backgroundColor: base };
    };

    const numCell: React.CSSProperties = { textAlign: "right", whiteSpace: "nowrap", padding: "4px 8px" };
    const warnings = active?.warnings ?? [];
    const noData = model ? model.columns.filter(c => !c.hasData).map(c => c.name) : [];
    const hasAnyUnits = model ? model.columns.some(c => c.units !== null) : true;

    let body: React.ReactNode;
    if (!active || !model) {
        body = error ? (
            <ErrorState message={error} onRetry={load} />
        ) : (
            <div className="ap-state" style={{ minHeight: 140 }}>
                <ThinkingIndicator
                    label={source === "budget" ? "Loading budget figures" : "Loading actual figures"}
                    size={44}
                />
            </div>
        );
    } else {
        body = (
            <div className="ap-table-wrap" style={{ flex: "1 1 0", minHeight: 0, overflow: "auto", maxHeight: "none" }}>
                <table
                    className="ap-table"
                    style={{ borderCollapse: "separate", borderSpacing: 0, fontSize: "var(--ap-table-fs)" }}
                >
                    <thead>
                        <tr>
                            <th scope="col" style={cornerCell(0)} />
                            {model.columns.map(c => (
                                <th key={c.key} scope="col" colSpan={3} style={headCell(0)}>
                                    {c.name}
                                    {c.key === subjectKey && <span className="ap-tag">Subject</span>}
                                </th>
                            ))}
                        </tr>
                        <tr>
                            <th style={cornerCell(1)} />
                            {model.columns.map(c => (
                                <th key={c.key} colSpan={3} style={headCell(1, { fontWeight: 500 })}>{c.assetType || "–"}</th>
                            ))}
                        </tr>
                        <tr>
                            <th style={cornerCell(2)} />
                            {model.columns.map(c => (
                                <th key={c.key} colSpan={3} style={headCell(2, { fontWeight: 500 })}>{c.location || "–"}</th>
                            ))}
                        </tr>
                        <tr>
                            <th style={cornerCell(3)} />
                            {model.columns.map(c => (
                                <th key={c.key} colSpan={3} style={headCell(3, { fontWeight: 500 })}>{c.yearBuilt || "–"}</th>
                            ))}
                        </tr>
                        <tr>
                            <th scope="col" style={cornerCell(4)}>Line item</th>
                            {model.columns.map(c => (
                                <React.Fragment key={c.key}>
                                    <th style={headCell(4)}>{amountLabel}</th>
                                    <th style={headCell(4)}>$ / Unit</th>
                                    <th style={headCell(4)}>Units</th>
                                </React.Fragment>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {model.lines.map((line, index) => {
                            const bg = bodyBg(line.kind, index);
                            const weightStyle = line.kind === "detail" ? 500 : 700;
                            return (
                                <tr key={line.id} style={{ cursor: "default" }}>
                                    <td
                                        style={{
                                            ...bg,
                                            position: "sticky",
                                            left: 0,
                                            zIndex: 2,
                                            padding: "4px 8px",
                                            paddingLeft: line.kind === "detail" ? 16 : 8,
                                            whiteSpace: "nowrap",
                                            fontWeight: weightStyle,
                                        }}
                                    >
                                        {line.label}
                                    </td>
                                    {model.columns.map(c => {
                                        const amount = c.hasData ? pickAmount(line.values[c.key], measure) : null;
                                        const perUnit = amount !== null && c.units ? amount / c.units : null;
                                        const cell = { ...bg, ...numCell, fontWeight: weightStyle };
                                        return (
                                            <React.Fragment key={c.key}>
                                                <td style={cell}>{money(amount)}</td>
                                                <td style={cell}>{money(perUnit)}</td>
                                                <td style={cell}>{c.units !== null ? MONEY.format(c.units) : "–"}</td>
                                            </React.Fragment>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, ...vars }}>
            <div
                style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: 8, padding: "6px 12px", flex: "0 0 auto", flexWrap: "wrap",
                }}
            >
                <span style={{ color: "var(--ap-muted)", fontSize: 12 }}>{periodText}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {showVariance && (
                        <div className="ap-seg" role="group" aria-label="Measure">
                            <button type="button" aria-pressed={!variance} onClick={() => setVariance(false)}>Actual</button>
                            <button type="button" aria-pressed={variance} onClick={() => setVariance(true)}>Variance</button>
                        </div>
                    )}
                    <div className="ap-seg" role="group" aria-label="Financial view">
                        <button type="button" aria-pressed={tab === "top"} onClick={() => selectTab("top")}>
                            Top {TOP_ACCOUNTS}
                        </button>
                        <button type="button" aria-pressed={tab === "budget"} onClick={() => selectTab("budget")}>
                            Budget
                        </button>
                        <button type="button" aria-pressed={tab === "all"} onClick={() => selectTab("all")}>
                            All Accounts
                        </button>
                    </div>
                </div>
            </div>

            {body}

            {active && model && (
                <div style={{ padding: "6px 12px", color: "var(--ap-muted)", fontSize: 11, lineHeight: 1.5, flex: "0 0 auto" }}>
                    <div>Expenses and capital spending are shown as negative amounts (in parentheses).</div>
                    {tab === "budget" && <div>Showing budget figures.</div>}
                    {!hasAnyUnits && <div>Unit counts are unavailable, so $ / Unit cannot be calculated.</div>}
                    {noData.length > 0 && <div>No financial data for the period: {noData.join(", ")}.</div>}
                    {warnings.map(w => <div key={w}>{w}</div>)}
                </div>
            )}
        </div>
    );
};

export default FinancialComparison;