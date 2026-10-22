export type MapsLoadState = "idle" | "loading" | "loaded" | "failed";

export type MapsFailure = "no-key" | "auth" | "load";

export class MapsError extends Error {
    readonly reason: MapsFailure;

    constructor(reason: MapsFailure) {
        super(reason);
        this.name = "MapsError";
        this.reason = reason;
    }
}

interface MapsWindow extends Window {
    google?: typeof google;
    gm_authFailure?: () => void;
    __askpropMapsReady?: () => void;
}

const SCRIPT_ID = "askprop-google-maps";
const LOAD_TIMEOUT_MS = 20000;

let cachedKey = "";
let cachedPromise: Promise<typeof google.maps> | null = null;
let currentState: MapsLoadState = "idle";
let authFailed = false;

export function getMapsState(): MapsLoadState {
    return currentState;
}

export function resetMapsLoader(): void {
    cachedPromise = null;
    cachedKey = "";
    currentState = "idle";
    authFailed = false;
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) existing.remove();
}

export function loadGoogleMaps(apiKey: string): Promise<typeof google.maps> {
    const key = apiKey.trim();
    if (!key) return Promise.reject(new MapsError("no-key"));

    const w = window as MapsWindow;
    if (cachedPromise && cachedKey === key) return cachedPromise;
    if (cachedKey && cachedKey !== key) resetMapsLoader();

    cachedKey = key;
    currentState = "loading";
    authFailed = false;

    cachedPromise = new Promise<typeof google.maps>((resolve, reject) => {
        const fail = (reason: MapsFailure) => {
            currentState = "failed";
            cachedPromise = null;
            cachedKey = "";
            const script = document.getElementById(SCRIPT_ID);
            if (script) script.remove();
            reject(new MapsError(reason));
        };

        w.gm_authFailure = () => {
            authFailed = true;
            fail("auth");
        };

        const finish = async () => {
            try {
                if (!w.google?.maps) {
                    fail("load");
                    return;
                }
                await w.google.maps.importLibrary("maps");
                await w.google.maps.importLibrary("marker");
                if (authFailed) return;
                currentState = "loaded";
                resolve(w.google.maps);
            } catch {
                fail("load");
            }
        };

        if (w.google?.maps && typeof w.google.maps.importLibrary === "function") {
            void finish();
            return;
        }

        const timer = window.setTimeout(() => fail("load"), LOAD_TIMEOUT_MS);
        w.__askpropMapsReady = () => {
            window.clearTimeout(timer);
            void finish();
        };

        const script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.async = true;
        script.defer = true;
        script.onerror = () => {
            window.clearTimeout(timer);
            fail("load");
        };
        const params = new URLSearchParams({
            key,
            v: "weekly",
            loading: "async",
            callback: "__askpropMapsReady",
        });
        script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
        document.head.appendChild(script);
    });

    return cachedPromise;
}

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

export class AreaSearchError extends Error {
    readonly reason: "unavailable" | "not-found";

    constructor(reason: "unavailable" | "not-found") {
        super(reason);
        this.name = "AreaSearchError";
        this.reason = reason;
    }
}

const AREA_TYPES = ["locality", "sublocality", "neighborhood", "postal_code", "administrative_area_level_2"];
const SUGGESTION_LIMIT = 6;
const SUGGESTION_CACHE_MAX = 60;

let sessionToken: google.maps.places.AutocompleteSessionToken | null = null;
const suggestionCache = new Map<string, AreaSuggestion[]>();

async function placesLibrary(apiKey: string): Promise<google.maps.PlacesLibrary> {
    await loadGoogleMaps(apiKey);
    return (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary;
}

export async function suggestAreas(apiKey: string, input: string): Promise<AreaSuggestion[]> {
    const query = input.trim();
    if (query.length < 2) return [];
    const cacheKey = `${apiKey}|${query.toLowerCase()}`;
    const cached = suggestionCache.get(cacheKey);
    if (cached) return cached;
    let lib: google.maps.PlacesLibrary;
    try {
        lib = await placesLibrary(apiKey);
    } catch {
        throw new AreaSearchError("unavailable");
    }
    if (!sessionToken) sessionToken = new lib.AutocompleteSessionToken();
    let response: { suggestions: google.maps.places.AutocompleteSuggestion[] };
    try {
        response = await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: query,
            sessionToken,
            includedPrimaryTypes: AREA_TYPES,
        });
    } catch {
        throw new AreaSearchError("unavailable");
    }
    const list: AreaSuggestion[] = [];
    response.suggestions.forEach((s, i) => {
        const p = s.placePrediction;
        if (!p || list.length >= SUGGESTION_LIMIT) return;
        list.push({
            id: p.placeId || `s-${i}`,
            primary: p.mainText?.text ?? p.text.text,
            secondary: p.secondaryText?.text ?? "",
            text: p.text.text,
            prediction: p,
        });
    });
    suggestionCache.set(cacheKey, list);
    while (suggestionCache.size > SUGGESTION_CACHE_MAX) {
        const oldest = suggestionCache.keys().next().value;
        if (oldest === undefined) break;
        suggestionCache.delete(oldest);
    }
    return list;
}

export async function resolveSuggestion(suggestion: AreaSuggestion): Promise<ResolvedArea> {
    const place = suggestion.prediction.toPlace();
    try {
        await place.fetchFields({ fields: ["location", "viewport", "displayName"] });
    } catch {
        throw new AreaSearchError("unavailable");
    }
    sessionToken = null;
    const location = place.location;
    if (!location) throw new AreaSearchError("not-found");
    return {
        name: suggestion.text,
        lat: location.lat(),
        lng: location.lng(),
        bounds: place.viewport ? place.viewport.toJSON() : null,
    };
}

export async function geocodeArea(apiKey: string, text: string): Promise<ResolvedArea> {
    const address = text.trim();
    if (!address) throw new AreaSearchError("not-found");
    try {
        await loadGoogleMaps(apiKey);
    } catch {
        throw new AreaSearchError("unavailable");
    }
    let results: google.maps.GeocoderResult[];
    try {
        const lib = (await google.maps.importLibrary("geocoding")) as google.maps.GeocodingLibrary;
        const response = await new lib.Geocoder().geocode({ address });
        results = response.results;
    } catch (err) {
        const status = (err as { code?: string } | undefined)?.code;
        throw new AreaSearchError(status === "ZERO_RESULTS" ? "not-found" : "unavailable");
    }
    const hit = results[0];
    if (!hit) throw new AreaSearchError("not-found");
    const viewport = hit.geometry.viewport ?? hit.geometry.bounds ?? null;
    sessionToken = null;
    return {
        name: hit.formatted_address || address,
        lat: hit.geometry.location.lat(),
        lng: hit.geometry.location.lng(),
        bounds: viewport ? viewport.toJSON() : null,
    };
}
