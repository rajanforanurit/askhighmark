import * as React from "react";
import type { ConnectionStatus } from "../api";
export interface ConnectionPanelProps {
    backendSet: boolean;
    secretSet: boolean;
    mapsSet: boolean;
    onTest: () => Promise<ConnectionStatus>;
    onClose: () => void;
    top: number;
}
export declare const ConnectionPanel: React.FC<ConnectionPanelProps>;
export default ConnectionPanel;
