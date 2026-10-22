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

export interface SelectableOption {
    PropertyBizKey: string;
    PropertyName?: string;
    City?: string;
    State?: string;
    distance_miles?: number | null;
    selected?: boolean;
    [key: string]: unknown;
}

export interface SelectionInfo {
    default_count: number;
    selected_keys: string[];
    subject_key: string | null;
    pinned_keys?: string[];
    total_available?: number;
}

export interface SelectionFields {
    properties?: SelectableOption[];
    selection?: SelectionInfo;
}

export interface NearestResult extends SelectionFields {
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
    financials_pending?: boolean;
    financial_view?: FinancialView;
    financial_keys?: string[];
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
    decimals?: number;
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

export interface UnitPeriod {
    year_month_from: number | null;
    year_month_to: number | null;
    calendar_days: number | null;
    source: string;
}

export interface MetricConstraint {
    metric: string;
    op: string;
    basis: string;
    value: number | number[];
}

export interface Interpretation {
    intent?: string;
    property_names?: string[];
    constraints?: AppliedConstraint[];
    metric_constraints?: MetricConstraint[];
    sort?: { metric: string; direction: "asc" | "desc" } | null;
    visualization?: string | null;
    chart_metric?: string | null;
}

export interface VisualizationSpec {
    type: string;
    title?: string;
    metric: string;
    metric_label?: string;
    value_type?: string;
    labels: string[];
    keys?: (string | null)[];
    datasets: { label: string; data: number[] }[];
    percentages?: number[];
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
    period?: UnitPeriod | null;
    metrics?: string[];
    metric_constraints_applied?: MetricConstraint[];
    sort?: { metric: string; direction: "asc" | "desc" } | null;
    interpretation?: Interpretation;
    fields?: string[];
}

export interface AreaPayload {
    name: string;
    lat: number;
    lng: number;
    bounds: { north: number; south: number; east: number; west: number } | null;
    radius_miles: number | null;
    total_matches: number;
    limit: number;
}

export interface AskAIResult extends FinancialFields, SelectionFields {
    code?: string;
    layout?: { focus?: string; sections?: string[] };
    location?: {
        requested?: string; type?: string; status?: string; message?: string | null;
        scope?: string | null; radius_miles?: number | null; origin?: { lat?: number; lng?: number } | null;
    };
    warnings?: { code: string; message: string }[];
    context?: Record<string, unknown>;
    references?: PropertyRecord[];
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
    output_format?: string;
    visualization?: VisualizationSpec | null;
    area?: AreaPayload;
    timings_ms?: { plan: number; execute: number; total: number; source: string };
}

export interface ActiveFilterPayload {
    [label: string]: string | string[] | [number, number];
}

export interface SelectionRequest {
    bizKeys: string[];
    kind: "nearest" | "compare" | "list" | "search";
    subjectKey?: string | null;
    referenceKeys?: string[];
    origin?: { lat: number; lng: number } | null;
    fields?: string[];
    metrics?: string[];
    yearMonthFrom?: number | null;
    yearMonthTo?: number | null;
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
    context?: Record<string, unknown> | null;
    chart?: string | null;
}

export type ApiErrorKind = "config" | "auth" | "timeout" | "network" | "server" | "invalid" | "aborted";

export class ApiError extends Error {
    readonly kind: ApiErrorKind;
    readonly status: number;
    readonly code: string | null;
    readonly serverMessage: string | null;
    readonly requestId: string | null;

    constructor(kind: ApiErrorKind, status = 0, detail?: { code?: string | null; message?: string | null; requestId?: string | null }) {
        super(kind);
        this.name = "ApiError";
        this.kind = kind;
        this.status = status;
        this.code = detail?.code ?? null;
        this.serverMessage = detail?.message ?? null;
        this.requestId = detail?.requestId ?? null;
    }
}

async function readErrorDetail(res: Response): Promise<{ code: string | null; message: string | null; requestId: string | null }> {
    try {
        const body = (await res.json()) as { detail?: unknown };
        const detail = body?.detail;
        if (detail && typeof detail === "object") {
            const d = detail as { code?: unknown; message?: unknown; request_id?: unknown };
            if (typeof d.code === "string") {
                return {
                    code: d.code,
                    message: typeof d.message === "string" ? d.message.slice(0, 300) : null,
                    requestId: typeof d.request_id === "string" ? d.request_id.slice(0, 16) : null,
                };
            }
        }
    } catch {
        // Not JSON: nothing safe to show.
    }
    return { code: null, message: null, requestId: null };
}

const REQUEST_TIMEOUT_MS = 60000;
const RETRY_DELAY_MS = 800;
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 40;

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

    if (!res.ok) {
        const detail = await readErrorDetail(res);
        if (res.status === 401 || res.status === 403) throw new ApiError("auth", res.status, detail);
        if (res.status === 408 || res.status === 504) throw new ApiError("timeout", res.status, detail);
        throw new ApiError("server", res.status, detail);
    }
    try {
        return (await res.json()) as T;
    } catch {
        throw new ApiError("invalid", res.status);
    }
}

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

