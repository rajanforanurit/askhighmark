import * as React from "react";
import type { PropertyRecord } from "../api";
import type { MapSettings } from "../settings";

export interface PropertyMapProps {
    target: PropertyRecord;
    nearby: PropertyRecord[];
    settings: MapSettings;
    width: number;
    height: number;
}

interface Bounds {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
}

const PADDING = 30;

function project(lat: number, lng: number, bounds: Bounds, width: number, height: number): { x: number; y: number } {
    const latRange = bounds.maxLat - bounds.minLat || 0.01;
    const lngRange = bounds.maxLng - bounds.minLng || 0.01;
    const x = PADDING + ((lng - bounds.minLng) / lngRange) * (width - PADDING * 2);
    const y = PADDING + (1 - (lat - bounds.minLat) / latRange) * (height - PADDING * 2);
    return { x, y };
}

export const PropertyMap: React.FC<PropertyMapProps> = ({ target, nearby, settings, width, height }) => {
    const [hoveredKey, setHoveredKey] = React.useState<string | null>(null);

    const hasCoords = typeof target.Latitude === "number" && typeof target.Longitude === "number";
    const validNearby = nearby.filter(p => typeof p.Latitude === "number" && typeof p.Longitude === "number");

    if (!hasCoords) {
        return (
            <div style={{ padding: 16, color: settings.labelColor, fontSize: 12 }}>
                No coordinates available for this property.
            </div>
        );
    }

    const targetLat = target.Latitude as number;
    const targetLng = target.Longitude as number;

    const lats = [targetLat, ...validNearby.map(p => p.Latitude as number)];
    const lngs = [targetLng, ...validNearby.map(p => p.Longitude as number)];
    const bounds: Bounds = {
        minLat: Math.min(...lats),
        maxLat: Math.max(...lats),
        minLng: Math.min(...lngs),
        maxLng: Math.max(...lngs),
    };

    const targetPoint = { ...project(targetLat, targetLng, bounds, width, height), record: target };
    const nearbyPoints = validNearby.map(p => ({
        ...project(p.Latitude as number, p.Longitude as number, bounds, width, height),
        record: p,
    }));

    return (
        <div style={{ position: "relative", width, height, background: settings.backgroundColor, borderRadius: 6, overflow: "hidden" }}>
            <svg width={width} height={height}>
                {nearbyPoints.map((pt, i) => (
                    <line
                        key={`line-${i}`}
                        x1={targetPoint.x}
                        y1={targetPoint.y}
                        x2={pt.x}
                        y2={pt.y}
                        stroke={settings.lineColor}
                        strokeWidth={1}
                        strokeDasharray="4 3"
                        opacity={0.6}
                    />
                ))}

                {nearbyPoints.map((pt, i) => (
                    <g
                        key={`nearby-${i}`}
                        onMouseEnter={() => setHoveredKey(pt.record.PropertyBizKey)}
                        onMouseLeave={() => setHoveredKey(null)}
                        style={{ cursor: "pointer" }}
                    >
                        <circle cx={pt.x} cy={pt.y} r={settings.markerSize} fill={settings.nearbyColor} stroke="#ffffff" strokeWidth={1.5} />
                        {hoveredKey === pt.record.PropertyBizKey && (
                            <text x={pt.x + 8} y={pt.y - 8} fontSize={11} fill={settings.labelColor}>
                                {pt.record.PropertyName} ({pt.record.distance_miles ?? "?"} mi)
                            </text>
                        )}
                    </g>
                ))}

                <g
                    onMouseEnter={() => setHoveredKey(targetPoint.record.PropertyBizKey)}
                    onMouseLeave={() => setHoveredKey(null)}
                    style={{ cursor: "pointer" }}
                >
                    <circle
                        cx={targetPoint.x}
                        cy={targetPoint.y}
                        r={settings.markerSize + 3}
                        fill={settings.targetColor}
                        stroke="#ffffff"
                        strokeWidth={2}
                    />
                    {hoveredKey === targetPoint.record.PropertyBizKey && (
                        <text x={targetPoint.x + 10} y={targetPoint.y - 10} fontSize={12} fontWeight={600} fill={settings.labelColor}>
                            {targetPoint.record.PropertyName}
                        </text>
                    )}
                </g>
            </svg>

            <div style={{ position: "absolute", bottom: 4, right: 8, fontSize: 10, color: settings.labelColor, opacity: 0.6 }}>
                Approximate relative positions
            </div>
        </div>
    );
};

export default PropertyMap;
