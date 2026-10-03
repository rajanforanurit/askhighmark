import * as React from "react";
import type { FilterOptions, FilterState, RangeBounds, RangeKey } from "../types";
import { CLASS_OPTIONS } from "../utils/filters";
import { RANGE_DEFS } from "../utils/fields";
import { formatValue } from "../utils/format";
import Icon from "./Icons";

export interface FilterPanelProps {
    filters: FilterState;
    options: FilterOptions;
    activeCount: number;
    onChange: (next: FilterState) => void;
    onReset: () => void;
}

interface NumberBoxProps {
    value: number;
    min: number;
    max: number;
    step: number;
    label: string;
    disabled: boolean;
    onCommit: (v: number) => void;
}

const NumberBox: React.FC<NumberBoxProps> = ({ value, min, max, step, label, disabled, onCommit }) => {
    const [draft, setDraft] = React.useState(String(value));
    React.useEffect(() => setDraft(String(value)), [value]);
    const commit = () => {
        const n = Number(draft);
        if (isFinite(n) && draft.trim() !== "") onCommit(Math.min(max, Math.max(min, n)));
        else setDraft(String(value));
    };
    return (
        <input
            className="ap-num-input"
            type="number"
            value={draft}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            aria-label={label}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => {
                if (e.key === "Enter") commit();
            }}
        />
    );
};

interface RangeControlProps {
    label: string;
    bounds: RangeBounds | undefined;
    value: [number, number] | undefined;
    step: number;
    onChange: (v: [number, number] | undefined) => void;
}

const RangeControl: React.FC<RangeControlProps> = ({ label, bounds, value, step, onChange }) => {
    const disabled = !bounds || bounds.min === bounds.max;
    const min = bounds?.min ?? 0;
    const max = bounds?.max ?? 0;
    const lo = value ? Math.max(min, value[0]) : min;
    const hi = value ? Math.min(max, value[1]) : max;
    const span = max - min || 1;

    const emit = (a: number, b: number) => {
        if (a <= min && b >= max) onChange(undefined);
        else onChange([a, b]);
    };

    return (
        <div className="ap-field">
            <div className="ap-field-label">{label}</div>
            {!bounds && <div className="ap-drawer-sub">Not available in this result</div>}
            <div className="ap-range">
                <div className="ap-range-track" />
                <div className="ap-range-fill" style={{ left: `${((lo - min) / span) * 100}%`, right: `${100 - ((hi - min) / span) * 100}%` }} />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={lo}
                    disabled={disabled}
                    aria-label={`${label} minimum`}
                    onChange={e => emit(Math.min(Number(e.target.value), hi), hi)}
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={hi}
                    disabled={disabled}
                    aria-label={`${label} maximum`}
                    onChange={e => emit(lo, Math.max(Number(e.target.value), lo))}
                />
            </div>
            <div className="ap-range-vals">
                <NumberBox value={lo} min={min} max={hi} step={step} label={`${label} minimum value`} disabled={disabled} onCommit={v => emit(v, hi)} />
                <span>to</span>
                <NumberBox value={hi} min={lo} max={max} step={step} label={`${label} maximum value`} disabled={disabled} onCommit={v => emit(lo, v)} />
            </div>
        </div>
    );
};

export const FilterPanel: React.FC<FilterPanelProps> = ({ filters, options, activeCount, onChange, onReset }) => {
    const setRange = (key: RangeKey, v: [number, number] | undefined) => {
        const ranges = { ...filters.ranges };
        if (v) ranges[key] = v;
        else delete ranges[key];
        onChange({ ...filters, ranges });
    };

    const toggleClass = (name: string) => {
        const has = filters.classes.includes(name);
        const classes = has ? filters.classes.filter(c => c !== name) : [...filters.classes, name];
        onChange({ ...filters, classes });
    };

    return (
        <div role="group" aria-label="Filters">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "12px 18px" }}>
                <div className="ap-field">
                    <label className="ap-field-label" htmlFor="ap-f-submarket">Submarket</label>
                    <select
                        id="ap-f-submarket"
                        className="ap-select"
                        value={filters.submarket}
                        disabled={!options.hasSubmarket}
                        onChange={e => onChange({ ...filters, submarket: e.target.value })}
                    >
                        <option value="">Select Submarket</option>
                        {options.submarkets.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div className="ap-field">
                    <label className="ap-field-label" htmlFor="ap-f-zip">ZIP</label>
                    <select
                        id="ap-f-zip"
                        className="ap-select"
                        value={filters.zip}
                        disabled={!options.hasZip}
                        onChange={e => onChange({ ...filters, zip: e.target.value })}
                    >
                        <option value="">Select ZIP</option>
                        {options.zips.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                </div>

                <fieldset className="ap-field" style={{ border: 0, padding: 0, margin: 0 }}>
                    <legend className="ap-field-label" style={{ padding: 0, marginBottom: 4 }}>Property Class</legend>
                    {CLASS_OPTIONS.map(name => (
                        <label key={name} className="ap-check">
                            <input
                                type="checkbox"
                                checked={filters.classes.includes(name)}
                                disabled={!options.hasClass && name !== "None"}
                                onChange={() => toggleClass(name)}
                            />
                            {name}
                        </label>
                    ))}
                    {!options.hasClass && <div className="ap-drawer-sub">Class is not available in this result</div>}
                </fieldset>

                {RANGE_DEFS.map(def => (
                    <RangeControl
                        key={def.key}
                        label={def.label}
                        bounds={options.bounds[def.key]}
                        value={filters.ranges[def.key]}
                        step={def.step}
                        onChange={v => setRange(def.key, v)}
                    />
                ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 12 }}>
                <span className="ap-drawer-sub">
                    {options.bounds.units ? `Units ${formatValue(options.bounds.units.min, "integer")} to ${formatValue(options.bounds.units.max, "integer")}` : "\u00a0"}
                </span>
                <button type="button" className="ap-btn ap-tip" data-tip="Reset all filters" aria-label="Reset all filters" onClick={onReset} disabled={activeCount === 0}>
                    <Icon name="reset" size={14} />
                    Reset All
                </button>
            </div>
        </div>
    );
};

export default FilterPanel;
