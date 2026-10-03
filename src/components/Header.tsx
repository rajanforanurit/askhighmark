import * as React from "react";
import type { HeaderSettings } from "../settings";

const logoSrc = new URL("../../assets/idle_welcome.png", import.meta.url).href;

export interface HeaderProps {
    settings: HeaderSettings;
}

export const Header: React.FC<HeaderProps> = ({ settings }) => (
    <header
        className="ap-header"
        style={{
            height: settings.height,
            padding: `0 ${settings.paddingH}px`,
            background: settings.backgroundColor,
            borderBottomColor: settings.borderColor,
            fontFamily: settings.fontFamily || undefined,
        }}
    >
        <div className="ap-brand">
            <img
                src={logoSrc}
                alt=""
                draggable={false}
                style={{
                    display: "block",
                    flexShrink: 0,
                    height: 36,
                    width: "auto",
                    maxWidth: 56,
                    objectFit: "contain",
                }}
            />
            <div className="ap-brand-text">
                <div className="ap-brand-title" style={{ fontSize: settings.titleFontSize, color: settings.titleColor }}>
                    Ask Highmark
                </div>
                <div className="ap-brand-sub" style={{ fontSize: settings.subtitleFontSize, color: settings.subtitleColor }}>
                    AI real estate intelligence
                </div>
            </div>
        </div>
    </header>
);

export default Header;
