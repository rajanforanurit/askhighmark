import * as React from "react";
import type { MessageBubbleSettings } from "../settings";
import type { ChatEntry } from "../types";

export interface ChatMessageProps {
    entry: ChatEntry;
    active: boolean;
    bubbleSettings: MessageBubbleSettings;
    onSelect: (id: string) => void;
}

export function describeEntry(entry: ChatEntry): string {
    const r = entry.result;
    if (!r) return "";
    const n = r.rows.length;
    if (n === 0) return "Text answer";
    const noun = n === 1 ? "property" : "properties";
    if (r.kind === "mixed") return `Map and table, ${n} ${noun}`;
    if (r.kind === "comparison") return `Comparison, ${n} ${noun}`;
    return `Table, ${n} ${noun}`;
}

function preview(text: string): string {
    return text.length > 160 ? `${text.slice(0, 157)}…` : text;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ entry, active, bubbleSettings, onSelect }) => {
    const font = { fontFamily: bubbleSettings.fontFamily || undefined, fontSize: bubbleSettings.fontSize };

    if (entry.role === "user") {
        return (
            <div className="ap-msg ap-msg--user">
                <div
                    className="ap-bubble"
                    style={{
                        ...font,
                        background: bubbleSettings.userBg,
                        color: bubbleSettings.userText,
                        borderRadius: bubbleSettings.borderRadius,
                        borderBottomRightRadius: 4,
                    }}
                >
                    {entry.text}
                </div>
            </div>
        );
    }

    const selectable = Boolean(entry.result) || Boolean(entry.isError);
    const className = `ap-msg-ai${active ? " ap-msg-ai--active" : ""}${entry.isError ? " ap-msg-ai--error" : ""}`;
    const inner = (
        <>
            <div className="ap-msg-meta" style={{ marginTop: 0, marginBottom: 2, fontWeight: 600 }}>Ask Highmark</div>
            <div className="ap-msg-text" style={{ ...font, color: entry.isError ? "#7a1f16" : bubbleSettings.aiText }}>
                {preview(entry.text)}
            </div>
            {entry.result && (
                <div className="ap-msg-meta">
                    <span>{describeEntry(entry)}</span>
                    {entry.saveState === "saved" && <span>Saved to History</span>}
                </div>
            )}
        </>
    );

    if (!selectable) {
        return <div className={className} style={{ borderRadius: bubbleSettings.borderRadius }}>{inner}</div>;
    }
    return (
        <button
            type="button"
            className={className}
            style={{ borderRadius: bubbleSettings.borderRadius }}
            onClick={() => onSelect(entry.id)}
            aria-pressed={active}
            aria-label="Show this result"
        >
            {inner}
        </button>
    );
};

export default ChatMessage;
