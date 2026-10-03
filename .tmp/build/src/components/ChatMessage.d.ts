import * as React from "react";
import type { MessageBubbleSettings } from "../settings";
import type { ChatEntry } from "../types";
export interface ChatMessageProps {
    entry: ChatEntry;
    active: boolean;
    bubbleSettings: MessageBubbleSettings;
    onSelect: (id: string) => void;
}
export declare function describeEntry(entry: ChatEntry): string;
export declare const ChatMessage: React.FC<ChatMessageProps>;
export default ChatMessage;
