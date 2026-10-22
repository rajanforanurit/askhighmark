import * as React from "react";
import type { AreaInfo, MapProperty } from "../types";
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
export declare const MapView: React.ForwardRefExoticComponent<MapViewProps & React.RefAttributes<MapHandle>>;
declare const _default: React.MemoExoticComponent<React.ForwardRefExoticComponent<MapViewProps & React.RefAttributes<MapHandle>>>;
export default _default;
