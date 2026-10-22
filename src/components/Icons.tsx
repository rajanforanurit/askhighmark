import * as React from "react";

export type IconName =
    | "map" | "compare" | "occupancy" | "nearby" | "rent" | "info" | "filter" | "plus" | "minus"
    | "send" | "reset" | "close" | "save" | "check" | "sort" | "chat" | "chevron" | "history" | "expand" | "search" | "bulb";

const PATHS: Record<IconName, string> = {
    map: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14",
    compare: "M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3M12 2v20",
    occupancy: "M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6",
    nearby: "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    rent: "M12 3v18M16 7.5C16 6 14.2 5 12 5S8 6 8 8s1.8 2.5 4 3 4 1 4 3-1.8 3-4 3-4-1-4-2.5",
    info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-5M12 8h.01",
    filter: "M3 5h18l-7 8v6l-4 2v-8L3 5z",
    plus: "M12 5v14M5 12h14",
    minus: "M5 12h14",
    send: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z",
    reset: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5",
    close: "M6 6l12 12M18 6 6 18",
    save: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8",
    check: "M20 6 9 17l-5-5",
    sort: "M8 9l4-4 4 4M16 15l-4 4-4-4",
    chat: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
    chevron: "M6 15l6-6 6 6",
    history: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2",
    expand: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7",
    search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
    bulb: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z",
};

export interface IconProps {
    name: IconName;
    size?: number;
}

export const Icon: React.FC<IconProps> = ({ name, size = 16 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
    >
        <path d={PATHS[name]} />
    </svg>
);

export default Icon;
