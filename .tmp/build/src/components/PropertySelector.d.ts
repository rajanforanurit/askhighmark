import * as React from "react";
import type { SelectionState } from "../types";
export interface PropertySelectorProps {
    selection: SelectionState;
    subjectName: string | null;
    onChange: (keys: string[]) => void;
}
export declare const PropertySelector: React.FC<PropertySelectorProps>;
export default PropertySelector;
