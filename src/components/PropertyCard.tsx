import * as React from "react";
import type { MapProperty } from "../types";
import { FIELD_ALIASES, pick } from "../utils/fields";
import { formatValue } from "../utils/format";
import { classifyClass } from "../utils/filters";
import Icon from "./Icons";

export interface PropertyCardProps {
    property: MapProperty;
    onClose: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onClose }) => {
    const v = property.values;
    const location = [v.City, v.State].filter(x => typeof x === "string" && x).join(", ");
    const clsRaw = pick(v, [...FIELD_ALIASES.propertyClass]);
    const cls = clsRaw !== undefined ? classifyClass(clsRaw) : null;
    const units = pick(v, [...FIELD_ALIASES.units]);

    const entries: { label: string; value: string }[] = [];
    const add = (label: string, raw: unknown, type: Parameters<typeof formatValue>[1]) => {
        if (raw !== undefined && raw !== null && raw !== "") entries.push({ label, value: formatValue(raw, type) });
    };
    add("Occupancy", pick(v, [...FIELD_ALIASES.occupancy]), "percent");
    add("Rent / SqFt", pick(v, [...FIELD_ALIASES.rentPsf]), "currency");
    add("Year Built", pick(v, [...FIELD_ALIASES.yearBuilt]), "year");
    add("Submarket", pick(v, [...FIELD_ALIASES.submarket]), "text");
    add("Distance", pick(v, [...FIELD_ALIASES.proximity]), "distance");
    add("Asset Type", v.AssetType, "text");
    add("Status", v.PropertyStatus, "text");
    add("Management", v.ManagementCompany, "text");
    const shown = entries.slice(0, 6);

    return (
        <div className="ap-info" role="dialog" aria-label={`${property.name} details`}>
            <button type="button" className="ap-btn ap-btn--ghost ap-icon-btn ap-info-close ap-tip" data-tip="Close details" aria-label="Close property details" onClick={onClose}>
                <Icon name="close" size={14} />
            </button>
            <div className="ap-info-title">{property.name}</div>
            <div className="ap-info-sub">
                {[cls, units !== undefined ? `${formatValue(units, "integer")} Units` : null, location || null]
                    .filter(Boolean)
                    .join("  |  ")}
            </div>
            {shown.length > 0 && (
                <div className="ap-info-grid">
                    {shown.map(e => (
                        <div key={e.label}>
                            <div className="ap-info-k">{e.label}</div>
                            <div className="ap-info-v">{e.value}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PropertyCard;
