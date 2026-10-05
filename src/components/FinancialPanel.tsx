import * as React from "react";
import type { ComparisonTableSettings } from "../settings";
import type { AmountSet, ComparisonFinancials, FinancialsPayload } from "../api";
import { ErrorState } from "./StateViews";
import ThinkingIndicator from "./ThinkingIndicator";

export type FinancialMeasure = "actual" | "budget";

export interface FinancialPanelProps {
    measure: FinancialMeasure;
    financials: FinancialsPayload | null;
    loading: boolean;
    error: string | null;
    subjectKey: string | null;
    fontSize: number;
    settings: ComparisonTableSettings;
    onRetry: () => void;
}

interface MatrixColumn {
    key: string;
    name: string;
    hasData: boolean;
}

interface MatrixLine {
    key: string;
    label: string;
    values: Record<string, AmountSet>;
}

interface Matrix {
    columns: MatrixColumn[];
    lines: MatrixLine[];
}

const TOTAL_LINES = new Set(["noi", "net_cash_flow"]);

const MONEY = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function isComparison(payload: FinancialsPayload): payload is ComparisonFinancials {
    return "properties" in payload;
}

function toMatrix(payload: FinancialsPayload): Matrix {
    if (isComparison(payload)) {
        return {
            columns: payload.properties.map(p => ({
                key: String(p.PropertyBizKey ?? ""),
                name: String(p.PropertyName ?? p.PropertyBizKey ?? "Property"),
                hasData: p.has_data,
            })),
            lines: payload.summary.map(l => ({ key: l.key, label: l.label, values: l.values })),
        };
    }
    const key = String(payload.property.PropertyBizKey ?? "property");
    return {
        columns: [{ key, name: String(payload.property.PropertyName ?? "Property"), hasData: payload.has_data }],
        lines: payload.summary.map(l => ({ key: l.key, label: l.label, values: { [key]: l } })),
    };
}

function formatMoney(value: number | undefined | null): string {
    if (value === undefined || value === null || !isFinite(value)) return "–";
    return MONEY.format(value);
}

function formatMonth(key: number): string {
    const year = Math.floor(key / 100);
    const month = key % 100;
    return new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    });
}

function covers(payload: FinancialsPayload | null, measure: FinancialMeasure): boolean {
    return Boolean(payload) && (payload?.view === "both" || payload?.view === measure);
}

export const FinancialPanel: React.FC<FinancialPanelProps> = ({
    measure, financials, loading, error, subjectKey, fontSize, settings, onRetry,
}) => {
    const matrix = React.useMemo(() => (financials ? toMatrix(financials) : null), [financials]);
    const title = measure === "actual" ? "Actual Financials" : "Budget Financials";
    const period = financials?.period
        ? `${formatMonth(financials.period.year_month_from)} – ${formatMonth(financials.period.year_month_to)}`
        : "";

    const style = {
        "--ap-table-fs": `${fontSize}px`,
        "--ap-head-bg": settings.headerBg,
        "--ap-head-text": settings.headerColor,
        "--ap-row-bg": settings.rowBg,
        "--ap-row-alt": settings.altRowBg,
        "--ap-table-line": settings.borderColor,
        "--ap-table-text": settings.textColor,
        height: "auto",
        maxHeight: 420,
        overflow: "auto",
    } as React.CSSProperties;

    let body: React.ReactNode;
    if (error) {
        body = <ErrorState message={error} onRetry={onRetry} />;
    } else if (!covers(financials, measure) || !matrix) {
        body = (
            <div className="ap-state" style={{ minHeight: 140 }}>
                {loading ? (
                    <ThinkingIndicator label="Loading financial figures" size={44} />
                ) : (
                    <span style={{ color: "var(--ap-muted)" }}>Financial figures will appear here.</span>
                )}
            </div>
        );
    } else {
        const noData = matrix.columns.filter(c => !c.hasData).map(c => c.name);
        const warnings = financials?.warnings ?? [];
        body = (
            <>
                <div className="ap-table-wrap" style={style}>
                    <table className="ap-table">
                        <thead>
                            <tr>
                                <th scope="col">Line item</th>
                                {matrix.columns.map(c => (
                                    <th key={c.key} scope="col">
                                        {c.name}
                                        {c.key === subjectKey && <span className="ap-tag">Subject</span>}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {matrix.lines.map(line => (
                                <tr key={line.key} style={{ cursor: "default", fontWeight: TOTAL_LINES.has(line.key) ? 700 : undefined }}>
                                    <td style={{ fontWeight: 600 }}>{line.label}</td>
                                    {matrix.columns.map(c => {
                                        const amounts = line.values[c.key];
                                        if (!c.hasData || !amounts) return <td key={c.key}>–</td>;
                                        const value = measure === "actual" ? amounts.actual : amounts.budget;
                                        const pct = measure === "actual" ? amounts.variance_pct : null;
                                        return (
                                            <td key={c.key}>
                                                {formatMoney(value)}
                                                {pct !== null && pct !== undefined && (
                                                    <span className={`ap-delta ${pct >= 0 ? "ap-delta--up" : "ap-delta--down"}`}>
                                                        {`${pct >= 0 ? "+" : "−"}${Math.abs(pct).toFixed(1)}% vs budget`}
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div style={{ padding: "8px 12px", color: "var(--ap-muted)", fontSize: 11, lineHeight: 1.5 }}>
                    <div>Expenses and capital spending are shown as negative amounts.</div>
                    {noData.length > 0 && <div>No financial data for the period: {noData.join(", ")}.</div>}
                    {warnings.map(w => <div key={w}>{w}</div>)}
                </div>
            </>
        );
    }

    return (
        <section className="ap-panel" aria-label={title} style={{ flex: "0 0 auto", minHeight: 160, display: "flex", flexDirection: "column" }}>
            <div className="ap-panel-head">
                <span>{title}</span>
                <span style={{ color: "var(--ap-muted)", fontWeight: 500 }}>{period}</span>
            </div>
            {body}
        </section>
    );
};

export default FinancialPanel;