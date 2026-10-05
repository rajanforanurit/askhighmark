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

export type FinancialView = "actual" | "budget" | "both";

export interface AmountSet {
    actual?: number;
    budget?: number;
    variance?: number;
    variance_pct?: number | null;
    value?: number;
}

export interface FinancialPeriod {
    year_month_from: number;
    year_month_to: number;
}

export interface ExcludedAmount {
    accounts: number;
    amount: number;
}

export interface FinancialSummaryLine extends AmountSet {
    key: string;
    label: string;
}

export interface FinancialAccountRow extends AmountSet {
    GLAccountKey: number;
    GLAccountCode: string | null;
    GLAccountName: string;
    GLAccountCategory: string | null;
    GLAccountSection: string;
}

export interface FinancialMonthRow extends AmountSet {
    YearMonthKey: number;
}

export interface PropertyFinancials {
    view: FinancialView;
    property: Partial<PropertyRecord>;
    period: FinancialPeriod | null;
    books: Record<string, number[]>;
    has_data: boolean;
    excluded_unmapped: Record<string, ExcludedAmount>;
    totals: AmountSet;
    summary: FinancialSummaryLine[];
    accounts: FinancialAccountRow[];
    months: FinancialMonthRow[];
    warnings: string[];
}

export interface ComparisonSummaryLine {
    key: string;
    label: string;
    values: Record<string, AmountSet>;
}

export interface ComparisonFinancials {
    view: FinancialView;
    period: FinancialPeriod | null;
    books: Record<string, number[]>;
    excluded_unmapped: Record<string, ExcludedAmount>;
    properties: (Partial<PropertyRecord> & AmountSet & { has_data: boolean })[];
    summary: ComparisonSummaryLine[];
    accounts: (Omit<FinancialAccountRow, keyof AmountSet> & { values: Record<string, AmountSet> })[];
    not_found: string[];
    no_data: string[];
    warnings: string[];
}

export type FinancialsPayload = PropertyFinancials | ComparisonFinancials;

export interface FinancialFields {
    view?: FinancialView | null;
    financials?: FinancialsPayload | null;
    financials_error?: string;
}

export interface ComparisonResult extends FinancialFields {
    fields: string[];
    properties: Record<string, unknown>[];
    not_found: string[];
}

export type MarkerRole = "subject" | "comparison" | "nearby" | "result";

export interface MapMarker {
    key: string;
    name: string | null;
    lat: number;
    lng: number;
    role: MarkerRole;
    rank: number;
    distance_miles: number | null;
}

export interface ContractColumn {
    key: string;
    label: string;
    type: string;
}

export interface ContractRow {
    key: string;
    is_subject: boolean;
    values: Record<string, unknown>;
}

export interface ContractTable {
    columns: ContractColumn[];
    rows: ContractRow[];
}

export interface AppliedConstraint {
    field: string;
    op: string;
    value: unknown;
}

export interface TaskInfo {
    id: string;
    kind: "search" | "nearest" | "compare" | "list" | "unknown";
    subject_key?: string | null;
    view?: FinancialView | null;
    radius_miles?: number | null;
    requested_count?: number | null;
    returned_count?: number;
    constraints_applied?: AppliedConstraint[];
    constraints_unsupported?: string[];
    plotted?: number;
    unplotted?: number;
    notes: string[];
}

