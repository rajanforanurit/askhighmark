import * as React from "react";
export interface EmptyStateProps {
    title: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare const EmptyState: React.FC<EmptyStateProps>;
export interface ErrorStateProps {
    message: string;
    onRetry?: () => void;
}
export declare const ErrorState: React.FC<ErrorStateProps>;
export declare const ConfigNotice: React.FC;
