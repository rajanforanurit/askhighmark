import * as React from "react";
import {
    AreaSearchError, geocodeArea, resolveSuggestion, suggestAreas,
    type AreaSuggestion, type ResolvedArea,
} from "../services/googleMaps";
import Icon from "./Icons";

export interface AreaSearchProps {
    apiKey: string;
    busy: boolean;
    onSearch: (area: ResolvedArea) => void;
}

const DEBOUNCE_MS = 180;

let listCounter = 0;

const MESSAGES = {
    "not-found": "We couldn't find that area. Try adding the city or state.",
    "unavailable": "Area search is unavailable right now. Check that the Google Maps key allows Places and Geocoding.",
};

export const AreaSearch: React.FC<AreaSearchProps> = ({ apiKey, busy, onSearch }) => {
    const [value, setValue] = React.useState("");
    const [suggestions, setSuggestions] = React.useState<AreaSuggestion[]>([]);
    const [open, setOpen] = React.useState(false);
    const [active, setActive] = React.useState(-1);
    const [loading, setLoading] = React.useState(false);
    const [resolving, setResolving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const requestRef = React.useRef(0);
    const autocompleteOff = React.useRef(false);
    const wrapRef = React.useRef<HTMLDivElement>(null);
    const listId = React.useRef(`ap-area-list-${(listCounter += 1)}`).current;

    React.useEffect(() => {
        const text = value.trim();
        if (text.length < 2 || autocompleteOff.current) {
            setSuggestions([]);
            setLoading(false);
            return undefined;
        }
        const id = requestRef.current + 1;
        requestRef.current = id;
        setLoading(true);
        const timer = window.setTimeout(() => {
            suggestAreas(apiKey, text)
                .then(list => {
                    if (requestRef.current !== id) return;
                    setSuggestions(list);
                    setActive(-1);
                    setLoading(false);
                })
                .catch((err: unknown) => {
                    if (requestRef.current !== id) return;
                    if (err instanceof AreaSearchError && err.reason === "unavailable") autocompleteOff.current = true;
                    setSuggestions([]);
                    setLoading(false);
                });
        }, DEBOUNCE_MS);
        return () => window.clearTimeout(timer);
    }, [value, apiKey]);

    React.useEffect(() => {
        const close = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    const finish = (area: ResolvedArea) => {
        setOpen(false);
        setSuggestions([]);
        setError(null);
        setValue(area.name);
        onSearch(area);
    };

    const fail = (err: unknown) => {
        const reason = err instanceof AreaSearchError ? err.reason : "unavailable";
        setError(MESSAGES[reason]);
    };

    const choose = async (suggestion: AreaSuggestion) => {
        setResolving(true);
        setError(null);
        try {
            finish(await resolveSuggestion(suggestion));
        } catch (err) {
            fail(err);
        } finally {
            setResolving(false);
        }
    };

    const submit = async () => {
        const text = value.trim();
        if (!text || busy || resolving) return;
        const picked = active >= 0 ? suggestions[active] : suggestions[0];
        if (picked) {
            await choose(picked);
            return;
        }
        setResolving(true);
        setError(null);
        try {
            finish(await geocodeArea(apiKey, text));
        } catch (err) {
            fail(err);
        } finally {
            setResolving(false);
        }
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive(a => (suggestions.length === 0 ? -1 : (a + 1) % suggestions.length));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive(a => (suggestions.length === 0 ? -1 : (a - 1 + suggestions.length) % suggestions.length));
        } else if (e.key === "Enter") {
            e.preventDefault();
            void submit();
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    };

    const showList = open && suggestions.length > 0;
    const working = loading || resolving;

    return (
        <div className="ap-area" ref={wrapRef}>
            <div className="ap-area-box">
                <span className="ap-area-ico"><Icon name="search" size={15} /></span>
                <input
                    className="ap-area-input"
                    type="text"
                    role="combobox"
                    aria-label="Search properties by area or locality"
                    aria-expanded={showList}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
                    placeholder="Search properties by area or locality, e.g. Downtown Austin"
                    value={value}
                    disabled={busy}
                    onChange={e => {
                        setValue(e.target.value);
                        setOpen(true);
                        setError(null);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={onKeyDown}
                />
                {working && <span className="ap-area-spin" role="status" aria-label="Searching" />}
                {value && !working && (
                    <button
                        type="button"
                        className="ap-btn ap-btn--ghost ap-icon-btn"
                        aria-label="Clear area search"
                        onClick={() => {
                            setValue("");
                            setSuggestions([]);
                            setError(null);
                        }}
                    >
                        <Icon name="close" size={14} />
                    </button>
                )}
                <button type="button" className="ap-btn ap-btn--primary" disabled={busy || resolving || !value.trim()} onClick={() => void submit()}>
                    Search
                </button>
            </div>
            {showList && (
                <ul className="ap-area-list" id={listId} role="listbox">
                    {suggestions.map((s, i) => (
                        <li
                            key={s.id}
                            id={`${listId}-${i}`}
                            role="option"
                            aria-selected={i === active}
                            className={`ap-area-opt${i === active ? " ap-area-opt--active" : ""}`}
                            onMouseDown={e => e.preventDefault()}
                            onMouseEnter={() => setActive(i)}
                            onClick={() => void choose(s)}
                        >
                            <Icon name="nearby" size={14} />
                            <span className="ap-area-main">{s.primary}</span>
                            {s.secondary && <span className="ap-area-sub">{s.secondary}</span>}
                        </li>
                    ))}
                </ul>
            )}
            {error && <div className="ap-area-err" role="alert">{error}</div>}
        </div>
    );
};

export default AreaSearch;
