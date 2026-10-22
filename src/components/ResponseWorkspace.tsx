import * as React from "react";
import type { FinancialPeriod, FinancialsPayload } from "../api";
import type { VisualSettings } from "../settings";
import type { ChartRequest, ChatEntry, FilterOptions, FilterState } from "../types";
import { applyFilters } from "../utils/filters";
import { toMapProperties } from "../utils/normalize";
import ChartPanel from "./ChartPanel";
import FinancialComparison from "./FinancialComparison";
import MapView, { type MapHandle } from "./MapView";
import PropertyCard from "./PropertyCard";
import PropertyComparison from "./PropertyComparison";
import { EmptyState, ErrorState } from "./StateViews";
import Icon from "./Icons";
import TipsLoader from "./TipsLoader";

export interface ResponseWorkspaceProps {
    entry: ChatEntry | null;
    busy: boolean;
    thinkingLabel: string | null;
    filters: FilterState;
    options: FilterOptions;
    settings: VisualSettings;
    onFiltersReset: () => void;
    onRetry: (entry: ChatEntry) => void;
    onLoadFinancials?: (keys: string[], view: "actual" | "budget", period: FinancialPeriod | null) => Promise<FinancialsPayload>;
    onSelectionChange?: (entryId: string, keys: string[]) => void;
}

// "comparison" is the tabbed Financial Comparison / Property Comparison panel.
type PanelId = "chart" | "comparison" | "map";
type ComparisonTab = "financial" | "property";

const COMPARISON_LABELS: Record<ComparisonTab, string> = {
    financial: "Financial Comparison",
    property: "Property Comparison",
};

const SECTION_ORDER = { map: 10, financial: 11, properties: 12 } as const;

