import * as React from "react";
import type { ChartSettings } from "../settings";
import type { ChartRequest, TableColumn, TableRow } from "../types";
import {
    buildChartData, chartableColumns, formatPoint, paletteFor, supportsShare,
    type ChartData,
} from "../utils/charts";

export interface ChartRendererProps {
    data: ChartData;
    settings: ChartSettings;
    selectedKey: string | null;
    subjectKey: string | null;
    width: number;
    onSelect: (key: string) => void;
}

export interface ChartTypeDefinition {
    type: string;
    label: string;
    supports: (column: TableColumn) => boolean;
    render: React.FC<ChartRendererProps>;
}

const REGISTRY = new Map<string, ChartTypeDefinition>();

export function registerChartType(definition: ChartTypeDefinition): void {
    REGISTRY.set(definition.type, definition);
}

export function chartTypes(): ChartTypeDefinition[] {
    return Array.from(REGISTRY.values());
}

function truncate(text: string, max: number): string {
    return text.length > max ? `${text.slice(0, Math.max(1, max - 1))}…` : text;
}

function useWidth(ref: React.RefObject<HTMLDivElement>): number {
    const [width, setWidth] = React.useState(640);
    React.useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const apply = () => {
            const w = Math.round(el.getBoundingClientRect().width);
            if (w > 0) setWidth(prev => (Math.abs(prev - w) > 2 ? w : prev));
        };
        apply();
        if (typeof ResizeObserver === "undefined") return undefined;
        const observer = new ResizeObserver(apply);
        observer.observe(el);
        return () => observer.disconnect();
    }, [ref]);
    return width;
}

const BarRenderer: React.FC<ChartRendererProps> = ({ data, settings, selectedKey, subjectKey, width, onSelect }) => {
    const fs = settings.fontSize;
    const rowH = Math.max(26, fs * 2.2);
    const labelW = Math.min(220, Math.max(110, width * 0.28));
    const valueW = settings.showValues ? Math.max(48, fs * 5) : 12;
    const top = 8;
    const axisH = 22;
    const plotW = Math.max(60, width - labelW - valueW - 16);
    const max = Math.max(...data.points.map(p => p.value), 0) || 1;
    const height = top + data.points.length * rowH + axisH;
    const ticks = [0, 0.25, 0.5, 0.75, 1];
    const maxChars = Math.floor(labelW / (fs * 0.56));

    return (
        <svg width={width} height={height} role="img" aria-label={data.title} style={{ display: "block", fontSize: fs }}>
            {ticks.map(t => {
                const x = labelW + plotW * t;
                return (
                    <g key={t}>
                        <line x1={x} x2={x} y1={top} y2={height - axisH} stroke={settings.gridColor} strokeWidth={1} />
                        <text x={x} y={height - 6} textAnchor={t === 1 ? "end" : t === 0 ? "start" : "middle"} fill={settings.textColor} opacity={0.6} fontSize={fs - 1}>
                            {formatPoint(data, max * t)}
                        </text>
                    </g>
                );
            })}
            {data.points.map((p, i) => {
                const y = top + i * rowH;
                const w = Math.max(0, (Math.max(p.value, 0) / max) * plotW);
                const isSubject = subjectKey !== null && p.key === subjectKey;
                const selected = selectedKey === p.key;
                const fill = isSubject ? settings.secondaryColor : settings.primaryColor;
                return (
                    <g
                        key={p.key}
                        style={{ cursor: "pointer" }}
                        onClick={() => onSelect(p.key)}
                        opacity={selectedKey && !selected ? 0.55 : 1}
                    >
                        <title>{`${p.label}: ${formatPoint(data, p.value)}`}</title>
                        <rect x={0} y={y} width={width} height={rowH} fill="transparent" />
                        <text x={labelW - 8} y={y + rowH / 2} textAnchor="end" dominantBaseline="central" fill={settings.textColor}>
                            {truncate(p.label, maxChars)}
                        </text>
                        <rect x={labelW} y={y + rowH * 0.18} width={w} height={rowH * 0.64} rx={3} fill={fill} />
                        {settings.showValues && (
                            <text x={labelW + w + 6} y={y + rowH / 2} dominantBaseline="central" fill={settings.textColor} fontWeight={600}>
                                {formatPoint(data, p.value)}
                            </text>
                        )}
                    </g>
                );
            })}
        </svg>
    );
};

