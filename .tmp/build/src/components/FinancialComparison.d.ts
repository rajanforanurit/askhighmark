import * as React from "react";
import type { ComparisonTableSettings } from "../settings";
import type { FinancialPeriod, FinancialsPayload } from "../api";
export interface FinancialComparisonProps {
    financials: FinancialsPayload;
    subjectKey: string | null;
    allowedKeys: Set<string> | null;
    onLoadFinancials?: (keys: string[], view: "actual" | "budget", period: FinancialPeriod | null) => Promise<FinancialsPayload>;
    fontSize: number;
    settings: ComparisonTableSettings;
}
export declare const FinancialComparison: React.FC<FinancialComparisonProps>;
export default FinancialComparison;
