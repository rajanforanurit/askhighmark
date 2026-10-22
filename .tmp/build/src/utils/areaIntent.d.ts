export interface AreaQuery {
    kind: "explicit" | "bare";
    text: string;
}
export declare function areaQueryText(input: string): AreaQuery | null;
export declare function matchesBare(primary: string, typed: string): boolean;
