import * as React from "react";
import Icon from "./Icons";

export interface ResponseToolbarProps {
    zoomTarget: "map" | "table" | null;
    summary: string;
    onZoomIn: () => void;
    onZoomOut: () => void;
}

export const ResponseToolbar: React.FC<ResponseToolbarProps> = ({ zoomTarget, summary, onZoomIn, onZoomOut }) => (
    <div className="ap-toolbar" role="toolbar" aria-label="Result tools">
        <div className="ap-toolbar-group" style={{ color: "var(--ap-muted)" }}>{summary}</div>
        <div className="ap-toolbar-group">
            {zoomTarget && (
                <>
                    <button type="button" className="ap-btn ap-icon-btn ap-tip" data-tip={zoomTarget === "map" ? "Zoom in map" : "Increase table text size"} aria-label="Zoom In" onClick={onZoomIn}>
                        <Icon name="plus" />
                    </button>
                    <button type="button" className="ap-btn ap-icon-btn ap-tip" data-tip={zoomTarget === "map" ? "Zoom out map" : "Decrease table text size"} aria-label="Zoom Out" onClick={onZoomOut}>
                        <Icon name="minus" />
                    </button>
                </>
            )}
        </div>
    </div>
);

export default ResponseToolbar;
