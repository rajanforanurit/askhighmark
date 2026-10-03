import * as React from "react";
import type { ChatInputSettings, SendButtonSettings } from "../settings";
import Icon from "./Icons";

export interface ChatInputBarProps {
    value: string;
    onChange: (v: string) => void;
    onSend: () => void;
    placeholder: string;
    disabled: boolean;
    inputSettings: ChatInputSettings;
    buttonSettings: SendButtonSettings;
    inputRef?: React.RefObject<HTMLInputElement>;
    contextLabel?: string | null;
    onClearContext?: () => void;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
    value, onChange, onSend, placeholder, disabled, inputSettings, buttonSettings, inputRef, contextLabel, onClearContext,
}) => {
    const [hover, setHover] = React.useState(false);
    const canSend = !disabled && value.trim().length > 0;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && canSend) {
            e.preventDefault();
            onSend();
        }
    };

    const arrowColor = !canSend ? "#cbd5e1" : hover ? "#14b8a6" : "#000000";

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {contextLabel && (
                <div className="ap-conn">
                    <span className="ap-chip" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Icon name="nearby" size={12} />
                        {contextLabel}
                        <button
                            type="button"
                            className="ap-tip"
                            data-tip="Cancel"
                            aria-label="Cancel this action"
                            onClick={onClearContext}
                            style={{ border: 0, background: "transparent", padding: 0, display: "grid", placeItems: "center" }}
                        >
                            <Icon name="close" size={12} />
                        </button>
                    </span>
                </div>
            )}
            <div
                className="ap-input-row"
                style={{
                    background: inputSettings.backgroundColor,
                    borderColor: inputSettings.borderColor,
                    borderRadius: inputSettings.borderRadius,
                    padding: `${Math.max(2, inputSettings.padding - 4)}px ${inputSettings.padding}px`,
                }}
            >
                <input
                    ref={inputRef}
                    className="ap-input"
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    aria-label="Ask Highmark"
                    autoComplete="off"
                    style={{ height: buttonSettings.height }}
                />
                <button
                    type="button"
                    className="ap-send ap-tip"
                    data-tip="Send question"
                    aria-label="Send question"
                    onClick={onSend}
                    disabled={!canSend}
                    onMouseEnter={() => setHover(true)}
                    onMouseLeave={() => setHover(false)}
                    style={{
                        width: buttonSettings.width,
                        height: buttonSettings.height,
                        padding: 0,
                        border: "none",
                        boxShadow: "none",
                        background: "transparent",
                        color: arrowColor,
                        display: "grid",
                        placeItems: "center",
                        cursor: canSend ? "pointer" : "not-allowed",
                    }}
                >
                    <svg
                        width={24}
                        height={24}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3.2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M4 12h16" />
                        <path d="M13 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ChatInputBar;