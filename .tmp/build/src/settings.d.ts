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
export interface ChartSettings {
    backgroundColor: string;
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    gridColor: string;
    fontSize: number;
    showValues: boolean;
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
    chart: ChartSettings;
    footer: FooterSettings;
}
export declare class VisualSettings implements VisualFormattingSettingsModel {
    aiConfiguration: AiConfigurationSettings;
    header: HeaderSettings;
    chatInput: ChatInputSettings;
    sendButton: SendButtonSettings;
    messageBubble: MessageBubbleSettings;
    map: MapSettings;
    comparisonTable: ComparisonTableSettings;
    chart: ChartSettings;
    footer: FooterSettings;
    constructor(partial?: Partial<VisualFormattingSettingsModel>);
    static parse(dataView: powerbi.DataView | undefined): VisualSettings;
}
