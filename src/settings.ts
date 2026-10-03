import powerbi from "powerbi-visuals-api";

export interface AiConfigurationSettings {
    backendUrl: string;
    secretKey: string;
    savePath: string;
    mapsApiKey: string;
}

export interface HeaderSettings {
    backgroundColor: string;
    height: number;
    paddingH: number;
    titleColor: string;
    subtitleColor: string;
    fontFamily: string;
    titleFontSize: number;
    subtitleFontSize: number;
    borderColor: string;
}

export interface ChatInputSettings {
    backgroundColor: string;
    borderColor: string;
    borderRadius: number;
    padding: number;
}

export interface SendButtonSettings {
    backgroundColor: string;
    iconColor: string;
    hoverBackground: string;
    borderRadius: number;
    width: number;
    height: number;
}

export interface MessageBubbleSettings {
    userBg: string;
    userText: string;
    aiBg: string;
    aiText: string;
    fontFamily: string;
    fontSize: number;
    borderRadius: number;
}

export interface MapSettings {
    backgroundColor: string;
    targetColor: string;
    nearbyColor: string;
    lineColor: string;
    labelColor: string;
    markerSize: number;
}

export interface ComparisonTableSettings {
    headerBg: string;
    headerColor: string;
    rowBg: string;
    altRowBg: string;
    borderColor: string;
    textColor: string;
    fontSize: number;
}

export interface FooterSettings {
    text: string;
    textColor: string;
    backgroundColor: string;
    fontSize: number;
}

export interface VisualFormattingSettingsModel {
    aiConfiguration: AiConfigurationSettings;
    header: HeaderSettings;
    chatInput: ChatInputSettings;
    sendButton: SendButtonSettings;
    messageBubble: MessageBubbleSettings;
    map: MapSettings;
    comparisonTable: ComparisonTableSettings;
    footer: FooterSettings;
}

const defaults: VisualFormattingSettingsModel = {
    aiConfiguration: {
        backendUrl: "",
        secretKey: "",
        savePath: "/save-chat",
        mapsApiKey: "",
    },
    header: {
        backgroundColor: "#ffffff",
        height: 52,
        paddingH: 16,
        titleColor: "#0b1220",
        subtitleColor: "#64748b",
        fontFamily: "",
        titleFontSize: 15,
        subtitleFontSize: 11,
        borderColor: "#e5e7eb",
    },
    chatInput: {
        backgroundColor: "#ffffff",
        borderColor: "#d5dae3",
        borderRadius: 12,
        padding: 10,
    },
    sendButton: {
        backgroundColor: "#2a5bd7",
        iconColor: "#ffffff",
        hoverBackground: "#1e47b0",
        borderRadius: 10,
        width: 36,
        height: 36,
    },
    messageBubble: {
        userBg: "#0b1220",
        userText: "#ffffff",
        aiBg: "#f3f5f9",
        aiText: "#0b1220",
        fontFamily: "",
        fontSize: 13,
        borderRadius: 12,
    },
    map: {
        backgroundColor: "#eef1f6",
        targetColor: "#2a5bd7",
        nearbyColor: "#0b1220",
        lineColor: "#8b97ab",
        labelColor: "#0b1220",
        markerSize: 6,
    },
    comparisonTable: {
        headerBg: "#f3f5f9",
        headerColor: "#475569",
        rowBg: "#ffffff",
        altRowBg: "#fafbfd",
        borderColor: "#e5e7eb",
        textColor: "#0b1220",
        fontSize: 12,
    },
    footer: {
        text: "Powered by Anurit Innovation",
        textColor: "#94a3b8",
        backgroundColor: "#ffffff",
        fontSize: 10,
    },
};

function str(v: unknown, fallback: string): string {
    return typeof v === "string" && v.trim() !== "" ? v.trim() : fallback;
}

function fontEnum(v: unknown, fallback: string): string {
    if (typeof v === "string") return v;
    if (v && typeof v === "object") {
        const ev = (v as { value?: unknown }).value;
        if (typeof ev === "string") return ev;
    }
    return fallback;
}

function num(v: unknown, fallback: number): number {
    const n = Number(v);
    return isFinite(n) ? n : fallback;
}

function color(v: unknown, fallback: string): string {
    if (typeof v === "string" && v.trim()) return v.trim();
    if (v && typeof v === "object") {
        const fill = v as { solid?: { color?: string } };
        if (fill.solid?.color) return fill.solid.color;
    }
    return fallback;
}

export class VisualSettings implements VisualFormattingSettingsModel {
    aiConfiguration: AiConfigurationSettings;
    header: HeaderSettings;
    chatInput: ChatInputSettings;
    sendButton: SendButtonSettings;
    messageBubble: MessageBubbleSettings;
    map: MapSettings;
    comparisonTable: ComparisonTableSettings;
    footer: FooterSettings;

