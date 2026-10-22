export type MapsLoadState = "idle" | "loading" | "loaded" | "failed";
export type MapsFailure = "no-key" | "auth" | "load";
export declare class MapsError extends Error {
    readonly reason: MapsFailure;
    constructor(reason: MapsFailure);
}
export declare function getMapsState(): MapsLoadState;
export declare function resetMapsLoader(): void;
export declare function loadGoogleMaps(apiKey: string): Promise<typeof google.maps>;
export interface AreaBoundsLiteral {
    north: number;
    south: number;
    east: number;
    west: number;
}
export interface ResolvedArea {
    name: string;
    lat: number;
    lng: number;
    bounds: AreaBoundsLiteral | null;
}
export interface AreaSuggestion {
    id: string;
    primary: string;
    secondary: string;
    text: string;
    prediction: google.maps.places.PlacePrediction;
}
export declare class AreaSearchError extends Error {
    readonly reason: "unavailable" | "not-found";
    constructor(reason: "unavailable" | "not-found");
}
export declare function suggestAreas(apiKey: string, input: string): Promise<AreaSuggestion[]>;
export declare function resolveSuggestion(suggestion: AreaSuggestion): Promise<ResolvedArea>;
export declare function geocodeArea(apiKey: string, text: string): Promise<ResolvedArea>;
