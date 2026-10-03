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
