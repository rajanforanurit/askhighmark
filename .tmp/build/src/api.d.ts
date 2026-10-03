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
export declare class ApiError extends Error {
    readonly kind: ApiErrorKind;
    readonly status: number;
    constructor(kind: ApiErrorKind, status?: number);
}
export declare function isConfigured(cfg: BackendConfig): boolean;
export declare function describeError(err: unknown, action?: "ask" | "save"): string;
export declare function searchProperties(cfg: BackendConfig, query: string, limit?: number): Promise<{
    results: PropertyRecord[];
}>;
export declare function compareWithNearest(cfg: BackendConfig, bizKey: string, count?: number): Promise<NearestResult & {
    comparison: ComparisonResult;
}>;
export declare function askAI(cfg: BackendConfig, query: string, filters?: ActiveFilterPayload): Promise<AskAIResult>;
export declare function saveResponse(cfg: BackendConfig, payload: SavePayload): Promise<void>;
export type ConnectionStatus = "connected" | "auth-failed" | "unavailable" | "incomplete";
export declare function testConnection(cfg: BackendConfig): Promise<ConnectionStatus>;
