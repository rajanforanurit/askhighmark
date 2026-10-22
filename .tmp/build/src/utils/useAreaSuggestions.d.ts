import { type AreaSuggestion } from "../services/googleMaps";
export interface AreaSuggestions {
    items: AreaSuggestion[];
    dismiss: () => void;
    clear: () => void;
}
export declare function useAreaSuggestions(apiKey: string, text: string, enabled: boolean): AreaSuggestions;