export type ErrorAction = "ask" | "save" | "financials" | "selection" | "nearby" | "area";

const ACTION_PHRASE: Record<ErrorAction, string> = {
    ask: "analyze your question",
    save: "save this response",
    financials: "load the financial data",
    selection: "update the selection",
    nearby: "find nearby properties",
    area: "search that area",
};

const AUTH_MESSAGE = "Your API key could not be verified. Check your configuration and try again.";
const NETWORK_MESSAGE = "Unable to connect to the property analysis service. Check your connection settings and try again.";
const TIMEOUT_MESSAGE = "The analysis took too long to complete. Try narrowing the property selection or simplifying your query.";

export function describeError(err: unknown, action: ErrorAction = "ask"): string {
    const api = err instanceof ApiError ? err : null;
    const kind = api ? api.kind : "server";
    if (kind === "config") return "AI configuration is incomplete.";
    if (kind === "aborted") return "This request was replaced by a newer one.";
    if (kind === "auth") return AUTH_MESSAGE;
    if (kind === "network") return NETWORK_MESSAGE;
    if (kind === "timeout") return action === "save" ? "Saving took too long. Please try again." : TIMEOUT_MESSAGE;

    // The backend sends a user-safe message with a stable code; prefer it.
    if (api?.code && api.serverMessage) {
        const ref = api.requestId && api.code === "internal_error" ? ` (reference ${api.requestId})` : "";
        return `${api.serverMessage}${ref}`;
    }
    if (kind === "invalid") return "The service returned a response that couldn't be read. Try again, or rephrase your question.";

    const status = api?.status ?? 0;
    if (action === "save") {
        if (status === 404) return "Couldn't save: the Save Path in AI Configuration was not found on the backend.";
        if (status === 503) return "Couldn't save: chat saving isn't configured on the backend.";
        if (status === 502) return "Couldn't save: the backend could not reach the save destination.";
    }
    const where = status ? ` (service status ${status})` : "";
    return `We couldn't ${ACTION_PHRASE[action]} because the service reported an error${where}. Try again shortly.`;
}

export function describeErrorTitle(err: unknown): string {
    const api = err instanceof ApiError ? err : null;
    if (!api) return "This request didn't complete";
    switch (api.kind) {
        case "auth": return "Authentication failed";
        case "network": return "Can't reach the service";
        case "timeout": return "The request timed out";
        case "config": return "Setup incomplete";
        case "invalid": return "Unreadable response";
        default: break;
    }
    switch (api.code) {
        case "database_unavailable": return "Property data unavailable";
        case "ai_unavailable":
        case "ai_timeout":
        case "ai_bad_response": return "Couldn't interpret the question";
        case "no_coordinates": return "Location data missing";
        case "not_found": return "Property not found";
        case "service_not_configured": return "Service not configured";
        default: return "This request didn't complete";
    }
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
    count?: number,
    options?: FinancialOptions,
): Promise<NearestResult & { comparison: ComparisonResult } & FinancialFields> {
    const parts = [...(count ? [`count=${count}`] : []), ...financialParams(options)];
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

interface CacheEntry {
    at: number;
    value: AskAIResult;
}

const askCache = new Map<string, CacheEntry>();
const askInflight = new Map<string, Promise<AskAIResult>>();

function askCacheKey(cfg: BackendConfig, query: string, filters?: ActiveFilterPayload, options?: AskOptions): string {
    return JSON.stringify([
        baseUrl(cfg),
        query.trim().toLowerCase().replace(/\s+/g, " "),
        filters ?? null,
        options?.view ?? null,
        options?.yearMonthFrom ?? null,
        options?.yearMonthTo ?? null,
        options?.topAccounts ?? null,
        options?.contextPropertyKey ?? null,
        options?.chart ?? null,
        options?.context ? contextFingerprint(options.context) : null,
    ]);
}

function contextFingerprint(context: Record<string, unknown>): string {
    const text = JSON.stringify(context);
    let hash = 5381;
    for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
    return `${text.length}:${hash}`;
}

function readAskCache(key: string): AskAIResult | null {
    const hit = askCache.get(key);
    if (!hit) return null;
    if (Date.now() - hit.at > CACHE_TTL_MS) {
        askCache.delete(key);
        return null;
    }
    askCache.delete(key);
    askCache.set(key, hit);
    return hit.value;
}

function writeAskCache(key: string, value: AskAIResult): void {
    if (!value || value.intent === "unknown") return;
    askCache.set(key, { at: Date.now(), value });
    while (askCache.size > CACHE_MAX_ENTRIES) {
        const oldest = askCache.keys().next().value;
        if (oldest === undefined) break;
        askCache.delete(oldest);
    }
}

export function clearAskCache(): void {
    areaCache.clear();
    askCache.clear();
    askInflight.clear();
}

export async function askAI(
    cfg: BackendConfig,
    query: string,
    filters?: ActiveFilterPayload,
    options?: AskOptions,
): Promise<AskAIResult> {
    const key = askCacheKey(cfg, query, filters, options);
    const cached = readAskCache(key);
    if (cached) return cached;
    if (!options?.signal) {
        const pending = askInflight.get(key);
        if (pending) return pending;
    }
    const run = askAIRequest(cfg, query, filters, options).then(value => {
        writeAskCache(key, value);
        return value;
    });
    if (!options?.signal) {
        askInflight.set(key, run);
        const clear = () => {
            askInflight.delete(key);
        };
        run.then(clear, clear);
    }
    return run;
}

async function askAIRequest(
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
        chart?: string;
        defer_financials?: boolean;
        context?: Record<string, unknown>;
    } = { query, defer_financials: true };
    if (options?.context) body.context = options.context;
    if (filters && Object.keys(filters).length > 0) {
        body.filters = filters;
    }
    if (options?.view) body.view = options.view;
    if (options?.yearMonthFrom) body.year_month_from = options.yearMonthFrom;
    if (options?.yearMonthTo) body.year_month_to = options.yearMonthTo;
    if (options?.topAccounts) body.top_accounts = options.topAccounts;
    if (options?.contextPropertyKey) body.context_property_key = options.contextPropertyKey;
    if (options?.chart) body.chart = options.chart;
    return request(cfg, url, { method: "POST", body: JSON.stringify(body) }, options?.signal);
}

