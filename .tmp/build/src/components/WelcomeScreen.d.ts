import * as React from "react";
import type { ChatInputSettings, SendButtonSettings } from "../settings";
export interface QuickAction {
    id: string;
    title: string;
    prefill: string;
}
export declare const QUICK_ACTIONS: QuickAction[];
export interface WelcomeScreenProps {
    username?: string | null;
    viewport: {
        width: number;
        height: number;
    };
    value: string;
    onChange: (v: string) => void;
    onSend: () => void;
    onQuickAction: (action: QuickAction) => void;
    disabled: boolean;
    placeholder: string;
    inputSettings: ChatInputSettings;
    buttonSettings: SendButtonSettings;
    inputRef: React.RefObject<HTMLInputElement>;
    contextLabel: string | null;
    onClearContext: () => void;
    notice?: React.ReactNode;
}
export declare const WelcomeScreen: React.FC<WelcomeScreenProps>;
export default WelcomeScreen;
