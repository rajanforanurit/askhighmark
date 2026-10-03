import * as React from "react";
import type { VisualSettings } from "./settings";
import type { DownloadServiceLike } from "./utils/export";
export interface AppProps {
    settings: VisualSettings;
    username: string | null;
    viewport: {
        width: number;
        height: number;
    };
    downloadService?: DownloadServiceLike;
}
declare const App: React.FC<AppProps>;
export default App;
