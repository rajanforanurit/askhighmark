import * as React from "react";
import type { SelectionState } from "../types";

export interface PropertySelectorProps {
    selection: SelectionState;
    subjectName: string | null;
    onChange: (keys: string[]) => void;
}

const STYLES = `
.ap-sel-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 12px;border-bottom:1px solid var(--ap-line)}
.ap-sel-search{flex:1;min-width:140px;height:28px;border:1px solid var(--ap-line);border-radius:8px;padding:0 10px;font:inherit;background:#fff;color:var(--ap-ink)}
.ap-sel-search:focus{outline:2px solid var(--ap-accent);outline-offset:1px}
.ap-sel-list{max-height:220px;overflow-y:auto;margin:0;padding:4px;list-style:none}
.ap-sel-item{display:flex;align-items:center;gap:10px;padding:6px 8px;border-radius:8px;cursor:pointer;min-width:0}
.ap-sel-item:hover{background:var(--ap-accent-soft)}
.ap-sel-item--on{background:var(--ap-accent-soft)}
.ap-sel-item input{width:16px;height:16px;margin:0;flex-shrink:0;accent-color:var(--ap-accent);cursor:pointer}
.ap-sel-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:550}
.ap-sel-sub{color:var(--ap-muted);font-size:11.5px;white-space:nowrap}
.ap-sel-status{color:var(--ap-muted);font-weight:500;font-size:12px}
.ap-sel-status--error{color:var(--ap-danger)}
.ap-sel-empty{padding:12px;color:var(--ap-muted);text-align:center}
`;

export const PropertySelector: React.FC<PropertySelectorProps> = ({ selection, subjectName, onChange }) => {
    const [query, setQuery] = React.useState("");
    const [open, setOpen] = React.useState(true);
    const { options, selectedKeys, subjectKey, defaultCount, status } = selection;

    const chosen = React.useMemo(() => new Set(selectedKeys), [selectedKeys]);
    const needle = query.trim().toLowerCase();
    const visible = React.useMemo(
        () => (needle ? options.filter(o => `${o.name} ${o.subtitle}`.toLowerCase().includes(needle)) : options),
        [options, needle],
    );

    const toggle = (key: string) => {
        if (chosen.has(key)) onChange(selectedKeys.filter(k => k !== key));
        else onChange([...selectedKeys, key]);
    };
    const resetToDefault = () => onChange(options.slice(0, defaultCount).map(o => o.key));
    const clearAll = () => onChange([]);

    const total = options.length + (subjectKey ? 1 : 0);
    const picked = selectedKeys.length + (subjectKey ? 1 : 0);

    return (
        <section className="ap-panel" aria-label="Select properties" style={{ flex: "0 0 auto" }}>
            <style>{STYLES}</style>
            <div className="ap-panel-head">
                <span>
                    Select Properties{" "}
                    <span className="ap-sel-status">{picked} of {total} selected</span>
                </span>
                <span className="ap-panel-actions">
                    {status === "loading" && <span className="ap-sel-status" role="status">Updating…</span>}
                    {status === "error" && (
                        <span className="ap-sel-status ap-sel-status--error" role="alert">
                            Couldn't update.{" "}
                            <button type="button" className="ap-btn ap-btn--ghost" onClick={() => onChange(selectedKeys)}>Retry</button>
                        </span>
                    )}
                    <button
                        type="button"
                        className="ap-btn ap-btn--ghost"
                        aria-expanded={open}
                        onClick={() => setOpen(o => !o)}
                    >
                        {open ? "Hide" : "Show"}
                    </button>
                </span>
            </div>
            {open && (
                <>
                    <div className="ap-sel-tools">
                        <input
                            className="ap-sel-search"
                            type="search"
                            placeholder="Search properties…"
                            aria-label="Search properties"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                        <button type="button" className="ap-btn" onClick={resetToDefault}>
                            First {defaultCount}
                        </button>
                        <button type="button" className="ap-btn" disabled={selectedKeys.length === 0} onClick={clearAll}>
                            Clear
                        </button>
                    </div>
                    <ul className="ap-sel-list" role="group" aria-label="Properties">
                        {subjectKey && (
                            <li className="ap-sel-item ap-sel-item--on" title="The property you asked about is always shown">
                                <input type="checkbox" checked disabled aria-label={`${subjectName ?? "Selected property"} (always shown)`} />
                                <span className="ap-sel-name">{subjectName ?? "Selected property"}</span>
                                <span className="ap-tag">Subject</span>
                            </li>
                        )}
                        {visible.map(o => {
                            const on = chosen.has(o.key);
                            return (
                                <li key={o.key} className={`ap-sel-item${on ? " ap-sel-item--on" : ""}`}>
                                    <label style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, cursor: "pointer" }}>
                                        <input type="checkbox" checked={on} onChange={() => toggle(o.key)} />
                                        <span className="ap-sel-name">{o.name}</span>
                                        <span className="ap-sel-sub">
                                            {[o.subtitle, o.distance !== null ? `${o.distance.toFixed(1)} mi` : ""].filter(Boolean).join(" · ")}
                                        </span>
                                    </label>
                                </li>
                            );
                        })}
                        {visible.length === 0 && <li className="ap-sel-empty">No properties match your search.</li>}
                    </ul>
                </>
            )}
        </section>
    );
};

export default PropertySelector;