export interface AskAIResult extends FinancialFields {
    intent: "search" | "nearest" | "compare" | "unknown";
    message?: string;
    results?: PropertyRecord[];
    target?: PropertyRecord;
    nearby?: PropertyRecord[];
    comparison?: ComparisonResult;
    unresolved?: string[];
    raw?: unknown;
    task?: TaskInfo;
    markers?: MapMarker[];
    table?: ContractTable;
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

export interface RequestOptions {
    signal?: AbortSignal;
}

export interface FinancialOptions extends RequestOptions {
    view?: FinancialView | null;
    yearMonthFrom?: number;
    yearMonthTo?: number;
    topAccounts?: number;
}

export interface AskOptions extends FinancialOptions {
    contextPropertyKey?: string | null;
}

export type ApiErrorKind = "config" | "auth" | "timeout" | "network" | "server" | "invalid" | "aborted";

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

const REQUEST_TIMEOUT_MS = 60000;
const RETRY_DELAY_MS = 1500;

export function isConfigured(cfg: BackendConfig): boolean {
    return cfg.backendUrl.trim() !== "" && cfg.secretKey.trim() !== "";
}

export function isAborted(err: unknown): boolean {
    return err instanceof ApiError && err.kind === "aborted";
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

function financialParams(options?: FinancialOptions): string[] {
    const parts: string[] = [];
    if (!options) return parts;
    if (options.view) parts.push(`view=${encodeURIComponent(options.view)}`);
    if (options.yearMonthFrom) parts.push(`year_month_from=${options.yearMonthFrom}`);
    if (options.yearMonthTo) parts.push(`year_month_to=${options.yearMonthTo}`);
    if (options.topAccounts) parts.push(`top_accounts=${options.topAccounts}`);
    return parts;
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise(resolve => {
        const timer = setTimeout(done, ms);
        function done() {
            clearTimeout(timer);
            signal?.removeEventListener("abort", done);
            resolve();
        }
        signal?.addEventListener("abort", done);
    });
}

function isTransient(err: unknown): boolean {
    if (!(err instanceof ApiError)) return false;
    if (err.kind === "timeout" || err.kind === "network") return true;
    return err.kind === "server" && (err.status === 500 || err.status === 502 || err.status === 503 || err.status === 504);
}

async function requestOnce<T>(
    cfg: BackendConfig,
    url: string,
    init: RequestInit,
    external?: AbortSignal,
): Promise<T> {
    if (!isConfigured(cfg)) {
        throw new ApiError("config");
    }
    if (external?.aborted) {
        throw new ApiError("aborted");
    }
    const controller = new AbortController();
    let cancelled = false;
    const onExternalAbort = () => {
        cancelled = true;
        controller.abort();
    };
    external?.addEventListener("abort", onExternalAbort);
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const cleanup = () => {
        clearTimeout(timer);
        external?.removeEventListener("abort", onExternalAbort);
    };

    let res: Response;
    try {
        res = await fetch(url, { ...init, headers: authHeaders(cfg), signal: controller.signal });
    } catch (err) {
        cleanup();
        if ((err as { name?: string }).name === "AbortError") {
            throw new ApiError(cancelled ? "aborted" : "timeout");
        }
        throw new ApiError("network");
    }
    cleanup();

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

// Read requests are safe to repeat. A cold backend or database often fails or times out
// on the first call and succeeds on the next, so retry once automatically instead of
// making the user click "Try Again". Writes (save) pass retries = 0.
async function request<T>(
    cfg: BackendConfig,
    url: string,
    init: RequestInit,
    external?: AbortSignal,
    retries = 1,
): Promise<T> {
    let attempt = 0;
    for (;;) {
        try {
            return await requestOnce<T>(cfg, url, init, external);
        } catch (err) {
            if (attempt >= retries || !isTransient(err) || external?.aborted) throw err;
            attempt += 1;
            await wait(RETRY_DELAY_MS, external);
            if (external?.aborted) throw new ApiError("aborted");
        }
    }
}

export function describeError(err: unknown, action: "ask" | "save" = "ask"): string {
    const kind = err instanceof ApiError ? err.kind : "server";
    if (kind === "config") return "AI configuration is incomplete.";
    if (kind === "aborted") return "This request was replaced by a newer one.";
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
    options?: RequestOptions,
): Promise<{ results: PropertyRecord[] }> {
    const url = `${baseUrl(cfg)}/properties/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    return request(cfg, url, { method: "GET" }, options?.signal);
}

export async function compareWithNearest(
    cfg: BackendConfig,
    bizKey: string,
    count = 5,
    options?: FinancialOptions,
): Promise<NearestResult & { comparison: ComparisonResult } & FinancialFields> {
    const parts = [`count=${count}`, ...financialParams(options)];
    const url = `${baseUrl(cfg)}/properties/${encodeURIComponent(bizKey)}/compare-with-nearest?${parts.join("&")}`;
    return request(cfg, url, { method: "GET" }, options?.signal);
}

export async function fetchFinancials(
    cfg: BackendConfig,
    bizKey: string,
    options?: FinancialOptions,
): Promise<PropertyFinancials> {
    const parts = financialParams(options);
    const query = parts.length > 0 ? `?${parts.join("&")}` : "";
    const url = `${baseUrl(cfg)}/properties/${encodeURIComponent(bizKey)}/financials${query}`;
    return request(cfg, url, { method: "GET" }, options?.signal);
}

export async function compareProperties(
    cfg: BackendConfig,
    bizKeys: string[],
    options?: FinancialOptions & { fields?: string[] },
): Promise<ComparisonResult & FinancialFields> {
    const url = `${baseUrl(cfg)}/properties/compare`;
    const body: {
        biz_keys: string[];
        fields?: string[];
        view?: FinancialView;
        year_month_from?: number;
        year_month_to?: number;
        top_accounts?: number;
    } = { biz_keys: bizKeys };
    if (options?.fields && options.fields.length > 0) body.fields = options.fields;
    if (options?.view) body.view = options.view;
    if (options?.yearMonthFrom) body.year_month_from = options.yearMonthFrom;
    if (options?.yearMonthTo) body.year_month_to = options.yearMonthTo;
    if (options?.topAccounts) body.top_accounts = options.topAccounts;
    return request(cfg, url, { method: "POST", body: JSON.stringify(body) }, options?.signal);
}

export async function askAI(
    cfg: BackendConfig,
    query: string,
    filters?: ActiveFilterPayload,
    options?: AskOptions,
): Promise<AskAIResult> {
    const url = `${baseUrl(cfg)}/ask-ai`;
    const body: {
        query: string;
        filters?: ActiveFilterPayload;
        view?: FinancialView;
        year_month_from?: number;
        year_month_to?: number;
        top_accounts?: number;
        context_property_key?: string;
    } = { query };
    if (filters && Object.keys(filters).length > 0) {
        body.filters = filters;
    }
    if (options?.view) body.view = options.view;
    if (options?.yearMonthFrom) body.year_month_from = options.yearMonthFrom;
    if (options?.yearMonthTo) body.year_month_to = options.yearMonthTo;
    if (options?.topAccounts) body.top_accounts = options.topAccounts;
    if (options?.contextPropertyKey) body.context_property_key = options.contextPropertyKey;
    return request(cfg, url, { method: "POST", body: JSON.stringify(body) }, options?.signal);
}

export async function saveResponse(cfg: BackendConfig, payload: SavePayload): Promise<void> {
    const url = safeJoin(baseUrl(cfg), cfg.savePath || "/save-chat");
    await request<unknown>(cfg, url, { method: "POST", body: JSON.stringify(payload) }, undefined, 0);
}

// Wakes a cold backend (and its database) as soon as the visual loads, so the first
// real question does not pay the start-up cost. Failures are ignored on purpose.
export function warmUp(cfg: BackendConfig): void {
    if (!isConfigured(cfg)) return;
    void request<unknown>(cfg, `${baseUrl(cfg)}/health`, { method: "GET" }, undefined, 0).catch((): undefined => undefined);
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