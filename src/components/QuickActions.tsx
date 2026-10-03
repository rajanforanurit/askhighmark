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

export const QuickActions: React.FC<QuickActionsProps> = ({ actions, onSelect, accentColor, disabled }) => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "8px 12px 4px" }}>
        {actions.map(action => (
            <button
                key={action.id}
                disabled={disabled}
                onClick={() => onSelect(action)}
                style={{
                    border: `1px solid ${accentColor}`,
                    color: accentColor,
                    background: "transparent",
                    borderRadius: 14,
                    padding: "4px 12px",
                    fontSize: 12,
                    cursor: disabled ? "default" : "pointer",
                    opacity: disabled ? 0.5 : 1,
                }}
            >
                {action.label}
            </button>
        ))}
    </div>
);

export default QuickActions;
