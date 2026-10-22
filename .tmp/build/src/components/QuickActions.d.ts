import * as React from "react";
export interface QuickAction {
    id: string;
    label: string;
}
export interface QuickActionsProps {
    actions: QuickAction[];
    onSelect: (action: QuickAction) => void;
    accentColor: string;
    disabled?: boolean;
}
export declare const QuickActions: React.FC<QuickActionsProps>;
export default QuickActions;
