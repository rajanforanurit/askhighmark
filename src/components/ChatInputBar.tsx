import * as React from "react";
import type { ChatInputSettings, SendButtonSettings } from "../settings";
import type { AreaSuggestion } from "../services/googleMaps";
import Icon from "./Icons";

export interface AreaSuggestState {
    items: AreaSuggestion[];
    active: number;
    onActive: (index: number) => void;
    onPick: (suggestion: AreaSuggestion) => void;
    onDismiss: () => void;
}

let listCounter = 0;

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
    areaSuggest?: AreaSuggestState;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
    value, onChange, onSend, placeholder, disabled, inputSettings, buttonSettings, inputRef, contextLabel, onClearContext, areaSuggest,
}) => {
    const [hover, setHover] = React.useState(false);
    const canSend = !disabled && value.trim().length > 0;

    const listId = React.useRef(`ap-suggest-${(listCounter += 1)}`).current;
    const items = areaSuggest?.items ?? [];
    const open = items.length > 0 && !disabled;
    const active = open && areaSuggest ? areaSuggest.active : -1;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (open && areaSuggest) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                areaSuggest.onActive((areaSuggest.active + 1) % items.length);
                return;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                areaSuggest.onActive((areaSuggest.active - 1 + items.length) % items.length);
                return;
            }
            if (e.key === "Escape") {
                e.preventDefault();
                areaSuggest.onDismiss();
                return;
            }
            if (e.key === "Enter" && areaSuggest.active >= 0 && items[areaSuggest.active]) {
                e.preventDefault();
                areaSuggest.onPick(items[areaSuggest.active]);
                return;
            }
        }
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
            <div style={{ position: "relative" }}>
            {open && areaSuggest && (
                <ul className="ap-suggest" id={listId} role="listbox" aria-label="Area suggestions">
                    {items.map((s, i) => (
                        <li
                            key={s.id}
                            id={`${listId}-${i}`}
                            role="option"
                            aria-selected={i === active}
                            className={`ap-suggest-opt${i === active ? " ap-suggest-opt--active" : ""}`}
                            onMouseDown={e => e.preventDefault()}
                            onMouseEnter={() => areaSuggest.onActive(i)}
                            onClick={() => areaSuggest.onPick(s)}
                        >
                            <Icon name="nearby" size={14} />
                            <span className="ap-suggest-main">{s.primary}</span>
                            {s.secondary && <span className="ap-suggest-sub">{s.secondary}</span>}
                        </li>
                    ))}
                </ul>
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
                    role={areaSuggest ? "combobox" : undefined}
                    aria-expanded={areaSuggest ? open : undefined}
                    aria-controls={areaSuggest && open ? listId : undefined}
                    aria-autocomplete={areaSuggest ? "list" : undefined}
                    aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
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
        </div>
    );
};

export default ChatInputBar;