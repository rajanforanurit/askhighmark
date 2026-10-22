import * as React from "react";
import type { AreaInfo, MapProperty } from "../types";
import { FIELD_ALIASES, pick } from "../utils/fields";
import { formatValue } from "../utils/format";
import { MapsError, loadGoogleMaps, resetMapsLoader, type MapsFailure } from "../services/googleMaps";

export interface MapHandle {
    zoomIn: () => void;
    zoomOut: () => void;
}

export interface MapViewProps {
    properties: MapProperty[];
    coverage: MapProperty[];
    selectedKey: string | null;
    apiKey: string;
    area?: AreaInfo | null;
    onSelect: (key: string | null) => void;
}

interface MarkerEntry {
    marker: google.maps.marker.AdvancedMarkerElement;
    el: HTMLDivElement;
    subject: boolean;
}

interface Point {
    lat: number;
    lng: number;
}

const MAIN_COLOR = "#ea4335";
const NEARBY_COLOR = "#fbbc04";
const LINE_COLOR = "#4fd1c5";
const RING_COLOR = "#f97316";
const MILE_METERS = 1609.344;
const EARTH_RADIUS = 6371008.8;
const RING_STEPS = 120;
const RESIZE_REFIT_DELAY_MS = 120;
// The dashed search ring grows with the spread of the properties so the covered area is easy to see.
const RING_SCALE = 1.3;
const RING_PADDING_MILES = 2;
const SVG_NS = "http://www.w3.org/2000/svg";
const FIT_DELAY_MS = 120;
const MAX_FIT_ZOOM = 16;

const FAILURE_TEXT: Record<MapsFailure, string> = {
    "no-key": "The map is not available right now.",
    "auth": "The map is not available right now.",
    "load": "The map could not be loaded.",
};

function shortName(name: string): string {
    return name.length > 22 ? `${name.slice(0, 20)}…` : name;
}

function toRad(deg: number): number {
    return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
    return (rad * 180) / Math.PI;
}

function distanceMeters(a: Point, b: Point): number {
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS * Math.asin(Math.min(1, Math.sqrt(h)));
}

function offsetPoint(center: Point, bearing: number, meters: number): Point {
    const d = meters / EARTH_RADIUS;
    const lat1 = toRad(center.lat);
    const lng1 = toRad(center.lng);
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(bearing));
    const lng2 = lng1 + Math.atan2(Math.sin(bearing) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
    return { lat: toDeg(lat2), lng: toDeg(lng2) };
}

function buildRing(properties: MapProperty[]): Point[] {
    if (properties.length === 0) return [];
    const subject = properties.find(p => p.isSubject);
    const center: Point = subject
        ? { lat: subject.lat, lng: subject.lng }
        : {
            lat: properties.reduce((sum, p) => sum + p.lat, 0) / properties.length,
            lng: properties.reduce((sum, p) => sum + p.lng, 0) / properties.length,
        };
    const farthest = properties.reduce((max, p) => Math.max(max, distanceMeters(center, p)), 0);
    const radius = farthest * RING_SCALE + RING_PADDING_MILES * MILE_METERS;
    const path: Point[] = [];
    for (let i = 0; i <= RING_STEPS; i += 1) {
        path.push(offsetPoint(center, (i / RING_STEPS) * 2 * Math.PI, radius));
    }
    return path;
}

function ringPoints(source: MapProperty[]): Point[] {
    return buildRing(source);
}

function applySelected(el: HTMLDivElement, selected: boolean): void {
    el.style.transform = selected ? "scale(1.2)" : "none";
}

