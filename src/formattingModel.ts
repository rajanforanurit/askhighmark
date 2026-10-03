import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

class AiConfigurationCard extends formattingSettings.SimpleCard {
    name = "aiConfiguration";
    displayName = "AI Configuration";

    backendUrl = new formattingSettings.TextInput({
        name: "backendUrl", displayName: "Backend URL",
        description: "Base URL of the AskProp Data backend.",
        placeholder: "https://your-backend-url.com", value: "",
    });
    secretKey = new formattingSettings.TextInput({
        name: "secretKey", displayName: "Secret Key",
        description: "Verified by the backend against its server-side SECRET_KEY.",
        placeholder: "Enter secret key", value: "",
    });
    savePath = new formattingSettings.TextInput({
        name: "savePath", displayName: "Save Response Path",
        description: "Backend path called only when the user clicks Save Response.",
        placeholder: "/save-chat", value: "/save-chat",
    });
    mapsApiKey = new formattingSettings.TextInput({
        name: "mapsApiKey", displayName: "Google Maps API Key",
        description: "Browser key restricted to your Power BI domains and the Maps JavaScript API.",
        placeholder: "Enter Google Maps API key", value: "",
    });

    slices = [this.backendUrl, this.secretKey, this.savePath, this.mapsApiKey];
}

class HeaderCard extends formattingSettings.SimpleCard {
    name = "header";
    displayName = "Header";

    backgroundColor = new formattingSettings.ColorPicker({ name: "backgroundColor", displayName: "Background Color", value: { value: "#ffffff" } });
    height = new formattingSettings.NumUpDown({ name: "height", displayName: "Height (px)", value: 52 });
    paddingH = new formattingSettings.NumUpDown({ name: "paddingH", displayName: "Horizontal Padding (px)", value: 16 });
    titleColor = new formattingSettings.ColorPicker({ name: "titleColor", displayName: "Title Color", value: { value: "#0b1220" } });
    subtitleColor = new formattingSettings.ColorPicker({ name: "subtitleColor", displayName: "Subtitle Color", value: { value: "#64748b" } });
    fontFamily = new formattingSettings.TextInput({ name: "fontFamily", displayName: "Font Family", placeholder: "Segoe UI", value: "" });
    titleFontSize = new formattingSettings.NumUpDown({ name: "titleFontSize", displayName: "Title Font Size (px)", value: 15 });
    subtitleFontSize = new formattingSettings.NumUpDown({ name: "subtitleFontSize", displayName: "Subtitle Font Size (px)", value: 11 });
    borderColor = new formattingSettings.ColorPicker({ name: "borderColor", displayName: "Bottom Border Color", value: { value: "#e5e7eb" } });

    slices = [
        this.backgroundColor, this.height, this.paddingH,
        this.titleColor, this.subtitleColor, this.fontFamily,
        this.titleFontSize, this.subtitleFontSize, this.borderColor,
    ];
}

class ChatInputCard extends formattingSettings.SimpleCard {
    name = "chatInput";
    displayName = "Chat Input";

    backgroundColor = new formattingSettings.ColorPicker({ name: "backgroundColor", displayName: "Background Color", value: { value: "#ffffff" } });
    borderColor = new formattingSettings.ColorPicker({ name: "borderColor", displayName: "Border Color", value: { value: "#d5dae3" } });
    borderRadius = new formattingSettings.NumUpDown({ name: "borderRadius", displayName: "Border Radius (px)", value: 12 });
    padding = new formattingSettings.NumUpDown({ name: "padding", displayName: "Padding (px)", value: 10 });

    slices = [this.backgroundColor, this.borderColor, this.borderRadius, this.padding];
}

class SendButtonCard extends formattingSettings.SimpleCard {
    name = "sendButton";
    displayName = "Send Button";

    backgroundColor = new formattingSettings.ColorPicker({ name: "backgroundColor", displayName: "Background Color", value: { value: "#2a5bd7" } });
    iconColor = new formattingSettings.ColorPicker({ name: "iconColor", displayName: "Icon Color", value: { value: "#ffffff" } });
    hoverBackground = new formattingSettings.ColorPicker({ name: "hoverBackground", displayName: "Hover Background", value: { value: "#1e47b0" } });
    borderRadius = new formattingSettings.NumUpDown({ name: "borderRadius", displayName: "Border Radius (px)", value: 10 });
    width = new formattingSettings.NumUpDown({ name: "width", displayName: "Width (px)", value: 36 });
    height = new formattingSettings.NumUpDown({ name: "height", displayName: "Height (px)", value: 36 });

    slices = [this.backgroundColor, this.iconColor, this.hoverBackground, this.borderRadius, this.width, this.height];
}

class MessageBubbleCard extends formattingSettings.SimpleCard {
    name = "messageBubble";
    displayName = "Chat Bubbles";

