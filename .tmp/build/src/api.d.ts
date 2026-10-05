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
export declare class ApiError extends Error {
    readonly kind: ApiErrorKind;
    readonly status: number;
    constructor(kind: ApiErrorKind, status?: number);
}
export declare function isConfigured(cfg: BackendConfig): boolean;
export declare function isAborted(err: unknown): boolean;
export declare function describeError(err: unknown, action?: "ask" | "save"): string;
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
export declare function askAI(cfg: BackendConfig, query: string, filters?: ActiveFilterPayload, options?: AskOptions): Promise<AskAIResult>;
export declare function saveResponse(cfg: BackendConfig, payload: SavePayload): Promise<void>;
export declare function warmUp(cfg: BackendConfig): void;
export type ConnectionStatus = "connected" | "auth-failed" | "unavailable" | "incomplete";
export declare function testConnection(cfg: BackendConfig): Promise<ConnectionStatus>;