export const ResponseWorkspace: React.FC<ResponseWorkspaceProps> = ({
    entry, busy, thinkingLabel, filters, options, settings,
    onFiltersReset, onRetry, onLoadFinancials, onSelectionChange,
}) => {
    const mapRef = React.useRef<MapHandle>(null);
    const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
    const fontDelta = 0;
    const [chartOverride, setChartOverride] = React.useState<{ id: string; chart: ChartRequest | null } | null>(null);
    const [expanded, setExpanded] = React.useState<{ id: string; panel: PanelId } | null>(null);
    const [comparisonTab, setComparisonTab] = React.useState<ComparisonTab>("financial");
    const expandButtons = React.useRef<Partial<Record<PanelId, HTMLButtonElement | null>>>({});
    const panelRefs = React.useRef<Partial<Record<PanelId, HTMLElement | null>>>({});
    const lastExpanded = React.useRef<PanelId | null>(null);

    const result = entry?.result ?? null;
    const chart: ChartRequest | null = result
        ? chartOverride && chartOverride.id === result.id ? chartOverride.chart : result.chart ?? null
        : null;

    React.useEffect(() => {
        setSelectedKey(null);
        setComparisonTab("financial");
    }, [result?.id]);

    const visibleRows = React.useMemo(
        () => (result ? applyFilters(result.rows, filters, options) : []),
        [result, filters, options],
    );
    React.useEffect(() => {
        setSelectedKey(current => (current && !visibleRows.some(r => r.key === current) ? null : current));
    }, [visibleRows]);

    const mapProps = React.useMemo(() => toMapProperties(visibleRows), [visibleRows]);
    const coverageProps = React.useMemo(() => (result ? toMapProperties(result.rows) : []), [result]);

    const layoutSections = result?.layout?.sections ?? null;
    // Financial Comparison is part of every answer that has properties. Property Comparison only appears
    // in the Find Nearby flow. No query ever shows a raw property list.
    const financialsAllowed = true;
    // The order is fixed (Map -> Financial Comparison -> Property Comparison) and never follows the backend.
    const sectionOrder = (section: "map" | "financial" | "properties") => SECTION_ORDER[section];
    const financials = financialsAllowed ? result?.financials ?? null : null;
    const financialsError = financialsAllowed ? result?.financialsError ?? null : null;
    const showFinancials = Boolean(financials) && visibleRows.length > 0;
    const showFinancialsError = financialsAllowed && !financials && Boolean(financialsError);
    const showFinancialsPending = financialsAllowed && !financials && !financialsError && Boolean(result?.financialsPending) && visibleRows.length > 0;
    const allowedKeys = React.useMemo(() => new Set(visibleRows.map(r => r.key)), [visibleRows]);

    // The map is part of every property result. It stays mounted while a selection reloads, when every row is
    // deselected, and when filters hide all rows, so it can never vanish mid-conversation.
    const hasMap = Boolean(
        result && (result.rows.length > 0 || result.area || result.location?.origin || result.selection),
    );
    const showChart = Boolean(chart) && visibleRows.length > 0;
    const selection = onSelectionChange ? result?.selection ?? null : null;
    const tableColumns = React.useMemo(() => {
        const cols = result?.columns ?? [];
        if (cols.length > 0 || !selection) return cols;
        return [
            { key: "PropertyName", label: "Property", type: "text" as const },
            { key: "City", label: "City", type: "text" as const },
            { key: "State", label: "State", type: "text" as const },
        ];
    }, [result, selection]);
    const hasTable = Boolean(result?.showProperties) && (visibleRows.length > 0 || Boolean(selection)) && tableColumns.length > 0;
    const changeSelection = (keys: string[]) => {
        if (entry && onSelectionChange) onSelectionChange(entry.id, keys);
    };
    const chartHeight = chart?.type === "pie" ? 340 : Math.min(460, Math.max(260, visibleRows.length * 30 + 120));
    const selectedProperty = mapProps.find(p => p.key === selectedKey) ?? null;
    // The Financial Comparison (data, loading or error state) and the Property Comparison share one tabbed panel.
    const hasFinancialSection = showFinancials || showFinancialsPending || showFinancialsError;
    const comparisonTabs: ComparisonTab[] = [
        ...(hasFinancialSection ? (["financial"] as const) : []),
        ...(hasTable ? (["property"] as const) : []),
    ];
    const hasComparison = comparisonTabs.length > 0;
    const activeComparison: ComparisonTab | null = comparisonTabs.includes(comparisonTab) ? comparisonTab : comparisonTabs[0] ?? null;
    const tabbed = comparisonTabs.length > 1;
    const panelAvailable: Record<PanelId, boolean> = { comparison: hasComparison, chart: showChart, map: hasMap };
    const activeExpanded: PanelId | null =
        expanded && result && expanded.id === result.id && panelAvailable[expanded.panel] ? expanded.panel : null;

    React.useEffect(() => {
        if (activeExpanded) {
            lastExpanded.current = activeExpanded;
            panelRefs.current[activeExpanded]?.focus();
        } else if (lastExpanded.current) {
            expandButtons.current[lastExpanded.current]?.focus();
            lastExpanded.current = null;
        }
    }, [activeExpanded]);

    const tableFont = Math.min(18, Math.max(10, settings.comparisonTable.fontSize + fontDelta));
    const onComparisonKeyDown = (e: React.KeyboardEvent) => {
        if (comparisonTabs.length < 2 || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
        e.preventDefault();
        const at = activeComparison ? comparisonTabs.indexOf(activeComparison) : 0;
        const next = comparisonTabs[(at + (e.key === "ArrowRight" ? 1 : comparisonTabs.length - 1)) % comparisonTabs.length];
        setComparisonTab(next);
        window.setTimeout(() => document.getElementById(`ap-cmp-tab-${next}`)?.focus(), 0);
    };

    let body: React.ReactNode;
    if (thinkingLabel && !result) {
        body = (
            <div className="ap-state">
                <TipsLoader label={thinkingLabel} />
            </div>
        );
    } else if (entry?.isError) {
        body = <ErrorState title={entry.errorTitle} message={entry.text} onRetry={entry.retry ? () => onRetry(entry) : undefined} />;
    } else if (!entry || !result) {
        body = <EmptyState title="Your analysis will appear here" message="Ask a question to see maps and tables." />;
    } else {
        const filteredOut = result.rows.length > 0 && visibleRows.length === 0;
        const expandControl = (panel: PanelId, label: string) =>
            activeExpanded === panel ? (
                <button
                    type="button"
                    className="ap-btn ap-btn--ghost ap-icon-btn ap-tip"
                    data-tip={`Close expanded ${label}`}
                    aria-label={`Close expanded ${label}`}
                    onClick={() => setExpanded(null)}
                >
                    <Icon name="close" size={16} />
                </button>
            ) : (
                <button
                    type="button"
                    className="ap-btn ap-btn--ghost ap-icon-btn ap-tip"
                    data-tip={`Expand ${label}`}
                    aria-label={`Expand ${label}`}
                    ref={el => {
                        expandButtons.current[panel] = el;
                    }}
                    onClick={() => setExpanded({ id: result.id, panel })}
                >
                    <Icon name="expand" size={15} />
                </button>
            );
        const panelProps = (panel: PanelId) => ({
            ref: (el: HTMLElement | null) => {
                panelRefs.current[panel] = el;
            },
            tabIndex: activeExpanded === panel ? -1 : undefined,
            onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === "Escape" && activeExpanded === panel) {
                    e.stopPropagation();
                    setExpanded(null);
                }
            },
        });
        const isOpen = (panel: PanelId) => activeExpanded === panel;
        const textOnly = !hasMap && !hasComparison && !showChart && !filteredOut;

        body = (
            <div style={{ display: "flex", flexDirection: "column", width: "100%", flex: "1 1 0", minHeight: 0 }}>
                <div style={{ flex: "1 1 0", minHeight: 0, display: "flex", flexDirection: "column" }}>
                    {/* Positioned wrapper: an expanded panel (position: absolute; inset: 0) fills exactly this area,
                        below the toolbar, instead of being sized by the scrolling list it is rendered in. */}
                    <div style={{ position: "relative", flex: "1 1 0", minHeight: 0, display: "flex", flexDirection: "column" }}>
                    <div
                        className="ap-work-scroll"
                        style={{
                            flex: "1 1 0",
                            minHeight: 0,
                            overflowY: "auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                            ...(busy ? { opacity: 0.55, pointerEvents: "none" } : {}),
                        }}
                    >
                        {showChart && chart && result && (
                            <section
                                {...panelProps("chart")}
                                className={`ap-panel${isOpen("chart") ? " ap-panel--expanded" : ""}`}
                                aria-label="Chart"
                                style={isOpen("chart") ? undefined : { flex: "0 0 auto", height: chartHeight, display: "flex", flexDirection: "column" }}
                            >
                                <div className="ap-panel-head">
                                    <span>Chart</span>
                                    <span className="ap-panel-actions">
                                        <button
                                            type="button"
                                            className="ap-btn ap-btn--ghost"
                                            onClick={() => setChartOverride({ id: result.id, chart: null })}
                                        >
                                            Hide chart
                                        </button>
                                        {expandControl("chart", "chart")}
                                    </span>
                                </div>
                                <div style={{ flex: "1 1 0", minHeight: 0 }}>
                                    <ChartPanel
                                        columns={result.columns}
                                        rows={visibleRows}
                                        chart={chart}
                                        settings={settings.chart}
                                        selectedKey={selectedKey}
                                        subjectKey={result.subjectKey}
                                        onSelect={setSelectedKey}
                                        onChange={next => setChartOverride({ id: result.id, chart: next })}
                                    />
                                </div>
                            </section>
                        )}

                        {textOnly && (
                            <section className="ap-panel" aria-label="Answer" style={{ flex: "0 0 auto" }}>
                                <p style={{ margin: 0, padding: 16, lineHeight: 1.6 }}>{result.answer}</p>
                            </section>
                        )}

                        {filteredOut && (
                            <section className="ap-panel" style={{ flex: "0 0 auto" }}>
                                <EmptyState
                                    title="No properties matched your current filters."
                                    actionLabel="Reset Filters"
                                    onAction={onFiltersReset}
                                />
                            </section>
                        )}

                        {hasMap && (
                            <section
                                {...panelProps("map")}
                                className={`ap-panel${isOpen("map") ? " ap-panel--expanded" : ""}`}
                                aria-label="Map"
                                style={isOpen("map") ? undefined : { flex: "1 1 0", minHeight: 320, display: "flex", flexDirection: "column", order: sectionOrder("map") }}
                            >
                                <div className="ap-panel-head">
                                    <span>Map</span>
                                    <span className="ap-panel-actions">
                                        <span style={{ color: "var(--ap-muted)", fontWeight: 500 }}>
                                            {mapProps.length}
                                            {mapProps.length !== coverageProps.length ? ` of ${coverageProps.length}` : ""} plotted
                                        </span>
                                        <button
                                            type="button"
                                            className="ap-btn ap-btn--ghost ap-icon-btn ap-tip"
                                            data-tip="Zoom in map"
                                            aria-label="Zoom in map"
                                            onClick={() => mapRef.current?.zoomIn()}
                                        >
                                            <Icon name="plus" size={15} />
                                        </button>
                                        <button
                                            type="button"
                                            className="ap-btn ap-btn--ghost ap-icon-btn ap-tip"
                                            data-tip="Zoom out map"
                                            aria-label="Zoom out map"
                                            onClick={() => mapRef.current?.zoomOut()}
                                        >
                                            <Icon name="minus" size={15} />
                                        </button>
                                        {expandControl("map", "map")}
                                    </span>
                                </div>
                                <div style={{ position: "relative", flex: "1 1 0", minHeight: 0 }}>
                                    <MapView
                                        ref={mapRef}
                                        properties={mapProps}
                                        coverage={coverageProps}
                                        selectedKey={selectedKey}
                                        apiKey={settings.aiConfiguration.mapsApiKey}
                                        area={result.area ?? null}
                                        onSelect={setSelectedKey}
                                    />
                                    {selectedProperty && (
                                        <PropertyCard property={selectedProperty} onClose={() => setSelectedKey(null)} />
                                    )}
                                </div>
                            </section>
                        )}

                        {hasComparison && activeComparison && (
                            <section
                                {...panelProps("comparison")}
                                className={`ap-panel${isOpen("comparison") ? " ap-panel--expanded" : ""}`}
                                aria-label="Comparison"
                                style={isOpen("comparison") ? undefined : { flex: "1 1 0", minHeight: 320, display: "flex", flexDirection: "column", order: sectionOrder("financial") }}
                            >
                                <div className={`ap-panel-head${tabbed ? " ap-panel-head--tabs" : ""}`}>
                                    {tabbed ? (
                                        <div className="ap-tabs ap-tabs--panel" role="tablist" aria-label="Comparison views" onKeyDown={onComparisonKeyDown}>
                                            {comparisonTabs.map(id => (
                                                <button
                                                    key={id}
                                                    type="button"
                                                    role="tab"
                                                    id={`ap-cmp-tab-${id}`}
                                                    aria-selected={activeComparison === id}
                                                    aria-controls={`ap-cmp-pane-${id}`}
                                                    tabIndex={activeComparison === id ? 0 : -1}
                                                    onClick={() => setComparisonTab(id)}
                                                >
                                                    {COMPARISON_LABELS[id]}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <span>{COMPARISON_LABELS[activeComparison]}</span>
                                    )}
                                    <span className="ap-panel-actions">
                                        {activeComparison === "property" && selection && (
                                            <span style={{ color: "var(--ap-muted)", fontWeight: 500 }}>
                                                {selection.selectedKeys.length + (selection.subjectKey ? 1 : 0)} of {selection.options.length + (selection.subjectKey ? 1 : 0)} selected
                                            </span>
                                        )}
                                        {activeComparison === "property" && selection && selection.status === "loading" && (
                                            <span role="status" style={{ color: "var(--ap-muted)", fontWeight: 500 }}>Updating…</span>
                                        )}
                                        {activeComparison === "property" && selection && selection.status === "error" && (
                                            <span role="alert" style={{ color: "var(--ap-danger)", fontWeight: 500 }}>
                                                Couldn't update{" "}
                                                <button type="button" className="ap-btn ap-btn--ghost" onClick={() => changeSelection(selection.selectedKeys)}>Retry</button>
                                            </span>
                                        )}
                                        {expandControl("comparison", activeComparison === "property" ? "property comparison" : "financial comparison")}
                                    </span>
                                </div>
                                {/* Both views stay mounted and only the active one is shown, so switching tabs keeps each view's state. */}
                                {hasFinancialSection && (
                                    <div
                                        role={tabbed ? "tabpanel" : undefined}
                                        id="ap-cmp-pane-financial"
                                        aria-labelledby={tabbed ? "ap-cmp-tab-financial" : undefined}
                                        style={{ position: "relative", flex: "1 1 0", minHeight: 0, display: activeComparison === "financial" ? "flex" : "none", flexDirection: "column" }}
                                    >
                                        {showFinancials && financials ? (
                                            <div style={{ position: "absolute", inset: 0 }}>
                                                <FinancialComparison
                                                    financials={financials}
                                                    subjectKey={result?.subjectKey ?? null}
                                                    allowedKeys={allowedKeys}
                                                    onLoadFinancials={onLoadFinancials}
                                                    fontSize={tableFont}
                                                    settings={settings.comparisonTable}
                                                />
                                            </div>
                                        ) : showFinancialsError ? (
                                            <ErrorState title="Financial data unavailable" message={financialsError ?? "Financial data is unavailable."} />
                                        ) : (
                                            <div style={{ display: "grid", placeItems: "center", flex: "1 1 auto", padding: "14px 12px" }}>
                                                <TipsLoader label="Loading financial figures" compact />
                                            </div>
                                        )}
                                    </div>
                                )}
                                {hasTable && (
                                    <div
                                        role={tabbed ? "tabpanel" : undefined}
                                        id="ap-cmp-pane-property"
                                        aria-labelledby={tabbed ? "ap-cmp-tab-property" : undefined}
                                        style={{ position: "relative", flex: "1 1 0", minHeight: 0, display: activeComparison === "property" ? "flex" : "none", flexDirection: "column" }}
                                    >
                                        <div style={{ position: "absolute", inset: 0 }}>
                                            <PropertyComparison
                                                selection={selection}
                                                onSelectionChange={changeSelection}
                                                columns={tableColumns}
                                                rows={visibleRows}
                                                notFound={result.unresolved}
                                                selectedKey={selectedKey}
                                                fontSize={tableFont}
                                                settings={settings.comparisonTable}
                                                onSelect={setSelectedKey}
                                            />
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}
                    </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="ap-work" style={{ width: "100%", height: "100%" }}>
            {body}
        </div>
    );
};

export default ResponseWorkspace;