function buildPin(p: MapProperty, index: number): HTMLDivElement {
    const subject = Boolean(p.isSubject);
    const width = subject ? 34 : 28;
    const height = subject ? 46 : 38;
    const el = document.createElement("div");
    el.className = "hm-pin";
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", p.name);
    el.style.position = "relative";
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
    el.style.cursor = "pointer";
    el.style.transformOrigin = "50% 100%";
    el.style.transition = "transform 0.15s ease";

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 28 38");
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.style.display = "block";
    svg.style.filter = "drop-shadow(0 2px 2px rgba(0, 0, 0, 0.35))";
    const shape = document.createElementNS(SVG_NS, "path");
    shape.setAttribute("d", "M14 1C7 1 1.5 6.4 1.5 13.2c0 8.9 10.4 22.4 12.5 24.3 2.1-1.9 12.5-15.4 12.5-24.3C26.5 6.4 21 1 14 1z");
    shape.setAttribute("fill", subject ? MAIN_COLOR : NEARBY_COLOR);
    shape.setAttribute("stroke", "#ffffff");
    shape.setAttribute("stroke-width", "2");
    const core = document.createElementNS(SVG_NS, "circle");
    core.setAttribute("cx", "14");
    core.setAttribute("cy", "13");
    core.setAttribute("r", "4.6");
    core.setAttribute("fill", "#ffffff");
    svg.append(shape, core);

    const label = document.createElement("span");
    const rent = pick(p.values, [...FIELD_ALIASES.rentPsf]);
    if (subject) label.textContent = shortName(p.name);
    else if (rent !== undefined) label.textContent = formatValue(rent, "currency");
    else label.textContent = String(index);
    Object.assign(label.style, {
        position: "absolute",
        bottom: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        marginBottom: "2px",
        padding: "2px 6px",
        borderRadius: "6px",
        background: "#ffffff",
        color: "#0f172a",
        fontSize: "11px",
        fontWeight: "600",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.3)",
    });

    el.append(svg, label);
    return el;
}

const LEGEND_ITEM: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6 };

