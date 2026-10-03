import * as React from "react";
import { MASCOT_SRC } from "../mascot";

export interface ThinkingIndicatorProps {
    label: string;
    size?: number;
}

const STYLES = `
.hm-track {
    position: relative;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    overflow: visible;
}
.hm-stage {
    position: relative;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    height: 100%;
}
.hm-runner {
    position: relative;
    z-index: 1;
    transform-origin: 50% 100%;
    animation: hm-hop 0.36s infinite;
}
.hm-tilt {
    transform-origin: 50% 100%;
    animation: hm-tilt 0.72s ease-in-out infinite;
}
.hm-img {
    display: block;
    width: auto;
    user-select: none;
    pointer-events: none;
}
.hm-ground {
    position: absolute;
    left: 6%;
    right: 6%;
    bottom: 0;
    height: 2px;
    border-radius: 2px;
    background: repeating-linear-gradient(90deg, #cbd5e1 0, #cbd5e1 14px, transparent 14px, transparent 40px);
    animation: hm-ground 0.27s linear infinite;
}
.hm-shadow {
    position: absolute;
    left: 50%;
    bottom: -3px;
    width: 46%;
    height: 6px;
    margin-left: -23%;
    border-radius: 50%;
    background: rgba(15, 23, 42, 0.16);
    animation: hm-shadow 0.36s infinite;
}
.hm-speed {
    position: absolute;
    left: 4%;
    height: 2px;
    border-radius: 2px;
    background: #94a3b8;
    opacity: 0;
    animation: hm-speed 0.5s linear infinite;
}
@keyframes hm-hop {
    0% { transform: translateY(0) scale(1.05, 0.95); animation-timing-function: cubic-bezier(0.2, 0.7, 0.3, 1); }
    50% { transform: translateY(calc(var(--hm-h) * -1)) scale(0.97, 1.04); animation-timing-function: cubic-bezier(0.7, 0, 0.8, 0.3); }
    100% { transform: translateY(0) scale(1.05, 0.95); }
}
@keyframes hm-tilt {
    0%, 100% { transform: rotate(-5deg) translateX(calc(var(--hm-s) * -1)); }
    50% { transform: rotate(5deg) translateX(var(--hm-s)); }
}
@keyframes hm-shadow {
    0%, 100% { transform: scaleX(1.05); opacity: 1; }
    50% { transform: scaleX(0.75); opacity: 0.6; }
}
@keyframes hm-ground {
    from { background-position: 0 0; }
    to { background-position: -40px 0; }
}
@keyframes hm-speed {
    0% { transform: translateX(10px); opacity: 0; }
    40% { opacity: 0.7; }
    100% { transform: translateX(-12px); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
    .hm-runner, .hm-tilt, .hm-ground, .hm-shadow, .hm-speed { animation: none; }
}
`;

const HIDDEN: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
};

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ label, size = 56 }) => {
    const trackStyle = {
        height: size + 10,
        width: size * 1.9,
        margin: "0 auto",
        "--hm-h": `${Math.max(4, size * 0.12)}px`,
        "--hm-s": `${Math.max(1, size * 0.03)}px`,
    } as React.CSSProperties;

    return (
        <div className="ap-think" role="status" aria-live="polite">
            <style>{STYLES}</style>
            <div className="hm-track" style={trackStyle} aria-hidden="true">
                <div className="hm-stage">
                    <div className="hm-ground" />
                    <div className="hm-shadow" />
                    <div className="hm-speed" style={{ bottom: size * 0.55, width: size * 0.3 }} />
                    <div className="hm-speed" style={{ bottom: size * 0.3, width: size * 0.22, animationDelay: "-0.25s" }} />
                    <div className="hm-runner" style={{ marginBottom: 2 }}>
                        <div className="hm-tilt">
                            <img className="hm-img" src={MASCOT_SRC} alt="" draggable={false} style={{ height: size }} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="ap-think-text">
                <span style={HIDDEN}>Ask Highmark: </span>
                {label}
                <span className="ap-dots" aria-hidden="true" />
            </div>
        </div>
    );
};

export default ThinkingIndicator;
