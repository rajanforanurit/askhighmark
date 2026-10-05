import * as React from "react";
import type { ComparisonTableSettings } from "../settings";
import type { FinancialsPayload } from "../api";
export type FinancialMeasure = "actual" | "budget";
export interface FinancialPanelProps {
    measure: FinancialMeasure;
    financials: FinancialsPayload | null;
    loading: boolean;
    error: string | null;
    subjectKey: string | null;
    fontSize: number;
    settings: ComparisonTableSettings;
    onRetry: () => void;
}
export declare const FinancialPanel: React.FC<FinancialPanelProps>;
export default FinancialPanel;