function polar(cx: number, cy: number, r: number, angle: number): [number, number] {
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function slicePath(cx: number, cy: number, r: number, start: number, end: number): string {
    const [x1, y1] = polar(cx, cy, r, start);
    const [x2, y2] = polar(cx, cy, r, end);
    const large = end - start > Math.PI ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

const PieRenderer: React.FC<ChartRendererProps> = ({ data, settings, selectedKey, width, onSelect }) => {
    const [hover, setHover] = React.useState<string | null>(null);
    const fs = settings.fontSize;
    const colors = React.useMemo(
        () => paletteFor(settings.primaryColor, settings.secondaryColor, data.points.length),
        [settings.primaryColor, settings.secondaryColor, data.points.length],
    );
    const stacked = width < 520;
    const size = Math.max(160, Math.min(300, stacked ? width - 24 : width * 0.46));
    const r = size / 2 - 10;
    const cx = size / 2;
    const cy = size / 2;

    let cursor = -Math.PI / 2;
    const slices = data.points.map((p, i) => {
        const angle = (p.value / data.total) * Math.PI * 2;
        const start = cursor;
        const end = cursor + angle;
        cursor = end;
        const color = p.isOther ? "#cbd5e1" : colors[i];
        return { p, start, end, mid: (start + end) / 2, color, pct: (p.value / data.total) * 100 };
    });

    return (
        <div style={{ display: "flex", flexDirection: stacked ? "column" : "row", alignItems: stacked ? "center" : "flex-start", gap: 16, padding: "4px 8px" }}>
            <svg width={size} height={size} role="img" aria-label={data.title} style={{ flexShrink: 0 }}>
                {slices.map(s => {
                    const active = hover === s.p.key || selectedKey === s.p.key;
                    const shift = active ? 6 : 0;
                    const dx = Math.cos(s.mid) * shift;
                    const dy = Math.sin(s.mid) * shift;
                    const common = {
                        fill: s.color,
                        stroke: settings.backgroundColor,
                        strokeWidth: 1.5,
                        transform: `translate(${dx} ${dy})`,
                        style: { cursor: s.p.isOther ? "default" : "pointer", transition: "transform .12s" },
                        onMouseEnter: () => setHover(s.p.key),
                        onMouseLeave: () => setHover(null),
                        onClick: () => {
                            if (!s.p.isOther) onSelect(s.p.key);
                        },
                    };
                    const tip = <title>{`${s.p.label}: ${formatPoint(data, s.p.value)} (${s.pct.toFixed(1)}%)`}</title>;
                    if (slices.length === 1) {
                        return <circle key={s.p.key} cx={cx} cy={cy} r={r} {...common}>{tip}</circle>;
                    }
                    return <path key={s.p.key} d={slicePath(cx, cy, r, s.start, s.end)} {...common}>{tip}</path>;
                })}
            </svg>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, flex: 1, width: stacked ? "100%" : undefined, fontSize: fs }}>
                {slices.map(s => (
                    <button
                        key={s.p.key}
                        type="button"
                        className="ap-legend-row"
                        onMouseEnter={() => setHover(s.p.key)}
                        onMouseLeave={() => setHover(null)}
                        onClick={() => {
                            if (!s.p.isOther) onSelect(s.p.key);
                        }}
                        aria-pressed={selectedKey === s.p.key}
                    >
                        <span className="ap-legend-dot" style={{ background: s.color }} />
                        <span className="ap-legend-label" title={s.p.label} style={{ color: settings.textColor }}>{s.p.label}</span>
                        {settings.showValues && (
                            <span className="ap-legend-val" style={{ color: settings.textColor }}>
                                {formatPoint(data, s.p.value)} · {s.pct.toFixed(1)}%
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

registerChartType({ type: "bar", label: "Bar", supports: () => true, render: BarRenderer });
registerChartType({ type: "pie", label: "Pie", supports: column => supportsShare(column), render: PieRenderer });

export interface ChartPanelProps {
    columns: TableColumn[];
    rows: TableRow[];
    chart: ChartRequest;
    settings: ChartSettings;
    selectedKey: string | null;
    subjectKey: string | null;
    onSelect: (key: string) => void;
    onChange: (next: ChartRequest) => void;
}

export const ChartPanel: React.FC<ChartPanelProps> = ({
    columns, rows, chart, settings, selectedKey, subjectKey, onSelect, onChange,
}) => {
    const hostRef = React.useRef<HTMLDivElement>(null);
    const width = useWidth(hostRef);
    const options = React.useMemo(() => chartableColumns(columns, rows), [columns, rows]);
    const metric = chart.metric ?? options[0]?.key ?? null;
    const activeColumn = columns.find(c => c.key === metric) ?? null;
    const definition = REGISTRY.get(chart.type) ?? null;

    const data = React.useMemo(
        () => (definition ? buildChartData(chart.type, columns, rows, metric, chart.title) : null),
        [definition, chart.type, columns, rows, metric, chart.title],
    );

    const availableTypes = chartTypes().filter(t => (activeColumn ? t.supports(activeColumn) : true));
    const Renderer = definition?.render ?? null;

    const emptyMessage = !definition
        ? "This chart type is not available."
        : options.length === 0
            ? "These results have no numeric values to chart."
            : "No chartable values for this selection. Try another metric or chart type.";

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, background: settings.backgroundColor }}>
            <div className="ap-chart-controls">
                <div className="ap-seg" role="group" aria-label="Chart type">
                    {availableTypes.map(t => (
                        <button
                            key={t.type}
                            type="button"
                            aria-pressed={t.type === chart.type}
                            onClick={() => onChange({ type: t.type, metric, title: null })}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                {options.length > 1 && (
                    <select
                        className="ap-select ap-chart-select"
                        aria-label="Chart metric"
                        value={metric ?? ""}
                        onChange={e => onChange({ type: chart.type, metric: e.target.value, title: null })}
                    >
                        {options.map(c => (
                            <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                    </select>
                )}
            </div>
            <div ref={hostRef} className="ap-chart-body" style={{ color: settings.textColor }}>
                {data && Renderer ? (
                    <>
                        <div className="ap-chart-title" style={{ color: settings.textColor, fontSize: settings.fontSize + 1 }}>{data.title}</div>
                        <Renderer
                            data={data}
                            settings={settings}
                            selectedKey={selectedKey}
                            subjectKey={subjectKey}
                            width={width}
                            onSelect={onSelect}
                        />
                    </>
                ) : (
                    <div className="ap-state" style={{ padding: 16 }}>
                        <div className="ap-state-title">Nothing to chart</div>
                        <div>{emptyMessage}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(ChartPanel);
