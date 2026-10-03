import * as React from "react";
import type { ChatInputSettings, MessageBubbleSettings, SendButtonSettings } from "../settings";
import type { ChatEntry } from "../types";
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
export declare const ChatPanel: React.FC<ChatPanelProps>;
export default ChatPanel;
