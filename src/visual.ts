import powerbi from "powerbi-visuals-api";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { VisualSettings } from "./settings";
import { VisualFormattingSettingsModel } from "./formattingModel";
import App, { type AppProps } from "./App";
import type { DownloadServiceLike } from "./utils/export";

export class Visual implements powerbi.extensibility.visual.IVisual {
    private readonly target: HTMLElement;
    private readonly host: powerbi.extensibility.visual.IVisualHost;
    private readonly formattingSettingsService: FormattingSettingsService;
    private formattingSettings!: VisualFormattingSettingsModel;
    private settings: VisualSettings = new VisualSettings();

    constructor(options: powerbi.extensibility.visual.VisualConstructorOptions) {
        this.target = options.element;
        this.host = options.host;
        this.target.style.overflow = "hidden";
        this.target.style.height = "100%";
        this.formattingSettingsService = new FormattingSettingsService();
    }

    public update(options: powerbi.extensibility.visual.VisualUpdateOptions): void {
        const dataView = options.dataViews?.[0];
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
            VisualFormattingSettingsModel, dataView
        );
        this.settings = VisualSettings.parse(dataView);

        const categorical = dataView?.categorical;
        let username: string | null = null;
        if (categorical?.categories?.length) {
            const rawVal = categorical.categories[0]?.values?.[0];
            if (rawVal != null && String(rawVal).trim() !== "") {
                username = String(rawVal).trim();
            }
        }

        const downloadService = (this.host as unknown as { downloadService?: DownloadServiceLike }).downloadService;

        const props: AppProps = {
            settings: this.settings,
            username,
            viewport: {
                width: options.viewport.width,
                height: options.viewport.height,
            },
            downloadService,
        };

        ReactDOM.render(React.createElement(App, props), this.target);
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }

    public destroy(): void {
        ReactDOM.unmountComponentAtNode(this.target);
    }
}
