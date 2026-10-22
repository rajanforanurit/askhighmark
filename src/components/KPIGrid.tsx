import * as React from "react";
import type { Metric } from "../types";

export interface KPIGridProps {
    metrics: Metric[];
}

export const KPIGrid: React.FC<KPIGridProps> = ({ metrics }) => {
    if (metrics.length === 0) return null;
    return (
        <div className="ap-kpis">
            {metrics.map(m => (
                <div key={m.id} className="ap-kpi">
                    <div className="ap-kpi-val">{m.value}</div>
                    <div className="ap-kpi-label">{m.label}</div>
                </div>
            ))}
        </div>
    );
};

export default KPIGrid;
