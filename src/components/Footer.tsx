import * as React from "react";
import type { FooterSettings } from "../settings";

export interface FooterProps {
    settings: FooterSettings;
}

const BRAND = "Anurit Innovation";

function renderText(text: string): React.ReactNode {
    const at = text.toLowerCase().indexOf(BRAND.toLowerCase());
    if (at < 0) return text;
    const end = at + BRAND.length;
    return (
        <>
            {text.slice(0, at)}
            <strong style={{ fontWeight: 700, letterSpacing: "0.01em" }}>{text.slice(at, end)}</strong>
            {text.slice(end)}
        </>
    );
}

export const Footer: React.FC<FooterProps> = ({ settings }) => (
    <div
        style={{
            textAlign: "center",
            fontSize: Math.max(12, settings.fontSize + 2),
            lineHeight: 1.3,
            color: settings.textColor,
            background: settings.backgroundColor,
            padding: "5px 0",
            flexShrink: 0,
        }}
    >
        {renderText(settings.text)}
    </div>
);

export default Footer;
