export type MapsLoadState = "idle" | "loading" | "loaded" | "failed";
export type MapsFailure = "no-key" | "auth" | "load";
export declare class MapsError extends Error {
    readonly reason: MapsFailure;
    constructor(reason: MapsFailure);
}
export declare function getMapsState(): MapsLoadState;
export declare function resetMapsLoader(): void;
export declare function loadGoogleMaps(apiKey: string): Promise<typeof google.maps>;
