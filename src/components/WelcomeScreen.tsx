import * as React from "react";
import type { ChatInputSettings, SendButtonSettings } from "../settings";
import ChatInputBar from "./ChatInputBar";

const bgImageAsk = new URL("../../assets/bgimageask.png", import.meta.url).href;

export interface QuickAction {
    id: string;
    title: string;
    prefill: string;
}

export const QUICK_ACTIONS: QuickAction[] = [
    { id: "compare", title: "Compare Properties", prefill: "Compare " },
    { id: "occupancy", title: "Check Occupancy", prefill: "What is the occupancy of " },
    { id: "find-nearby", title: "Find Nearby Properties", prefill: "" },
    { id: "overview", title: "Property Overview", prefill: "Give me an overview of " },
];

const GREETINGS: string[] = [
    "Hi, How are you?",
    "Hi, What is your agenda today?",
    "Hi, Which property are we exploring?",
    "Hi, Ready to dive into properties comparison?",
    "Hi, What would you like to know today?",
    "Hi, How can I help you today?",
];

const GREETING_INTERVAL_MS = 3500;

export interface WelcomeScreenProps {
    username?: string | null;
    viewport: { width: number; height: number };
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

const STYLES = `
.ap-wl-root {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: #ffffff;
}
.ap-wl-image {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    user-select: none;
    background: #ffffff;
}
.ap-wl-image img {
    position: absolute;
    left: 0;
    bottom: -28px;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center bottom;
}
.ap-wl-center {
    position: relative;
    z-index: 1;
    flex: 1 1 auto;
    min-height: 0;
    padding: 24px 20px;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: minmax(0, 760px);
    grid-template-rows: minmax(0, 1fr) auto minmax(0, 1fr);
    justify-content: center;
    background: transparent;
}
.ap-wl-above {
    grid-row: 1;
    align-self: end;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding-bottom: 28px;
}
.ap-wl-greeting-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    overflow: hidden;
}
.ap-wl-greeting {
    margin: 0;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--ap-text, #0f172a);
    animation: ap-wl-fade 0.6s ease both;
}
@keyframes ap-wl-fade {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
    .ap-wl-greeting { animation: none; }
}
.ap-wl-input {
    grid-row: 2;
    align-self: center;
    width: 100%;
    padding: 6px;
    box-sizing: border-box;
    background: #ffffff;
    border: 1.5px solid rgba(15, 23, 42, 0.14);
    border-radius: 22px;
    box-shadow: 0 10px 40px rgba(15, 23, 42, 0.14), 0 2px 8px rgba(15, 23, 42, 0.06);
}
.ap-wl-input .ap-input-row,
.ap-wl-input .ap-input-row:hover,
.ap-wl-input .ap-input-row:focus-within {
    background: transparent !important;
    border-color: transparent !important;
    box-shadow: none !important;
    outline: none !important;
}
.ap-wl-input .ap-input,
.ap-wl-input .ap-input:hover,
.ap-wl-input .ap-input:focus,
.ap-wl-input .ap-input:focus-visible,
.ap-wl-input .ap-input:active {
    background: transparent !important;
    border-color: transparent !important;
    box-shadow: none !important;
    outline: none !important;
}
.ap-wl-input .ap-send,
.ap-wl-input .ap-send:hover,
.ap-wl-input .ap-send:active,
.ap-wl-input .ap-send:focus,
.ap-wl-input .ap-send:disabled {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
}
.ap-wl-input .ap-send:focus-visible {
    outline: 2px solid #000000 !important;
    outline-offset: 2px !important;
}
.ap-wl-actions {
    grid-row: 3;
    align-self: start;
    margin-top: 18px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
}
.ap-wl-action {
    display: inline-block;
    padding: 8px 14px;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: var(--ap-text-muted, #334155);
    font: inherit;
    font-size: 13.5px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease;
}
.ap-wl-action:hover:not(:disabled) {
    background: rgba(20, 184, 166, 0.14);
    color: var(--ap-text, #0f172a);
}
.ap-wl-action:focus-visible {
    outline: 2px solid #14b8a6;
    outline-offset: 2px;
}
.ap-wl-action:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
`;

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
    viewport, value, onChange, onSend, onQuickAction, disabled, placeholder,
    inputSettings, buttonSettings, inputRef, contextLabel, onClearContext, notice,
}) => {
    const short = viewport.height < 460;
    const shown = short ? QUICK_ACTIONS.slice(0, 3) : QUICK_ACTIONS;
    const fontSize = short ? 22 : 30;

    const [greetingIndex, setGreetingIndex] = React.useState(0);

    React.useEffect(() => {
        const timer = window.setInterval(() => {
            setGreetingIndex(prev => (prev + 1) % GREETINGS.length);
        }, GREETING_INTERVAL_MS);
        return () => window.clearInterval(timer);
    }, []);

    return (
        <div className="ap-wl-root">
            <style>{STYLES}</style>
            <div className="ap-wl-image">
                <img src={bgImageAsk} alt="" draggable={false} />
            </div>
            <div className="ap-wl-center">
                <div className="ap-wl-above">
                    <div className="ap-wl-greeting-wrap" style={{ height: fontSize * 1.4 }}>
                        <h1
                            key={greetingIndex}
                            className="ap-wl-greeting"
                            style={{ fontSize }}
                        >
                            {GREETINGS[greetingIndex]}
                        </h1>
                    </div>
                    {notice}
                </div>
                <div className="ap-wl-input">
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
                <div className="ap-wl-actions">
                    {shown.map(action => (
                        <button
                            key={action.id}
                            type="button"
                            className="ap-wl-action"
                            disabled={disabled}
                            onClick={() => onQuickAction(action)}
                        >
                            {action.title}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WelcomeScreen;