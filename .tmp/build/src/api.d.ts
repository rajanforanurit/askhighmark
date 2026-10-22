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
    properties: (Partial<PropertyRecord> & AmountSet & {
        has_data: boolean;
    })[];
    summary: ComparisonSummaryLine[];
    accounts: (Omit<FinancialAccountRow, keyof AmountSet> & {
        values: Record<string, AmountSet>;
    })[];
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
    sort?: {
        metric: string;
        direction: "asc" | "desc";
    } | null;
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
    datasets: {
        label: string;
        data: number[];
    }[];
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
    sort?: {
        metric: string;
        direction: "asc" | "desc";
    } | null;
    interpretation?: Interpretation;
    fields?: string[];
}
export interface AreaPayload {
    name: string;
    lat: number;
    lng: number;
    bounds: {
        north: number;
        south: number;
        east: number;
        west: number;
    } | null;
    radius_miles: number | null;
    total_matches: number;
    limit: number;
}
export interface AskAIResult extends FinancialFields, SelectionFields {
    code?: string;
    layout?: {
        focus?: string;
        sections?: string[];
    };
    location?: {
        requested?: string;
        type?: string;
        status?: string;
        message?: string | null;
        scope?: string | null;
        radius_miles?: number | null;
        origin?: {
            lat?: number;
            lng?: number;
        } | null;
    };
    warnings?: {
        code: string;
        message: string;
    }[];
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
    timings_ms?: {
        plan: number;
        execute: number;
        total: number;
        source: string;
    };
}
export interface ActiveFilterPayload {
    [label: string]: string | string[] | [number, number];
}
export interface SelectionRequest {
    bizKeys: string[];
    kind: "nearest" | "compare" | "list" | "search";
    subjectKey?: string | null;
    referenceKeys?: string[];
    origin?: {
        lat: number;
        lng: number;
    } | null;
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
export declare class ApiError extends Error {
    readonly kind: ApiErrorKind;
    readonly status: number;
    readonly code: string | null;
    readonly serverMessage: string | null;
    readonly requestId: string | null;
    constructor(kind: ApiErrorKind, status?: number, detail?: {
        code?: string | null;
        message?: string | null;
        requestId?: string | null;
    });
}
export declare function isConfigured(cfg: BackendConfig): boolean;
export declare function isAborted(err: unknown): boolean;
export type ErrorAction = "ask" | "save" | "financials" | "selection" | "nearby" | "area";
export declare function describeError(err: unknown, action?: ErrorAction): string;
export declare function describeErrorTitle(err: unknown): string;
export declare function searchProperties(cfg: BackendConfig, query: string, limit?: number, options?: RequestOptions): Promise<{
    results: PropertyRecord[];
}>;
export declare function compareWithNearest(cfg: BackendConfig, bizKey: string, count?: number, options?: FinancialOptions): Promise<NearestResult & {
    comparison: ComparisonResult;
} & FinancialFields>;
export declare function fetchFinancials(cfg: BackendConfig, bizKey: string, options?: FinancialOptions): Promise<PropertyFinancials>;
export declare function compareProperties(cfg: BackendConfig, bizKeys: string[], options?: FinancialOptions & {
    fields?: string[];
}): Promise<ComparisonResult & FinancialFields>;
export declare function clearAskCache(): void;
export declare function askAI(cfg: BackendConfig, query: string, filters?: ActiveFilterPayload, options?: AskOptions): Promise<AskAIResult>;
export interface AreaQuery {
    name: string;
    lat: number;
    lng: number;
    radiusMiles?: number | null;
    bounds?: {
        north: number;
        south: number;
        east: number;
        west: number;
    } | null;
}
export declare function findPropertiesInArea(cfg: BackendConfig, area: AreaQuery, options?: RequestOptions): Promise<AskAIResult>;
export declare function selectProperties(cfg: BackendConfig, req: SelectionRequest, options?: RequestOptions): Promise<AskAIResult>;
export declare function saveResponse(cfg: BackendConfig, payload: SavePayload): Promise<void>;
export declare function warmUp(cfg: BackendConfig): void;
export declare function keepAlive(cfg: BackendConfig): void;
export type ConnectionStatus = "connected" | "auth-failed" | "unavailable" | "incomplete";
export declare function testConnection(cfg: BackendConfig): Promise<ConnectionStatus>;
