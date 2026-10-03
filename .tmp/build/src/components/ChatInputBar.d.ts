import * as React from "react";
import type { ChatInputSettings, SendButtonSettings } from "../settings";
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
export declare const ChatInputBar: React.FC<ChatInputBarProps>;
export default ChatInputBar;
