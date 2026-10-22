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
    if (r.kind === "mixed") return `${r.showProperties ? "Map, financials and comparison" : "Map and financials"}, ${n} ${noun}`;
    if (r.kind === "comparison") return `Comparison, ${n} ${noun}`;
    return `Table, ${n} ${noun}`;
}

// Messages sent by the backend about a result (location note, warnings, unmatched names, notes).
// They are shown in the chat's follow-up section, not above the map.
export function backendMessages(entry: ChatEntry | null | undefined): string[] {
    const r = entry?.result;
    if (!r) return [];
    const out: string[] = [];
    const add = (m?: string | null) => {
        const text = (m ?? "").trim();
        if (text && text !== entry?.text.trim() && !out.includes(text)) out.push(text);
    };
    if (r.unresolved.length > 0) add(`Couldn't match: ${r.unresolved.join(", ")}`);
    if (r.rows.length > 0) {
        add(r.location?.message);
        (r.warnings ?? []).forEach(w => add(w.message));
    }
    if (r.area && r.rows.length === 0) add(r.answer);
    (r.notes ?? []).filter(n => /unit|chart/i.test(n)).slice(0, 3).forEach(n => add(n));
    return out;
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