    userBg = new formattingSettings.ColorPicker({ name: "userBg", displayName: "User Bubble Background", value: { value: "#0b1220" } });
    userText = new formattingSettings.ColorPicker({ name: "userText", displayName: "User Bubble Text", value: { value: "#ffffff" } });
    aiBg = new formattingSettings.ColorPicker({ name: "aiBg", displayName: "AI Bubble Background", value: { value: "#f3f5f9" } });
    aiText = new formattingSettings.ColorPicker({ name: "aiText", displayName: "AI Bubble Text", value: { value: "#0b1220" } });
    fontFamily = new formattingSettings.TextInput({ name: "fontFamily", displayName: "Font Family", placeholder: "Segoe UI", value: "" });
    fontSize = new formattingSettings.NumUpDown({ name: "fontSize", displayName: "Font Size (px)", value: 13 });
    borderRadius = new formattingSettings.NumUpDown({ name: "borderRadius", displayName: "Border Radius (px)", value: 12 });

    slices = [this.userBg, this.userText, this.aiBg, this.aiText, this.fontFamily, this.fontSize, this.borderRadius];
}

class MapCard extends formattingSettings.SimpleCard {
    name = "map";
    displayName = "Property Map";

    backgroundColor = new formattingSettings.ColorPicker({ name: "backgroundColor", displayName: "Background Color", value: { value: "#eef1f6" } });
    targetColor = new formattingSettings.ColorPicker({ name: "targetColor", displayName: "Subject Property Color", value: { value: "#2a5bd7" } });
    nearbyColor = new formattingSettings.ColorPicker({ name: "nearbyColor", displayName: "Nearby Property Color", value: { value: "#0b1220" } });
    lineColor = new formattingSettings.ColorPicker({ name: "lineColor", displayName: "Connector Line Color", value: { value: "#8b97ab" } });
    labelColor = new formattingSettings.ColorPicker({ name: "labelColor", displayName: "Label Color", value: { value: "#0b1220" } });
    markerSize = new formattingSettings.NumUpDown({ name: "markerSize", displayName: "Marker Size (px)", value: 6 });

    slices = [this.backgroundColor, this.targetColor, this.nearbyColor, this.lineColor, this.labelColor, this.markerSize];
}

class ComparisonTableCard extends formattingSettings.SimpleCard {
    name = "comparisonTable";
    displayName = "Comparison Table";

    headerBg = new formattingSettings.ColorPicker({ name: "headerBg", displayName: "Header Background", value: { value: "#f3f5f9" } });
    headerColor = new formattingSettings.ColorPicker({ name: "headerColor", displayName: "Header Text Color", value: { value: "#475569" } });
    rowBg = new formattingSettings.ColorPicker({ name: "rowBg", displayName: "Row Background", value: { value: "#ffffff" } });
    altRowBg = new formattingSettings.ColorPicker({ name: "altRowBg", displayName: "Alternate Row Background", value: { value: "#fafbfd" } });
    borderColor = new formattingSettings.ColorPicker({ name: "borderColor", displayName: "Border Color", value: { value: "#e2e0da" } });
    textColor = new formattingSettings.ColorPicker({ name: "textColor", displayName: "Text Color", value: { value: "#0b1220" } });
    fontSize = new formattingSettings.NumUpDown({ name: "fontSize", displayName: "Font Size (px)", value: 12 });

    slices = [this.headerBg, this.headerColor, this.rowBg, this.altRowBg, this.borderColor, this.textColor, this.fontSize];
}

class FooterCard extends formattingSettings.SimpleCard {
    name = "footer";
    displayName = "Footer";

    text = new formattingSettings.TextInput({
        name: "text", displayName: "Footer Text",
        placeholder: "Powered by Anurit Innovation", value: "Powered by Anurit Innovation",
    });
    textColor = new formattingSettings.ColorPicker({ name: "textColor", displayName: "Text Color", value: { value: "#94a3b8" } });
    backgroundColor = new formattingSettings.ColorPicker({ name: "backgroundColor", displayName: "Background Color", value: { value: "#ffffff" } });
    fontSize = new formattingSettings.NumUpDown({ name: "fontSize", displayName: "Font Size (px)", value: 10 });

    slices = [this.text, this.textColor, this.backgroundColor, this.fontSize];
}

export class VisualFormattingSettingsModel extends formattingSettings.Model {
    aiConfiguration = new AiConfigurationCard();
    header = new HeaderCard();
    chatInput = new ChatInputCard();
    sendButton = new SendButtonCard();
    messageBubble = new MessageBubbleCard();
    map = new MapCard();
    comparisonTable = new ComparisonTableCard();
    footer = new FooterCard();

    cards = [
        this.aiConfiguration,
        this.header,
        this.chatInput,
        this.sendButton,
        this.messageBubble,
        this.map,
        this.comparisonTable,
        this.footer,
    ];
}
