import powerbi from "powerbi-visuals-api";
export declare class Visual implements powerbi.extensibility.visual.IVisual {
    private readonly target;
    private readonly host;
    private readonly formattingSettingsService;
    private formattingSettings;
    private settings;
    constructor(options: powerbi.extensibility.visual.VisualConstructorOptions);
    update(options: powerbi.extensibility.visual.VisualUpdateOptions): void;
    getFormattingModel(): powerbi.visuals.FormattingModel;
    destroy(): void;
}
