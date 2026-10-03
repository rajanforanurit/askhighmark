export interface BackendConfig {
    backendUrl: string;
    secretKey: string;
    savePath: string;
}

export interface PropertyRecord {
    PropertyBizKey: string;
    PropertyName: string;
    City?: string;
    State?: string;
    Market?: string;
    AssetType?: string;
    PropertySizeCategory?: string;
    PropertyAgeBucket?: string;
    YearBuilt?: number;
    PropertyStatus?: string;
    ManagementCompany?: string;
    Latitude?: number;
    Longitude?: number;
    distance_miles?: number;
    [key: string]: unknown;
}

export interface NearestResult {
    target: PropertyRecord;
    nearby: PropertyRecord[];
}

export interface ComparisonResult {
    fields: string[];
    properties: Record<string, unknown>[];
    not_found: string[];
}

export interface AskAIResult {
    intent: "search" | "nearest" | "compare" | "unknown";
    message?: string;
    results?: PropertyRecord[];
    target?: PropertyRecord;
    nearby?: PropertyRecord[];
    comparison?: ComparisonResult;
    unresolved?: string[];
    raw?: unknown;
}

export interface ActiveFilterPayload {
    [label: string]: string | string[] | [number, number];
}

export interface SavePayload {
    query: string;
    response: unknown;
    user_id?: string;
    session_id?: string;
    metadata?: Record<string, unknown>;
}

export type ApiErrorKind = "config" | "auth" | "timeout" | "network" | "server" | "invalid";

export class ApiError extends Error {
    readonly kind: ApiErrorKind;
    readonly status: number;

    constructor(kind: ApiErrorKind, status = 0) {
        super(kind);
        this.name = "ApiError";
        this.kind = kind;
        this.status = status;
    }
}

const REQUEST_TIMEOUT_MS = 45000;

export function isConfigured(cfg: BackendConfig): boolean {
    return cfg.backendUrl.trim() !== "" && cfg.secretKey.trim() !== "";
}

function baseUrl(cfg: BackendConfig): string {
    return cfg.backendUrl.trim().replace(/\/+$/, "");
}

function authHeaders(cfg: BackendConfig): Record<string, string> {
    return {
        "Content-Type": "application/json",
        "x-secret-key": cfg.secretKey,
    };
}

function safeJoin(base: string, path: string): string {
    const clean = path.trim();
    return `${base}${clean.startsWith("/") ? clean : `/${clean}`}`;
}

async function request<T>(cfg: BackendConfig, url: string, init: RequestInit): Promise<T> {
    if (!isConfigured(cfg)) {
        throw new ApiError("config");
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let res: Response;
    try {
        res = await fetch(url, { ...init, headers: authHeaders(cfg), signal: controller.signal });
    } catch (err) {
        clearTimeout(timer);
        if ((err as { name?: string }).name === "AbortError") {
            throw new ApiError("timeout");
        }
        throw new ApiError("network");
    }
    clearTimeout(timer);

    if (res.status === 401 || res.status === 403) {
        throw new ApiError("auth", res.status);
    }
    if (!res.ok) {
        throw new ApiError("server", res.status);
    }
    try {
        return (await res.json()) as T;
    } catch {
        throw new ApiError("invalid", res.status);
    }
}

export function describeError(err: unknown, action: "ask" | "save" = "ask"): string {
    const kind = err instanceof ApiError ? err.kind : "server";
    if (kind === "config") return "AI configuration is incomplete.";
    if (action === "save") return "Unable to save this response. Please check your AskProp configuration.";
    if (kind === "auth") return "The backend rejected the configured Secret Key. Check the AI Configuration settings.";
    if (kind === "timeout") return "The request took too long. Please try again.";
    if (kind === "network") return "The backend could not be reached. Check the Backend URL and your network.";
    return "Something went wrong while preparing this analysis.";
}

export async function searchProperties(
    cfg: BackendConfig,
    query: string,
    limit = 5,
): Promise<{ results: PropertyRecord[] }> {
    const url = `${baseUrl(cfg)}/properties/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    return request(cfg, url, { method: "GET" });
}

export async function compareWithNearest(
    cfg: BackendConfig,
    bizKey: string,
    count = 5,
): Promise<NearestResult & { comparison: ComparisonResult }> {
    const url = `${baseUrl(cfg)}/properties/${encodeURIComponent(bizKey)}/compare-with-nearest?count=${count}`;
    return request(cfg, url, { method: "GET" });
}

export async function askAI(
    cfg: BackendConfig,
    query: string,
    filters?: ActiveFilterPayload,
): Promise<AskAIResult> {
    const url = `${baseUrl(cfg)}/ask-ai`;
    const body: { query: string; filters?: ActiveFilterPayload } = { query };
    if (filters && Object.keys(filters).length > 0) {
        body.filters = filters;
    }
    return request(cfg, url, { method: "POST", body: JSON.stringify(body) });
}

export async function saveResponse(cfg: BackendConfig, payload: SavePayload): Promise<void> {
    const url = safeJoin(baseUrl(cfg), cfg.savePath || "/save-chat");
    await request<unknown>(cfg, url, { method: "POST", body: JSON.stringify(payload) });
}

export type ConnectionStatus = "connected" | "auth-failed" | "unavailable" | "incomplete";

export async function testConnection(cfg: BackendConfig): Promise<ConnectionStatus> {
    if (!isConfigured(cfg)) return "incomplete";
    try {
        await searchProperties(cfg, "a", 1);
        return "connected";
    } catch (err) {
        if (err instanceof ApiError && err.kind === "auth") return "auth-failed";
        return "unavailable";
    }
}