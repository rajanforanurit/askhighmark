import * as React from "react";
import type { ChatInputSettings, SendButtonSettings } from "../settings";
import type { AreaSuggestion } from "../services/googleMaps";
export interface AreaSuggestState {
    items: AreaSuggestion[];
    active: number;
    onActive: (index: number) => void;
    onPick: (suggestion: AreaSuggestion) => void;
    onDismiss: () => void;
}
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
export declare const ChatInputBar: React.FC<ChatInputBarProps>;
export default ChatInputBar;
