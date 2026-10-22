import { type BackendConfig } from "../api";
import { type AreaSuggestion, type ResolvedArea } from "../services/googleMaps";
export declare function planAreaSearch(text: string, apiKey: string, cfg: BackendConfig, cached?: AreaSuggestion[]): Promise<ResolvedArea | null>;
