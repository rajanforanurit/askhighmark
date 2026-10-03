import * as React from "react";
import type { ChatInputSettings, MessageBubbleSettings, SendButtonSettings } from "../settings";
import type { ChatEntry } from "../types";
import ChatInputBar from "./ChatInputBar";
import ChatMessage, { describeEntry } from "./ChatMessage";
import ThinkingIndicator from "./ThinkingIndicator";
import type { PanelView } from "./TopActions";

export interface ChatPanelProps {
    entries: ChatEntry[];
    activeId: string | null;
    view: PanelView;
    thinkingLabel: string | null;
    value: string;
    placeholder: string;
    disabled: boolean;
    bubbleSettings: MessageBubbleSettings;
    inputSettings: ChatInputSettings;
    buttonSettings: SendButtonSettings;
    inputRef: React.RefObject<HTMLInputElement>;
    contextLabel: string | null;
    suggestions: string[];
    onChange: (v: string) => void;
    onSend: () => void;
    onSelect: (id: string) => void;
    onSuggest: (text: string) => void;
    onClearContext: () => void;
}

interface SavedItem {
    entry: ChatEntry;
    question: string;
}

function preview(text: string, max: number): string {
    return text.length > max ? `${text.slice(0, max - 3)}…` : text;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
    entries, activeId, view, thinkingLabel, value, placeholder, disabled, bubbleSettings,
    inputSettings, buttonSettings, inputRef, contextLabel, suggestions, onChange, onSend, onSelect,
    onSuggest, onClearContext,
}) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, [entries.length, thinkingLabel, view]);

    const saved = React.useMemo<SavedItem[]>(() => {
        const items: SavedItem[] = [];
        entries.forEach((entry, i) => {
            if (entry.role === "user" || entry.saveState !== "saved") return;
            let question = "Saved response";
            for (let j = i - 1; j >= 0; j -= 1) {
                if (entries[j].role === "user") {
                    question = entries[j].text;
                    break;
                }
            }
            items.push({ entry, question });
        });
        return items.reverse();
    }, [entries]);

    return (
        <div className="ap-chat" style={{ width: "100%", height: "100%" }}>
            <div className="ap-chat-scroll" ref={scrollRef} aria-live="polite">
                {view === "chat" && (
                    <>
                        {entries.map(entry => (
                            <ChatMessage
                                key={entry.id}
                                entry={entry}
                                active={entry.id === activeId}
                                bubbleSettings={bubbleSettings}
                                onSelect={onSelect}
                            />
                        ))}
                        {thinkingLabel && <ThinkingIndicator label={thinkingLabel} size={44} />}
                        {!thinkingLabel && suggestions.length > 0 && (
                            <div>
                                <div className="ap-msg-meta" style={{ marginTop: 0, marginBottom: 6 }}>Follow-up questions</div>
                                <div className="ap-chips">
                                    {suggestions.map(s => (
                                        <button key={s} type="button" className="ap-chip" onClick={() => onSuggest(s)} disabled={disabled}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
                {view === "history" && (
                    <>
                        {saved.length === 0 && (
                            <div className="ap-msg-meta">Responses you save will appear here.</div>
                        )}
                        {saved.map(({ entry, question }) => (
                            <button
                                key={entry.id}
                                type="button"
                                className={`ap-msg-ai${entry.id === activeId ? " ap-msg-ai--active" : ""}`}
                                style={{ borderRadius: bubbleSettings.borderRadius }}
                                onClick={() => onSelect(entry.id)}
                                aria-pressed={entry.id === activeId}
                                aria-label="Show this saved response"
                            >
                                <div className="ap-msg-text" style={{ fontFamily: bubbleSettings.fontFamily || undefined, fontSize: bubbleSettings.fontSize, color: bubbleSettings.aiText }}>
                                    {preview(question, 90)}
                                </div>
                                <div className="ap-msg-meta">
                                    <span>{describeEntry(entry)}</span>
                                </div>
                            </button>
                        ))}
                    </>
                )}
            </div>
            <div className="ap-composer">
                <ChatInputBar
                    value={value}
                    onChange={onChange}
                    onSend={onSend}
                    placeholder={placeholder}
                    disabled={disabled}
                    inputSettings={inputSettings}
                    buttonSettings={buttonSettings}
                    inputRef={inputRef}
                    contextLabel={contextLabel}
                    onClearContext={onClearContext}
                />
            </div>
        </div>
    );
};

export default ChatPanel;
