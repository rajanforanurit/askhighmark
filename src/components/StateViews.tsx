import * as React from "react";
import Icon from "./Icons";

export interface EmptyStateProps {
    title: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, message, actionLabel, onAction }) => (
    <div className="ap-state">
        <div className="ap-state-title">{title}</div>
        {message && <div>{message}</div>}
        {actionLabel && onAction && (
            <button type="button" className="ap-btn ap-btn--primary" onClick={onAction}>
                <Icon name="reset" size={14} />
                {actionLabel}
            </button>
        )}
    </div>
);

export interface ErrorStateProps {
    message: string;
    onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => (
    <div className="ap-state ap-state--error" role="alert">
        <div className="ap-state-title">Something went wrong while preparing this analysis.</div>
        <div>{message}</div>
        {onRetry && (
            <button type="button" className="ap-btn ap-btn--primary" onClick={onRetry}>
                Try Again
            </button>
        )}
    </div>
);

export const ConfigNotice: React.FC = () => (
    <div className="ap-notice" role="alert">
        <div className="ap-notice-title">Ask Highmark is not available right now</div>
        <div>Please contact your administrator to finish setting it up.</div>
    </div>
);
