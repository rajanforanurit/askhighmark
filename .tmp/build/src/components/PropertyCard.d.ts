import * as React from "react";
import type { MapProperty } from "../types";
export interface PropertyCardProps {
    property: MapProperty;
    onClose: () => void;
}
export declare const PropertyCard: React.FC<PropertyCardProps>;
export default PropertyCard;
