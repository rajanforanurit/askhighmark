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
export declare const PropertyMap: React.FC<PropertyMapProps>;
export default PropertyMap;
