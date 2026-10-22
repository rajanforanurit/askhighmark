import * as React from "react";
import Icon from "./Icons";

export interface TipsLoaderProps {
    label: string;
    compact?: boolean;
}

export const REAL_ESTATE_TIPS: string[] = [
    "Location is one of the most important factors influencing property value.",
    "Compare rental yields across nearby localities before making an investment decision.",
    "Properties near public transportation may attract stronger rental demand.",
    "Analyze historical price trends to identify potential investment opportunities.",
    "Compare market rents with asking rents to identify potential opportunities.",
    "Occupancy trends often reveal the health of a submarket before rents start to move.",
    "Net operating income, not gross rent, is the clearest measure of a property's performance.",
    "Compare a property's rent per square foot with its closest competitors.",
    "Nearby employers, schools and amenities tend to support steadier tenant demand.",
    "A rising vacancy rate in a submarket can signal pressure on rents.",
    "Unit mix and average unit size can change rent per square foot significantly.",
    "Budget versus actual variances can highlight where operating costs are drifting.",
    "Newer properties often command rent premiums, while older ones may offer stronger yields.",
    "Review how many comparable properties sit within a few miles to gauge local competition.",
];

export const TIP_INTERVAL_MS = 4500;

let cursor = 0;

export const TipsLoader: React.FC<TipsLoaderProps> = ({ label, compact = false }) => {
    const [index, setIndex] = React.useState(() => cursor % REAL_ESTATE_TIPS.length);

    React.useEffect(() => {
        const timer = window.setInterval(() => {
            setIndex(prev => {
                const next = (prev + 1) % REAL_ESTATE_TIPS.length;
                cursor = next;
                return next;
            });
        }, TIP_INTERVAL_MS);
        return () => window.clearInterval(timer);
    }, []);

    return (
        <div className={`ap-tips${compact ? " ap-tips--compact" : ""}`}>
            <div className="ap-tips-label" role="status" aria-live="polite">
                <span className="ap-sr">Ask Highmark: </span>
                {label}
                <span className="ap-dots" aria-hidden="true" />
            </div>
            <div className="ap-tip-card">
                <span className="ap-tip-ico" aria-hidden="true"><Icon name="bulb" size={compact ? 16 : 20} /></span>
                <div className="ap-tip-body">
                    <div className="ap-tip-kicker">Real estate tip</div>
                    <p key={index} className="ap-tip-text">{REAL_ESTATE_TIPS[index]}</p>
                </div>
            </div>
            <div className="ap-tip-bar" aria-hidden="true">
                <span key={index} style={{ animationDuration: `${TIP_INTERVAL_MS}ms` }} />
            </div>
        </div>
    );
};

export default TipsLoader;
