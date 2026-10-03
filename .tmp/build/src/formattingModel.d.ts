import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
declare class AiConfigurationCard extends formattingSettings.SimpleCard {
    name: string;
    displayName: string;
    backendUrl: formattingSettings.TextInput;
    secretKey: formattingSettings.TextInput;
    savePath: formattingSettings.TextInput;
    mapsApiKey: formattingSettings.TextInput;
    slices: formattingSettings.TextInput[];
}
declare class HeaderCard extends formattingSettings.SimpleCard {
    name: string;
    displayName: string;
    backgroundColor: formattingSettings.ColorPicker;
    height: formattingSettings.NumUpDown;
    paddingH: formattingSettings.NumUpDown;
    titleColor: formattingSettings.ColorPicker;
    subtitleColor: formattingSettings.ColorPicker;
    fontFamily: formattingSettings.TextInput;
    titleFontSize: formattingSettings.NumUpDown;
    subtitleFontSize: formattingSettings.NumUpDown;
    borderColor: formattingSettings.ColorPicker;
    slices: (formattingSettings.TextInput | formattingSettings.ColorPicker | formattingSettings.NumUpDown)[];
}
declare class ChatInputCard extends formattingSettings.SimpleCard {
    name: string;
    displayName: string;
    backgroundColor: formattingSettings.ColorPicker;
    borderColor: formattingSettings.ColorPicker;
    borderRadius: formattingSettings.NumUpDown;
    padding: formattingSettings.NumUpDown;
    slices: (formattingSettings.ColorPicker | formattingSettings.NumUpDown)[];
}
declare class SendButtonCard extends formattingSettings.SimpleCard {
    name: string;
    displayName: string;
    backgroundColor: formattingSettings.ColorPicker;
    iconColor: formattingSettings.ColorPicker;
    hoverBackground: formattingSettings.ColorPicker;
    borderRadius: formattingSettings.NumUpDown;
    width: formattingSettings.NumUpDown;
    height: formattingSettings.NumUpDown;
    slices: (formattingSettings.ColorPicker | formattingSettings.NumUpDown)[];
}
declare class MessageBubbleCard extends formattingSettings.SimpleCard {
    name: string;
    displayName: string;
    userBg: formattingSettings.ColorPicker;
    userText: formattingSettings.ColorPicker;
    aiBg: formattingSettings.ColorPicker;
    aiText: formattingSettings.ColorPicker;
    fontFamily: formattingSettings.TextInput;
    fontSize: formattingSettings.NumUpDown;
    borderRadius: formattingSettings.NumUpDown;
    slices: (formattingSettings.TextInput | formattingSettings.ColorPicker | formattingSettings.NumUpDown)[];
}
declare class MapCard extends formattingSettings.SimpleCard {
    name: string;
    displayName: string;
    backgroundColor: formattingSettings.ColorPicker;
    targetColor: formattingSettings.ColorPicker;
    nearbyColor: formattingSettings.ColorPicker;
    lineColor: formattingSettings.ColorPicker;
    labelColor: formattingSettings.ColorPicker;
    markerSize: formattingSettings.NumUpDown;
    slices: (formattingSettings.ColorPicker | formattingSettings.NumUpDown)[];
}
declare class ComparisonTableCard extends formattingSettings.SimpleCard {
    name: string;
    displayName: string;
    headerBg: formattingSettings.ColorPicker;
    headerColor: formattingSettings.ColorPicker;
    rowBg: formattingSettings.ColorPicker;
    altRowBg: formattingSettings.ColorPicker;
    borderColor: formattingSettings.ColorPicker;
    textColor: formattingSettings.ColorPicker;
    fontSize: formattingSettings.NumUpDown;
    slices: (formattingSettings.ColorPicker | formattingSettings.NumUpDown)[];
}
declare class FooterCard extends formattingSettings.SimpleCard {
    name: string;
    displayName: string;
    text: formattingSettings.TextInput;
    textColor: formattingSettings.ColorPicker;
    backgroundColor: formattingSettings.ColorPicker;
    fontSize: formattingSettings.NumUpDown;
    slices: (formattingSettings.TextInput | formattingSettings.ColorPicker | formattingSettings.NumUpDown)[];
}
export declare class VisualFormattingSettingsModel extends formattingSettings.Model {
    aiConfiguration: AiConfigurationCard;
    header: HeaderCard;
    chatInput: ChatInputCard;
    sendButton: SendButtonCard;
    messageBubble: MessageBubbleCard;
    map: MapCard;
    comparisonTable: ComparisonTableCard;
    footer: FooterCard;
    cards: (AiConfigurationCard | HeaderCard | ChatInputCard | SendButtonCard | MessageBubbleCard | MapCard | ComparisonTableCard | FooterCard)[];
}
export {};