export interface AreaQuery {
    name: string;
    lat: number;
    lng: number;
    radiusMiles?: number | null;
    bounds?: { north: number; south: number; east: number; west: number } | null;
}

const areaCache = new Map<string, { at: number; value: AskAIResult }>();

function areaParams(area: AreaQuery): string {
    const parts = [`lat=${area.lat.toFixed(6)}`, `lng=${area.lng.toFixed(6)}`, `name=${encodeURIComponent(area.name)}`];
    if (area.bounds) {
        parts.push(`north=${area.bounds.north.toFixed(6)}`, `south=${area.bounds.south.toFixed(6)}`);
        parts.push(`east=${area.bounds.east.toFixed(6)}`, `west=${area.bounds.west.toFixed(6)}`);
    } else if (area.radiusMiles) {
        parts.push(`radius_miles=${area.radiusMiles}`);
    }
    return parts.join("&");
}

export async function findPropertiesInArea(
    cfg: BackendConfig,
    area: AreaQuery,
    options?: RequestOptions,
): Promise<AskAIResult> {
    const key = `${baseUrl(cfg)}|${areaParams(area)}`;
    const hit = areaCache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;
    const url = `${baseUrl(cfg)}/properties/in-area?${areaParams(area)}`;
    const value = await request<AskAIResult>(cfg, url, { method: "GET" }, options?.signal);
    areaCache.set(key, { at: Date.now(), value });
    while (areaCache.size > CACHE_MAX_ENTRIES) {
        const oldest = areaCache.keys().next().value;
        if (oldest === undefined) break;
        areaCache.delete(oldest);
    }
    return value;
}

export async function selectProperties(
    cfg: BackendConfig,
    req: SelectionRequest,
    options?: RequestOptions,
): Promise<AskAIResult> {
    const url = `${baseUrl(cfg)}/properties/selection`;
    const body: Record<string, unknown> = { biz_keys: req.bizKeys, kind: req.kind };
    if (req.origin) body.origin = req.origin;
    if (req.referenceKeys && req.referenceKeys.length > 1) body.reference_keys = req.referenceKeys;
    else if (req.subjectKey) body.subject_key = req.subjectKey;
    if (req.fields && req.fields.length > 0) body.fields = req.fields;
    if (req.metrics && req.metrics.length > 0) body.metrics = req.metrics;
    if (req.yearMonthFrom) body.year_month_from = req.yearMonthFrom;
    if (req.yearMonthTo) body.year_month_to = req.yearMonthTo;
    return request(cfg, url, { method: "POST", body: JSON.stringify(body) }, options?.signal);
}

function savePathOf(cfg: BackendConfig): string {
    const raw = (cfg.savePath || "").trim();
    if (!raw) return "/save-chat";
    if (/^https?:\/\//i.test(raw)) {
        try {
            const parsed = new URL(raw);
            return `${parsed.pathname}${parsed.search}` || "/save-chat";
        } catch {
            return "/save-chat";
        }
    }
    return raw;
}

export async function saveResponse(cfg: BackendConfig, payload: SavePayload): Promise<void> {
    const url = safeJoin(baseUrl(cfg), savePathOf(cfg));
    await request<unknown>(cfg, url, { method: "POST", body: JSON.stringify(payload) }, undefined, 0);
}

export function warmUp(cfg: BackendConfig): void {
    if (!isConfigured(cfg)) return;
    const ignore = (): undefined => undefined;
    void request<unknown>(cfg, `${baseUrl(cfg)}/health`, { method: "GET" }, undefined, 0).catch(ignore);
    void request<unknown>(cfg, `${baseUrl(cfg)}/admin/unit-diagnostics`, { method: "GET" }, undefined, 0).catch(ignore);
}

export function keepAlive(cfg: BackendConfig): void {
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