export const MapView = React.forwardRef<MapHandle, MapViewProps>(function MapView(
    { properties, coverage, selectedKey, apiKey, area, onSelect },
    ref,
) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const mapRef = React.useRef<google.maps.Map | null>(null);
    const markersRef = React.useRef<Map<string, MarkerEntry>>(new Map());
    const linesRef = React.useRef<google.maps.Polyline[]>([]);
    const ringRef = React.useRef<google.maps.Polyline | null>(null);
    const areaRef = React.useRef<google.maps.Rectangle | google.maps.Circle | null>(null);
    const onSelectRef = React.useRef(onSelect);
    const fitRef = React.useRef<(fillCircle?: boolean) => void>(() => undefined);
    const [status, setStatus] = React.useState<"loading" | "ready" | "failed">("loading");
    const [failure, setFailure] = React.useState<MapsFailure>("load");
    const [attempt, setAttempt] = React.useState(0);

    onSelectRef.current = onSelect;

    React.useImperativeHandle(ref, () => ({
        zoomIn: () => {
            const m = mapRef.current;
            if (m) m.setZoom((m.getZoom() ?? 12) + 1);
        },
        zoomOut: () => {
            const m = mapRef.current;
            if (m) m.setZoom((m.getZoom() ?? 12) - 1);
        },
    }));

    // Keep the map correct when its panel is expanded, collapsed or the visual is resized.
    React.useEffect(() => {
        const el = containerRef.current;
        if (!el || typeof ResizeObserver === "undefined") return;
        let frame = 0;
        let refit = 0;
        let last = { w: el.clientWidth, h: el.clientHeight };
        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                const m = mapRef.current;
                if (!m || typeof google === "undefined") return;
                google.maps.event.trigger(m, "resize");
                // When the viewport changes materially (full-screen expand/collapse, window resize) refit the view so
                // the search circle scales with the map: it fills most of the new viewport, centered, instead of
                // keeping its old pixel size. Small changes (e.g. scrollbars) leave the user's zoom and pan alone.
                const w = el.clientWidth;
                const h = el.clientHeight;
                const changed = Math.abs(w - last.w) > Math.max(24, last.w * 0.08) || Math.abs(h - last.h) > Math.max(24, last.h * 0.08);
                last = { w, h };
                if (!changed) return;
                window.clearTimeout(refit);
                refit = window.setTimeout(() => fitRef.current(true), RESIZE_REFIT_DELAY_MS);
            });
        });
        observer.observe(el);
        return () => {
            cancelAnimationFrame(frame);
            window.clearTimeout(refit);
            observer.disconnect();
        };
    }, [status]);

    React.useEffect(() => {
        let cancelled = false;
        setStatus("loading");
        loadGoogleMaps(apiKey)
            .then(maps => {
                if (cancelled || !containerRef.current) return;
                mapRef.current = new maps.Map(containerRef.current, {
                    center: { lat: 39.5, lng: -98.35 },
                    zoom: 4,
                    mapId: "DEMO_MAP_ID",
                    disableDefaultUI: true,
                    zoomControl: false,
                    clickableIcons: false,
                    gestureHandling: "cooperative",
                });
                mapRef.current.addListener("click", () => onSelectRef.current(null));
                setStatus("ready");
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                setFailure(err instanceof MapsError ? err.reason : "load");
                setStatus("failed");
            });
        const markers = markersRef.current;
        return () => {
            cancelled = true;
            markers.forEach(e => {
                e.marker.map = null;
            });
            markers.clear();
            linesRef.current.forEach(l => l.setMap(null));
            linesRef.current = [];
            if (ringRef.current) ringRef.current.setMap(null);
            ringRef.current = null;
            if (areaRef.current) areaRef.current.setMap(null);
            areaRef.current = null;
            mapRef.current = null;
        };
    }, [apiKey, attempt]);

    React.useEffect(() => {
        const map = mapRef.current;
        if (status !== "ready" || !map) return;
        const markers = markersRef.current;
        const wanted = new Map(properties.map(p => [p.key, Boolean(p.isSubject)]));
        markers.forEach((entry, key) => {
            if (!wanted.has(key) || wanted.get(key) !== entry.subject) {
                entry.marker.map = null;
                markers.delete(key);
            }
        });
        let nearbyIndex = 0;
        properties.forEach(p => {
            if (!p.isSubject) nearbyIndex += 1;
            const existing = markers.get(p.key);
            if (existing) {
                existing.marker.position = { lat: p.lat, lng: p.lng };
                return;
            }
            const el = buildPin(p, nearbyIndex);
            const marker = new google.maps.marker.AdvancedMarkerElement({
                map,
                position: { lat: p.lat, lng: p.lng },
                content: el,
                title: p.name,
                zIndex: p.isSubject ? 3 : 1,
            });
            const key = p.key;
            el.addEventListener("click", ev => {
                ev.stopPropagation();
                onSelectRef.current(key);
            });
            el.addEventListener("keydown", ev => {
                if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    onSelectRef.current(key);
                }
            });
            markers.set(p.key, { marker, el, subject: Boolean(p.isSubject) });
        });

        linesRef.current.forEach(l => l.setMap(null));
        linesRef.current = [];
        const subject = properties.find(p => p.isSubject);
        if (subject) {
            properties.filter(p => !p.isSubject).forEach(p => {
                linesRef.current.push(new google.maps.Polyline({
                    map,
                    path: [{ lat: subject.lat, lng: subject.lng }, { lat: p.lat, lng: p.lng }],
                    strokeOpacity: 0,
                    clickable: false,
                    zIndex: 1,
                    icons: [{
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            fillColor: LINE_COLOR,
                            fillOpacity: 1,
                            strokeWeight: 0,
                            scale: 2,
                        },
                        offset: "0",
                        repeat: "10px",
                    }],
                }));
            });
        }

        if (ringRef.current) ringRef.current.setMap(null);
        ringRef.current = null;
        const ringPath = area ? [] : ringPoints(coverage.length > 0 ? coverage : properties);
        if (ringPath.length > 0) {
            ringRef.current = new google.maps.Polyline({
                map,
                path: ringPath,
                strokeOpacity: 0,
                clickable: false,
                zIndex: 0,
                icons: [{
                    icon: {
                        path: "M 0,-1 0,1",
                        strokeColor: RING_COLOR,
                        strokeOpacity: 0.9,
                        strokeWeight: 3,
                        scale: 2.5,
                    },
                    offset: "0",
                    repeat: "14px",
                }],
            });
        }

    }, [properties, coverage, area, status]);

    const fitSignature = `${properties.map(p => p.key).sort().join("|")}#${coverage.length}#${area ? `${area.lat},${area.lng},${area.total}` : ""}`;

    // Fits the view to the properties, search area and ring. Held in a ref (refreshed every render) so the resize
    // observer can reuse it with the latest data.
    // fillCircle (used after a resize/expand) also fits the whole search circle so it fills most of the viewport.
    fitRef.current = (fillCircle = false) => {
        const map = mapRef.current;
        if (status !== "ready" || !map) return;
        const bounds = new google.maps.LatLngBounds();
        let any = false;
        properties.forEach(p => {
            bounds.extend({ lat: p.lat, lng: p.lng });
            any = true;
        });
        if (area) {
            if (area.bounds) {
                bounds.union(new google.maps.LatLngBounds(
                    { lat: area.bounds.south, lng: area.bounds.west },
                    { lat: area.bounds.north, lng: area.bounds.east },
                ));
            } else {
                ringPoints([{ key: "area", name: area.name, lat: area.lat, lng: area.lng, isSubject: true, values: {} }])
                    .forEach(pt => bounds.extend(pt));
                bounds.extend({ lat: area.lat, lng: area.lng });
            }
            any = true;
        } else if (properties.length === 0 || properties.length === coverage.length) {
            ringPoints(coverage.length > 0 ? coverage : properties).forEach(pt => bounds.extend(pt));
        }
        if (fillCircle) {
            if (!area) ringPoints(coverage.length > 0 ? coverage : properties).forEach(pt => bounds.extend(pt));
            const circle = areaRef.current;
            const circleBounds = circle && "getBounds" in circle ? circle.getBounds() : null;
            if (circleBounds) bounds.union(circleBounds);
        }
        if (!any) return;
        map.fitBounds(bounds, 40);
        google.maps.event.addListenerOnce(map, "idle", () => {
            const zoom = map.getZoom();
            if (zoom !== undefined && zoom > MAX_FIT_ZOOM) map.setZoom(MAX_FIT_ZOOM);
        });
    };

    React.useEffect(() => {
        if (status !== "ready") return undefined;
        const timer = window.setTimeout(() => fitRef.current(), FIT_DELAY_MS);
        return () => window.clearTimeout(timer);
    }, [fitSignature, status]);

    React.useEffect(() => {
        const map = mapRef.current;
        if (status !== "ready" || !map) return undefined;
        if (areaRef.current) areaRef.current.setMap(null);
        areaRef.current = null;
        if (!area) return undefined;
        const style = {
            map,
            strokeColor: RING_COLOR,
            strokeOpacity: 0.9,
            strokeWeight: 2,
            fillColor: RING_COLOR,
            fillOpacity: 0.06,
            clickable: false,
            zIndex: 0,
        };
        areaRef.current = area.bounds
            ? new google.maps.Rectangle({
                ...style,
                bounds: { north: area.bounds.north, south: area.bounds.south, east: area.bounds.east, west: area.bounds.west },
            })
            : new google.maps.Circle({
                ...style,
                center: { lat: area.lat, lng: area.lng },
                radius: (area.radiusMiles ?? 5) * MILE_METERS,
            });
        return () => {
            if (areaRef.current) areaRef.current.setMap(null);
            areaRef.current = null;
        };
    }, [area, status]);

    React.useEffect(() => {
        markersRef.current.forEach((entry, key) => {
            const selected = key === selectedKey;
            applySelected(entry.el, selected);
            entry.marker.zIndex = selected ? 10 : entry.subject ? 3 : 1;
        });
        const map = mapRef.current;
        const target = properties.find(p => p.key === selectedKey);
        if (map && target) {
            const pos = { lat: target.lat, lng: target.lng };
            const bounds = map.getBounds();
            if (bounds && !bounds.contains(pos)) map.panTo(pos);
        }
    }, [selectedKey, properties, status]);

    const retry = () => {
        resetMapsLoader();
        setAttempt(a => a + 1);
    };

    const hasSubject = properties.some(p => p.isSubject);
    const hasNearby = properties.some(p => !p.isSubject);

    return (
        <div className="ap-map-wrap" style={{ position: "absolute", inset: 0, height: "auto", minHeight: 0 }}>
            <div className="ap-map" ref={containerRef} role="application" aria-label="Property map" style={{ width: "100%", height: "100%" }} />
            {status === "loading" && <div className="ap-map-msg" role="status">Loading map…</div>}
            {status === "failed" && (
                <div className="ap-map-msg" role="alert">
                    <div style={{ color: "var(--ap-ink)", fontWeight: 600 }}>{FAILURE_TEXT[failure]}</div>
                    {failure === "load" && (
                        <button type="button" className="ap-btn" onClick={retry}>Retry</button>
                    )}
                </div>
            )}
            {status === "ready" && properties.length > 0 && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        zIndex: 2,
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        padding: "6px 10px",
                        borderRadius: 8,
                        background: "rgba(255, 255, 255, 0.92)",
                        boxShadow: "0 1px 4px rgba(15, 23, 42, 0.25)",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#0f172a",
                        pointerEvents: "none",
                    }}
                >
                    {hasSubject && (
                        <div style={LEGEND_ITEM}>
                            <span style={{ width: 10, height: 10, borderRadius: "50%", background: MAIN_COLOR }} />
                            Main property
                        </div>
                    )}
                    {hasNearby && (
                        <div style={LEGEND_ITEM}>
                            <span style={{ width: 10, height: 10, borderRadius: "50%", background: NEARBY_COLOR }} />
                            {area ? "Properties in area" : "Nearby properties"}
                        </div>
                    )}
                    <div style={LEGEND_ITEM}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", border: `2px dashed ${RING_COLOR}`, boxSizing: "border-box" }} />
                        {area ? (area.name.length > 26 ? `${area.name.slice(0, 25)}…` : area.name) : "Search area"}
                    </div>
                </div>
            )}
        </div>
    );
});

export default React.memo(MapView);
