import * as React from "react";
import type { FooterSettings } from "../settings";

export interface FooterProps {
    settings: FooterSettings;
}

export const Footer: React.FC<FooterProps> = ({ settings }) => (
    <div
        style={{
            textAlign: "center",
            fontSize: settings.fontSize,
            color: settings.textColor,
            background: settings.backgroundColor,
            padding: "4px 0",
            flexShrink: 0,
        }}
    >
        {settings.text}
    </div>
);

export default Footer;
