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

const STATUS_TEXT: Record<ConnectionStatus, string> = {
    "connected": "Connected",
    "auth-failed": "Authentication failed",
    "unavailable": "Backend unavailable",
    "incomplete": "AI configuration is incomplete",
};

export const ConnectionPanel: React.FC<ConnectionPanelProps> = ({ backendSet, secretSet, mapsSet, onTest, onClose, top }) => {
    const [status, setStatus] = React.useState<ConnectionStatus | null>(null);
    const [testing, setTesting] = React.useState(false);

    const run = async () => {
        setTesting(true);
        setStatus(await onTest());
        setTesting(false);
    };

    const row = (label: string, ok: boolean) => (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span>{label}</span>
            <strong style={{ color: ok ? "var(--ap-ok)" : "var(--ap-danger)" }}>{ok ? "Set" : "Not set"}</strong>
        </div>
    );

    return (
        <div
            className="ap-info"
            role="dialog"
            aria-label="Connection settings"
            style={{ top, right: 8, left: "auto", bottom: "auto", width: 260, zIndex: 25 }}
        >
            <div className="ap-info-title">Connection</div>
            <div className="ap-info-sub">Values are set in Format, AI Configuration.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                {row("Backend URL", backendSet)}
                {row("Secret Key", secretSet)}
                {row("Google Maps key", mapsSet)}
            </div>
            <div className="ap-conn" style={{ marginTop: 12 }}>
                <button type="button" className="ap-btn" onClick={() => void run()} disabled={testing}>
                    {testing ? "Testing…" : "Test Connection"}
                </button>
                <button type="button" className="ap-btn ap-btn--ghost" onClick={onClose}>Close</button>
            </div>
            {status && (
                <div role="status" style={{ marginTop: 8, fontWeight: 600, color: status === "connected" ? "var(--ap-ok)" : "var(--ap-danger)" }}>
                    {status === "connected" ? "✓ " : "✕ "}{STATUS_TEXT[status]}
                </div>
            )}
        </div>
    );
};

export default ConnectionPanel;
