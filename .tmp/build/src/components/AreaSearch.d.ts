import * as React from "react";
import { type ResolvedArea } from "../services/googleMaps";
export interface AreaSearchProps {
    apiKey: string;
    busy: boolean;
    onSearch: (area: ResolvedArea) => void;
}
export declare const AreaSearch: React.FC<AreaSearchProps>;
export default AreaSearch;
