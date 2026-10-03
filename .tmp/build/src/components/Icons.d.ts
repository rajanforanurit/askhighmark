import * as React from "react";
export type IconName = "map" | "compare" | "occupancy" | "nearby" | "rent" | "info" | "filter" | "plus" | "minus" | "send" | "reset" | "close" | "save" | "check" | "sort" | "chat" | "chevron" | "history";
export interface IconProps {
    name: IconName;
    size?: number;
}
export declare const Icon: React.FC<IconProps>;
export default Icon;
