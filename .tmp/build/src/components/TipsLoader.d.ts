import * as React from "react";
export interface TipsLoaderProps {
    label: string;
    compact?: boolean;
}
export declare const REAL_ESTATE_TIPS: string[];
export declare const TIP_INTERVAL_MS = 4500;
export declare const TipsLoader: React.FC<TipsLoaderProps>;
export default TipsLoader;
