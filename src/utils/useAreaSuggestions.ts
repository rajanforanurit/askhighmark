import * as React from "react";
import { AreaSearchError, suggestAreas, type AreaSuggestion } from "../services/googleMaps";
import { areaQueryText, matchesBare } from "./areaIntent";

const DEBOUNCE_MS = 200;

export interface AreaSuggestions {
    items: AreaSuggestion[];
    dismiss: () => void;
    clear: () => void;
}

export function useAreaSuggestions(apiKey: string, text: string, enabled: boolean): AreaSuggestions {
    const candidate = enabled && apiKey ? areaQueryText(text) : null;
    const candidateText = candidate?.text ?? "";
    const candidateKind = candidate?.kind ?? "";
    const [items, setItems] = React.useState<AreaSuggestion[]>([]);
    const [dismissed, setDismissed] = React.useState("");
    const requestRef = React.useRef(0);
    const offRef = React.useRef(false);

    React.useEffect(() => {
        if (!candidateText || offRef.current) {
            setItems(prev => (prev.length === 0 ? prev : []));
            return undefined;
        }
        const id = requestRef.current + 1;
        requestRef.current = id;
        const timer = window.setTimeout(() => {
            suggestAreas(apiKey, candidateText)
                .then(list => {
                    if (requestRef.current !== id) return;
                    setItems(candidateKind === "bare" ? list.filter(s => matchesBare(s.primary, candidateText)) : list);
                })
                .catch((err: unknown) => {
                    if (requestRef.current !== id) return;
                    if (err instanceof AreaSearchError && err.reason === "unavailable") offRef.current = true;
                    setItems([]);
                });
        }, DEBOUNCE_MS);
        return () => window.clearTimeout(timer);
    }, [apiKey, candidateText, candidateKind]);

    const visible = candidateText && dismissed !== text ? items : [];
    return {
        items: visible,
        dismiss: () => setDismissed(text),
        clear: () => {
            requestRef.current += 1;
            setItems([]);
        },
    };
}
