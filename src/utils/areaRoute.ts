import { searchProperties, type BackendConfig } from "../api";
import {
    AreaSearchError, geocodeArea, resolveSuggestion, suggestAreas,
    type AreaSuggestion, type ResolvedArea,
} from "../services/googleMaps";
import { areaQueryText, matchesBare } from "./areaIntent";

async function isPropertyName(cfg: BackendConfig, text: string): Promise<boolean> {
    try {
        const found = await searchProperties(cfg, text, 3);
        const typed = text.trim().toLowerCase();
        return (found.results ?? []).some(r => {
            const name = String(r.PropertyName ?? "").toLowerCase();
            return name.length > 0 && (name.includes(typed) || typed.includes(name));
        });
    } catch {
        return false;
    }
}

export async function planAreaSearch(
    text: string,
    apiKey: string,
    cfg: BackendConfig,
    cached: AreaSuggestion[] = [],
): Promise<ResolvedArea | null> {
    const parsed = areaQueryText(text);
    if (!parsed || !apiKey) return null;

    if (parsed.kind === "bare" && (await isPropertyName(cfg, parsed.text))) return null;

    let list: AreaSuggestion[] | null = cached;
    if (list.length === 0) {
        try {
            list = await suggestAreas(apiKey, parsed.text);
        } catch (err) {
            list = err instanceof AreaSearchError && err.reason === "unavailable" ? null : [];
        }
    }

    try {
        if (list === null) {
            return parsed.kind === "explicit" ? await geocodeArea(apiKey, parsed.text) : null;
        }
        const pick = parsed.kind === "explicit" ? list[0] : list.find(s => matchesBare(s.primary, parsed.text));
        return pick ? await resolveSuggestion(pick) : null;
    } catch {
        return null;
    }
}
