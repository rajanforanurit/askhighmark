import * as React from "react";
export interface ResponseToolbarProps {
    zoomTarget: "map" | "table" | null;
    summary: string;
    onZoomIn: () => void;
    onZoomOut: () => void;
}
export declare const ResponseToolbar: React.FC<ResponseToolbarProps>;
export default ResponseToolbar;
