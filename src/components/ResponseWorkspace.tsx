import * as React from "react";
import type { VisualSettings } from "../settings";
import type { ChatEntry, FilterOptions, FilterState } from "../types";
import { applyFilters } from "../utils/filters";
import { toMapProperties } from "../utils/normalize";
import DataTable from "./DataTable";
import MapView, { type MapHandle } from "./MapView";
import PropertyCard from "./PropertyCard";
import PropertyComparison from "./PropertyComparison";
import ResponseToolbar from "./ResponseToolbar";
import { EmptyState, ErrorState } from "./StateViews";
import ThinkingIndicator from "./ThinkingIndicator";

export interface ResponseWorkspaceProps {
    entry: ChatEntry | null;
    busy: boolean;
    thinkingLabel: string | null;
    filters: FilterState;
    options: FilterOptions;
    settings: VisualSettings;
    onFiltersReset: () => void;
    onRetry: (entry: ChatEntry) => void;
}

export const ResponseWorkspace: React.FC<ResponseWorkspaceProps> = ({
    entry, busy, thinkingLabel, filters, options, settings,
    onFiltersReset, onRetry,
}) => {
    const mapRef = React.useRef<MapHandle>(null);
    const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
    const [view, setView] = React.useState<"table" | "comparison">("table");
    const [fontDelta, setFontDelta] = React.useState(0);

    const result = entry?.result ?? null;

    React.useEffect(() => {
        setSelectedKey(null);
        setView("table");
        setFontDelta(0);
    }, [result?.id]);

    const visibleRows = React.useMemo(
        () => (result ? applyFilters(result.rows, filters, options) : []),
        [result, filters, options],
    );
    const mapProps = React.useMemo(() => toMapProperties(visibleRows), [visibleRows]);
    const coverageProps = React.useMemo(() => (result ? toMapProperties(result.rows) : []), [result]);

    const hasMap = mapProps.length > 0;
    const hasTable = visibleRows.length > 0 && (result?.columns.length ?? 0) > 0;
    const selectedProperty = mapProps.find(p => p.key === selectedKey) ?? null;
    const tableFont = Math.min(18, Math.max(10, settings.comparisonTable.fontSize + fontDelta));
    const zoomTarget: "map" | "table" | null = hasMap ? "map" : hasTable ? "table" : null;

    const handleZoom = (dir: 1 | -1) => {
        if (zoomTarget === "map") {
            if (dir === 1) mapRef.current?.zoomIn();
            else mapRef.current?.zoomOut();
        } else {
            setFontDelta(d => Math.min(6, Math.max(-2, d + dir)));
        }
    };

    let body: React.ReactNode;
    if (thinkingLabel && !result) {
        body = (
            <div className="ap-state">
                <ThinkingIndicator label={thinkingLabel} size={84} />
            </div>
        );
    } else if (entry?.isError) {
        body = <ErrorState message={entry.text} onRetry={entry.retry ? () => onRetry(entry) : undefined} />;
    } else if (!entry || !result) {
        body = <EmptyState title="Your analysis will appear here" message="Ask a question to see maps and tables." />;
    } else {
        const filteredOut = result.rows.length > 0 && visibleRows.length === 0;
        const textOnly = !hasMap && !hasTable && !filteredOut;
        body = (
            <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", minHeight: 0 }}>
                <div style={{ flex: "1 1 0", minHeight: 0, display: "flex", flexDirection: "column" }}>
                    <ResponseToolbar
                        zoomTarget={zoomTarget}
                        summary={result.rows.length > 0 ? `${visibleRows.length} of ${result.rows.length} properties` : "Text answer"}
                        onZoomIn={() => handleZoom(1)}
                        onZoomOut={() => handleZoom(-1)}
                    />
                    <div
                        className="ap-work-scroll"
                        style={{
                            flex: "1 1 0",
                            minHeight: 0,
                            overflowY: "auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                            ...(busy ? { opacity: 0.55, pointerEvents: "none" } : {}),
                        }}
                    >
                        {result.unresolved.length > 0 && (
                            <div style={{ flex: "0 0 auto", color: "var(--ap-danger)", padding: "0 4px" }}>
                                Couldn't match: {result.unresolved.join(", ")}
                            </div>
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
                                className="ap-panel"
                                aria-label="Map"
                                style={{ flex: hasTable ? "1 1 56%" : "1 1 100%", minHeight: 340, display: "flex", flexDirection: "column" }}
                            >
                                <div className="ap-panel-head">
                                    <span>Map</span>
                                    <span style={{ color: "var(--ap-muted)", fontWeight: 500 }}>{mapProps.length} plotted</span>
                                </div>
                                <div style={{ position: "relative", flex: "1 1 0", minHeight: 0 }}>
                                    <MapView
                                        ref={mapRef}
                                        properties={mapProps}
                                        coverage={coverageProps}
                                        selectedKey={selectedKey}
                                        apiKey={settings.aiConfiguration.mapsApiKey}
                                        onSelect={setSelectedKey}
                                    />
                                    {selectedProperty && (
                                        <PropertyCard property={selectedProperty} onClose={() => setSelectedKey(null)} />
                                    )}
                                </div>
                            </section>
                        )}

                        {hasTable && (
                            <section
                                className="ap-panel"
                                aria-label="Properties table"
                                style={{ flex: hasMap ? "1 1 44%" : "1 1 100%", minHeight: 260, display: "flex", flexDirection: "column" }}
                            >
                                <div className="ap-panel-head">
                                    <span>{result.comparable ? "Property Comparison" : "Properties"}</span>
                                    {result.comparable && (
                                        <div className="ap-seg" role="group" aria-label="Table layout">
                                            <button type="button" aria-pressed={view === "table"} onClick={() => setView("table")}>Table</button>
                                            <button type="button" aria-pressed={view === "comparison"} onClick={() => setView("comparison")}>Side by side</button>
                                        </div>
                                    )}
                                </div>
                                <div style={{ position: "relative", flex: "1 1 0", minHeight: 0 }}>
                                    <div style={{ position: "absolute", inset: 0 }}>
                                        {view === "comparison" && result.comparable ? (
                                            <PropertyComparison
                                                columns={result.columns}
                                                rows={visibleRows}
                                                notFound={result.unresolved}
                                                selectedKey={selectedKey}
                                                fontSize={tableFont}
                                                settings={settings.comparisonTable}
                                                onSelect={setSelectedKey}
                                            />
                                        ) : (
                                            <DataTable
                                                columns={result.columns}
                                                rows={visibleRows}
                                                selectedKey={selectedKey}
                                                fontSize={tableFont}
                                                settings={settings.comparisonTable}
                                                onSelect={setSelectedKey}
                                            />
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}
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