    constructor(partial?: Partial<VisualFormattingSettingsModel>) {
        this.aiConfiguration = { ...defaults.aiConfiguration, ...(partial?.aiConfiguration ?? {}) };
        this.header = { ...defaults.header, ...(partial?.header ?? {}) };
        this.chatInput = { ...defaults.chatInput, ...(partial?.chatInput ?? {}) };
        this.sendButton = { ...defaults.sendButton, ...(partial?.sendButton ?? {}) };
        this.messageBubble = { ...defaults.messageBubble, ...(partial?.messageBubble ?? {}) };
        this.map = { ...defaults.map, ...(partial?.map ?? {}) };
        this.comparisonTable = { ...defaults.comparisonTable, ...(partial?.comparisonTable ?? {}) };
        this.footer = { ...defaults.footer, ...(partial?.footer ?? {}) };
    }

    static parse(dataView: powerbi.DataView | undefined): VisualSettings {
        const obj = dataView?.metadata?.objects ?? {};
        const ai = (obj.aiConfiguration as Record<string, unknown>) ?? {};
        const hd = (obj.header as Record<string, unknown>) ?? {};
        const ci = (obj.chatInput as Record<string, unknown>) ?? {};
        const sb = (obj.sendButton as Record<string, unknown>) ?? {};
        const mb = (obj.messageBubble as Record<string, unknown>) ?? {};
        const mp = (obj.map as Record<string, unknown>) ?? {};
        const ct = (obj.comparisonTable as Record<string, unknown>) ?? {};
        const ft = (obj.footer as Record<string, unknown>) ?? {};
        const d = defaults;

        return new VisualSettings({
            aiConfiguration: {
                backendUrl: str(ai.backendUrl, d.aiConfiguration.backendUrl),
                secretKey: str(ai.secretKey, d.aiConfiguration.secretKey),
                savePath: str(ai.savePath, d.aiConfiguration.savePath),
                mapsApiKey: str(ai.mapsApiKey, d.aiConfiguration.mapsApiKey),
            },
            header: {
                backgroundColor: color(hd.backgroundColor, d.header.backgroundColor),
                height: num(hd.height, d.header.height),
                paddingH: num(hd.paddingH, d.header.paddingH),
                titleColor: color(hd.titleColor, d.header.titleColor),
                subtitleColor: color(hd.subtitleColor, d.header.subtitleColor),
                fontFamily: fontEnum(hd.fontFamily, d.header.fontFamily),
                titleFontSize: num(hd.titleFontSize, d.header.titleFontSize),
                subtitleFontSize: num(hd.subtitleFontSize, d.header.subtitleFontSize),
                borderColor: color(hd.borderColor, d.header.borderColor),
            },
            chatInput: {
                backgroundColor: color(ci.backgroundColor, d.chatInput.backgroundColor),
                borderColor: color(ci.borderColor, d.chatInput.borderColor),
                borderRadius: num(ci.borderRadius, d.chatInput.borderRadius),
                padding: num(ci.padding, d.chatInput.padding),
            },
            sendButton: {
                backgroundColor: color(sb.backgroundColor, d.sendButton.backgroundColor),
                iconColor: color(sb.iconColor, d.sendButton.iconColor),
                hoverBackground: color(sb.hoverBackground, d.sendButton.hoverBackground),
                borderRadius: num(sb.borderRadius, d.sendButton.borderRadius),
                width: num(sb.width, d.sendButton.width),
                height: num(sb.height, d.sendButton.height),
            },
            messageBubble: {
                userBg: color(mb.userBg, d.messageBubble.userBg),
                userText: color(mb.userText, d.messageBubble.userText),
                aiBg: color(mb.aiBg, d.messageBubble.aiBg),
                aiText: color(mb.aiText, d.messageBubble.aiText),
                fontFamily: fontEnum(mb.fontFamily, d.messageBubble.fontFamily),
                fontSize: num(mb.fontSize, d.messageBubble.fontSize),
                borderRadius: num(mb.borderRadius, d.messageBubble.borderRadius),
            },
            map: {
                backgroundColor: color(mp.backgroundColor, d.map.backgroundColor),
                targetColor: color(mp.targetColor, d.map.targetColor),
                nearbyColor: color(mp.nearbyColor, d.map.nearbyColor),
                lineColor: color(mp.lineColor, d.map.lineColor),
                labelColor: color(mp.labelColor, d.map.labelColor),
                markerSize: num(mp.markerSize, d.map.markerSize),
            },
            comparisonTable: {
                headerBg: color(ct.headerBg, d.comparisonTable.headerBg),
                headerColor: color(ct.headerColor, d.comparisonTable.headerColor),
                rowBg: color(ct.rowBg, d.comparisonTable.rowBg),
                altRowBg: color(ct.altRowBg, d.comparisonTable.altRowBg),
                borderColor: color(ct.borderColor, d.comparisonTable.borderColor),
                textColor: color(ct.textColor, d.comparisonTable.textColor),
                fontSize: num(ct.fontSize, d.comparisonTable.fontSize),
            },
            footer: {
                text: str(ft.text, d.footer.text),
                textColor: color(ft.textColor, d.footer.textColor),
                backgroundColor: color(ft.backgroundColor, d.footer.backgroundColor),
                fontSize: num(ft.fontSize, d.footer.fontSize),
            },
        });
    }
}
