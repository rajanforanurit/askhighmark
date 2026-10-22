import * as React from "react";
import type { VisualSettings } from "./settings";
import {
    ApiError, askAI, describeErrorTitle, compareProperties, compareWithNearest, describeError, fetchFinancials, findPropertiesInArea, isAborted, isConfigured,
    keepAlive, saveResponse, searchProperties, selectProperties, warmUp,
    type BackendConfig, type FinancialPeriod, type FinancialsPayload, type FinancialView,
} from "./api";
import { STYLES } from "./styles";
import type { AnalysisResult, AreaRetry, ChatEntry, ConversationContext, FilterState, Phase, ToastMessage } from "./types";
import { resolveSuggestion, type AreaSuggestion } from "./services/googleMaps";
import { areaQueryText } from "./utils/areaIntent";
import { asksForNearby } from "./utils/nearbyIntent";
import { DEFAULT_NEARBY, MAX_NEARBY, scopeNearest } from "./utils/nearbyScope";
import { resolveTicked, type FoundSet } from "./utils/foundSet";
import { planAreaSearch } from "./utils/areaRoute";
import { useAreaSuggestions } from "./utils/useAreaSuggestions";
import { nextGreetingIndex } from "./utils/greetings";
import { buildOptions, countActive, createDefaultFilters, toPayload } from "./utils/filters";
import { fromAsk, fromNearest, fromSelection, selectionFrom, withChart } from "./utils/normalize";
import type { AreaSuggestState } from "./components/ChatInputBar";
import { chartableColumns, detectChartFollowUp, supportsShare } from "./utils/charts";
import type { DownloadServiceLike } from "./utils/export";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ChatPanel from "./components/ChatPanel";
import ResponseWorkspace from "./components/ResponseWorkspace";
import FilterDrawer from "./components/FilterDrawer";
import TopActions, { type PanelView } from "./components/TopActions";
import WelcomeScreen, { type QuickAction } from "./components/WelcomeScreen";
import { ConfigNotice } from "./components/StateViews";
import {FinancialMeasure} from "./components/FinancialPanel";

export interface AppProps {
    settings: VisualSettings;
    username: string | null;
    viewport: { width: number; height: number };
    downloadService?: DownloadServiceLike;
}

const PHASE_LABEL: Record<Phase, string> = {
    idle: "",
    analyzing: "Analyzing your portfolio",
    locating: "Finding the property",
    nearby: "Finding relevant properties",
    preparing: "Preparing your analysis",
    area: "Finding properties in the area",
};

const COMPACT_WIDTH = 640;
const UNAVAILABLE_TEXT = "Ask Highmark isn't available right now. Please contact your administrator.";

let entryCounter = 0;
function nextId(): string {
    entryCounter += 1;
    return `msg-${entryCounter}`;
}

function soft(hex: string, alpha: number): string {
    const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return `rgba(42,91,215,${alpha})`;
    const n = parseInt(m[1], 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function buildSaveResponse(result: AnalysisResult): Record<string, unknown> {
    // Save what the user is looking at right now: the current selection, not the first answer.
    const raw = result.raw && typeof result.raw === "object" ? { ...(result.raw as Record<string, unknown>) } : {};
    delete raw.properties;
    const selection = result.selection;
    return {
        answer: result.answer,
        selection: selection
            ? {
                subjectKey: selection.subjectKey,
                selectedKeys: selection.selectedKeys,
                totalAvailable: selection.options.length + (selection.subjectKey ? 1 : 0),
            }
            : null,
        properties: result.rows.map(r => ({ key: r.key, isSubject: r.isSubject, ...r.values })),
        financials: result.financials ?? null,
        result: raw,
    };
}

const App: React.FC<AppProps> = ({ settings, username, viewport }) => {
    const [entries, setEntries] = React.useState<ChatEntry[]>([]);
    const [activeId, setActiveId] = React.useState<string | null>(null);
    const [inputValue, setInputValue] = React.useState("");
    const [phase, setPhase] = React.useState<Phase>("idle");
    const [nearbyPending, setNearbyPending] = React.useState(false);
    const [filters, setFilters] = React.useState<FilterState>(createDefaultFilters);
    const [tab, setTab] = React.useState<"chat" | "analysis">("chat");
    const [panel, setPanel] = React.useState<PanelView>("chat");
    const [filterOpen, setFilterOpen] = React.useState(false);
    const [toast, setToast] = React.useState<ToastMessage | null>(null);
    // The HomeScreen greeting only changes when a conversation starts or is cleared, never on re-render.
    const [greetingIndex, setGreetingIndex] = React.useState(() => nextGreetingIndex(-1));
    const greetingRef = React.useRef(greetingIndex);

    const inputRef = React.useRef<HTMLInputElement>(null);
    const sessionRef = React.useRef(0);
    const savingRef = React.useRef<Set<string>>(new Set());
    const toastTimer = React.useRef<number | undefined>(undefined);
    const entriesRef = React.useRef<ChatEntry[]>([]);
    const contextRef = React.useRef<ConversationContext | null>(null);
    const selectionTimers = React.useRef<Map<string, number>>(new Map());
    const selectionSeq = React.useRef<Map<string, number>>(new Map());
    const selectionAbort = React.useRef<Map<string, AbortController>>(new Map());
    // Property Comparison is shown only once the user is in the Find Nearby flow (button or a "near ..." question).
    const nearbyModeRef = React.useRef(false);
    // What the last search found. A follow-up "Compare" keeps all of it.
    const foundRef = React.useRef<FoundSet | null>(null);

    entriesRef.current = entries;

    const ai = settings.aiConfiguration;
    const config: BackendConfig = React.useMemo(
        () => ({ backendUrl: ai.backendUrl, secretKey: ai.secretKey, savePath: ai.savePath }),
        [ai.backendUrl, ai.secretKey, ai.savePath],
    );
    const configured = isConfigured(config);
    const compact = viewport.width < COMPACT_WIDTH;
    const landing = entries.length === 0;
    const busy = phase !== "idle";
    const thinkingLabel = busy ? PHASE_LABEL[phase] : null;

    const activeEntry = React.useMemo(
        () => entries.find(e => e.id === activeId) ?? null,
        [entries, activeId],
    );
    const activeResult = activeEntry?.result ?? null;
    const options = React.useMemo(() => buildOptions(activeResult ? activeResult.rows : []), [activeResult]);
    const activeCount = countActive(filters, options);

    const activeResultId = activeResult?.id;
    React.useEffect(() => {
        setFilterOpen(false);
    }, [activeResultId]);

    React.useEffect(() => {
        const timers = selectionTimers.current;
        const aborts = selectionAbort.current;
        return () => {
            window.clearTimeout(toastTimer.current);
            timers.forEach(t => window.clearTimeout(t));
            aborts.forEach(c => c.abort());
        };
    }, []);

    React.useEffect(() => {
        if (!configured) return undefined;
        warmUp(config);
        const timer = window.setInterval(() => keepAlive(config), 4 * 60 * 1000);
        return () => window.clearInterval(timer);
    }, [configured, config]);

    const loadFinancials = React.useCallback(
        async (requested: string[], view: FinancialView, period: FinancialPeriod | null): Promise<FinancialsPayload> => {
            let keys = requested;
            const options = { view, yearMonthFrom: period?.year_month_from, yearMonthTo: period?.year_month_to };
            // Never request financials for more than the scoped set (subject + MAX_NEARBY), whatever the caller passes.
            if (keys.length > MAX_NEARBY + 1) keys = keys.slice(0, MAX_NEARBY + 1);
            if (keys.length === 1) return fetchFinancials(config, keys[0], options);
            const response = await compareProperties(config, keys, options);
            if (!response.financials) throw new ApiError("server");
            return response.financials;
        },
        [config],
    );

    const rotateGreeting = React.useCallback(() => {
        const next = nextGreetingIndex(greetingRef.current);
        greetingRef.current = next;
        setGreetingIndex(next);
    }, []);

    const notify = React.useCallback((text: string, tone: "info" | "error" = "info") => {
        setToast({ id: Date.now(), text, tone });
        window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => setToast(null), 4200);
    }, []);

    const focusInput = () => {
        window.setTimeout(() => inputRef.current?.focus(), 0);
    };

    const appendUser = (text: string) => {
        setEntries(prev => [...prev, { id: nextId(), role: "user", text }]);
    };

    const appendAi = (entry: Omit<ChatEntry, "id" | "role">): string => {
        const id = nextId();
        setEntries(prev => [...prev, { ...entry, id, role: "ai" }]);
        setActiveId(id);
        setTab("analysis");
        return id;
    };

    const patchResult = (entryId: string, patch: Partial<NonNullable<ChatEntry["result"]>>) => {
        setEntries(prev => prev.map(e => (e.id === entryId && e.result ? { ...e, result: { ...e.result, ...patch } } : e)));
    };

    const hydrateFinancials = async (entryId: string, pending: { keys: string[]; view: FinancialView }) => {
        const session = sessionRef.current;
        try {
            const payload = await loadFinancials(pending.keys, pending.view, null);
            if (session !== sessionRef.current) return;
            patchResult(entryId, { financials: payload, financialsPending: null, financialsError: null });
        } catch (err) {
            if (session !== sessionRef.current) return;
            patchResult(entryId, { financialsPending: null, financialsError: describeError(err, "financials") });
        }
    };

    const deliver = (input: NonNullable<ChatEntry["result"]>, query: string) => {
        const resolved = resolveTicked({ ...input, showProperties: nearbyModeRef.current }, foundRef.current);
        let analysis = resolved.analysis;
        const missing = resolved.missing;
        if (resolved.found && analysis.selection) {
            foundRef.current = resolved.found;
            contextRef.current = { ...(contextRef.current ?? {}), result_keys: [...resolved.found.pinnedKeys, ...resolved.found.keys] };
        }
        // Every answer gets a Financial Comparison for the properties it shows (never more than the scoped set).
        if (analysis.rows.length > 0 && !analysis.financials && !analysis.financialsPending && !analysis.financialsError) {
            analysis = {
                ...analysis,
                financialsPending: {
                    keys: analysis.rows.map(r => r.key).slice(0, MAX_NEARBY + 1),
                    view: analysis.selection?.view ?? "actual",
                },
            };
        }
        const id = appendAi({ text: analysis.answer, query, result: analysis, saveState: "idle" });
        if (missing) void runSelection(id, missing, analysis);
        else if (analysis.financialsPending) void hydrateFinancials(id, analysis.financialsPending);
    };

    const appendFailure = (err: unknown, retry: ChatEntry["retry"]) => {
        console.warn("[AskHighmark] request failed:", err instanceof ApiError ? err.kind : "unexpected");
        appendAi({ text: describeError(err, retry?.type === "nearby" ? "nearby" : retry?.type === "area" ? "area" : "ask"), errorTitle: describeErrorTitle(err), isError: true, retry });
    };

    const runAsk = async (query: string) => {
        const session = sessionRef.current;
        if (activeResult && !activeEntry?.isError && activeResult.rows.length > 0) {
            const follow = detectChartFollowUp(query, activeResult.columns, activeResult.rows, activeResult.chart ?? null);
            if (follow) {
                const local = withChart(activeResult, follow.chart, follow.label);
                appendAi({ text: local.answer, query, result: local, saveState: "idle" });
                return;
            }
        }
        setPhase("analyzing");
        const startedAt = performance.now();
        try {
            const result = await askAI(config, query, toPayload(filters, options), { context: contextRef.current });
            if (session !== sessionRef.current) return;
            if (!result || typeof result !== "object") throw new ApiError("invalid");
            const continuing = activeResult?.selection?.kind === "nearest" || activeResult?.selection?.kind === "compare";
            const analysis = fromAsk(result, { wantsNearby: asksForNearby(query) || continuing });
            if (result.context) contextRef.current = result.context as ConversationContext;
            if (result.timings_ms) console.debug("Ask Highmark timings (ms)", result.timings_ms, "round trip", Math.round(performance.now() - startedAt));
            deliver(analysis, query);
        } catch (err) {
            if (session === sessionRef.current) appendFailure(err, { type: "ask", text: query });
        } finally {
            if (session === sessionRef.current) setPhase("idle");
        }
    };

    const runNearby = async (name: string) => {
        const session = sessionRef.current;
        setPhase("locating");
        try {
            const search = await searchProperties(config, name, 1);
            if (session !== sessionRef.current) return;
            if (!search || !Array.isArray(search.results)) throw new ApiError("invalid");
            if (search.results.length === 0) {
                const miss = fromAsk({
                    intent: "unknown",
                    message: `I couldn't find a property matching "${name}". Try a different name.`,
                });
                appendAi({ text: miss.answer, query: name, result: miss, saveState: "idle" });
                return;
            }
            setPhase("nearby");
            const fetched = await compareWithNearest(config, search.results[0].PropertyBizKey, DEFAULT_NEARBY);
            if (session !== sessionRef.current) return;
            if (!fetched || !fetched.target || !Array.isArray(fetched.nearby)) throw new ApiError("invalid");
            const found = scopeNearest(fetched);
            const answer = `Here's ${found.target.PropertyName} and its ${found.nearby.length} nearest properties.`;
            const analysis = fromNearest(found.target, found.nearby, found.comparison, answer, found, {
                selection: selectionFrom(found, "nearest"),
            });
            const refKey = String(found.target.PropertyBizKey);
            contextRef.current = {
                original_query: `Nearby properties for ${name}`,
                last_query: `Nearby properties for ${name}`,
                reference_keys: [refKey],
                result_keys: [refKey, ...(analysis.selection?.selectedKeys ?? found.nearby.map(p => String(p.PropertyBizKey)))],
                intent: "nearest",
            };
            deliver(analysis, `Nearby properties for ${name}`);
        } catch (err) {
            if (session === sessionRef.current) appendFailure(err, { type: "nearby", text: name });
        } finally {
            if (session === sessionRef.current) setPhase("idle");
        }
    };

    const runArea = async (area: AreaRetry, fallbackText?: string) => {
        const session = sessionRef.current;
        const label = `Properties in ${area.name}`;
        setPhase("area");
        try {
            const response = await findPropertiesInArea(config, {
                name: area.name,
                lat: area.lat,
                lng: area.lng,
                bounds: area.bounds,
                radiusMiles: area.bounds ? null : 3,
            });
            if (session !== sessionRef.current) return;
            if (!response || typeof response !== "object") throw new ApiError("invalid");
            const analysis = fromAsk(response);
            if (response.context) contextRef.current = response.context as ConversationContext;
            deliver(analysis, label);
        } catch (err) {
            if (session !== sessionRef.current) return;
            const blocked = err instanceof ApiError && (err.kind === "auth" || err.kind === "config" || err.kind === "aborted");
            if (fallbackText && !blocked) {
                // The area lookup failed; let the backend resolve the place from its own data instead.
                await runAsk(fallbackText);
                return;
            }
            appendFailure(err, { type: "area", text: label, area });
        } finally {
            if (session === sessionRef.current) setPhase("idle");
        }
    };

    const mapsKey = ai.mapsApiKey.trim();
    const areaHints = useAreaSuggestions(mapsKey, inputValue, configured && !busy && !nearbyPending);
    const [activeSuggestion, setActiveSuggestion] = React.useState(-1);

    React.useEffect(() => {
        setActiveSuggestion(-1);
    }, [areaHints.items]);

    const dispatchQuery = async (text: string, cached: AreaSuggestion[]) => {
        const session = sessionRef.current;
        if (mapsKey && areaQueryText(text)) {
            setPhase("analyzing");
            const area = await planAreaSearch(text, mapsKey, config, cached);
            if (session !== sessionRef.current) return;
            if (area) {
                void runArea({ name: area.name, lat: area.lat, lng: area.lng, bounds: area.bounds }, text);
                return;
            }
        }
        void runAsk(text);
    };

    const handlePickSuggestion = async (suggestion: AreaSuggestion) => {
        if (busy || !configured) return;
        const session = sessionRef.current;
        areaHints.clear();
        setInputValue("");
        if (landing) rotateGreeting();
        appendUser(`Properties in ${suggestion.text}`);
        setPhase("area");
        try {
            const area = await resolveSuggestion(suggestion);
            if (session !== sessionRef.current) return;
            void runArea({ name: area.name, lat: area.lat, lng: area.lng, bounds: area.bounds }, suggestion.text);
        } catch (err) {
            if (session !== sessionRef.current) return;
            setPhase("idle");
            notify("We couldn't load that area. Try another search.", "error");
        }
    };

    const areaSuggest: AreaSuggestState | undefined =
        mapsKey && !nearbyPending
            ? {
                items: areaHints.items,
                active: activeSuggestion,
                onActive: setActiveSuggestion,
                onPick: suggestion => void handlePickSuggestion(suggestion),
                onDismiss: areaHints.dismiss,
            }
            : undefined;

    const handleSend = () => {
        const text = inputValue.trim();
        if (!text || busy) return;
        if (!configured) {
            notify(UNAVAILABLE_TEXT, "error");
            return;
        }
        if (nearbyPending || asksForNearby(text)) nearbyModeRef.current = true;
        if (landing) rotateGreeting();
        appendUser(text);
        setInputValue("");
        const cached = areaHints.items;
        areaHints.clear();
        if (nearbyPending) {
            setNearbyPending(false);
            void runNearby(text);
        } else {
            void dispatchQuery(text, cached);
        }
    };

    const handleRetry = (entry: ChatEntry) => {
        if (!entry.retry || busy) return;
        if (entry.retry.type === "nearby") void runNearby(entry.retry.text);
        else if (entry.retry.type === "area" && entry.retry.area) void runArea(entry.retry.area);
        else void runAsk(entry.retry.text);
    };

    const handleQuickAction = (action: QuickAction) => {
        if (action.id === "find-nearby") {
            nearbyModeRef.current = true;
            setNearbyPending(true);
            setInputValue("");
        } else {
            setNearbyPending(false);
            setInputValue(action.prefill);
        }
        focusInput();
    };

    const handleSuggest = (text: string) => {
        setNearbyPending(false);
        setInputValue(text);
        if (compact) setTab("chat");
        focusInput();
    };

    const handleNewChat = () => {
        sessionRef.current += 1;
        contextRef.current = null;
        nearbyModeRef.current = false;
        foundRef.current = null;
        selectionTimers.current.forEach(t => window.clearTimeout(t));
        selectionTimers.current.clear();
        selectionAbort.current.forEach(c => c.abort());
        selectionAbort.current.clear();
        setEntries([]);
        setActiveId(null);
        setInputValue("");
        setNearbyPending(false);
        setPhase("idle");
        setFilters(createDefaultFilters());
        setFilterOpen(false);
        setPanel("chat");
        setTab("chat");
        rotateGreeting();
    };

    const showPanel = (next: PanelView) => {
        setPanel(next);
        if (compact) setTab("chat");
    };

    const toggleFilter = () => {
        setFilterOpen(open => !open);
    };

    const patchEntry = (id: string, change: (entry: ChatEntry) => ChatEntry) => {
        setEntries(prev => prev.map(e => (e.id === id ? change(e) : e)));
    };

    const hydrateSelectionFinancials = async (
        entryId: string,
        seq: number,
        pending: { keys: string[]; view: FinancialView },
    ) => {
        const session = sessionRef.current;
        const current = () => session === sessionRef.current && selectionSeq.current.get(entryId) === seq;
        try {
            const payload = await loadFinancials(pending.keys, pending.view, null);
            if (!current()) return;
            patchResult(entryId, { financials: payload, financialsPending: null, financialsError: null });
        } catch (err) {
            if (!current()) return;
            patchResult(entryId, { financialsPending: null, financialsError: describeError(err, "financials") });
        }
    };

    const runSelection = async (entryId: string, keys: string[], initial?: AnalysisResult) => {
        const session = sessionRef.current;
        const prev = initial ?? entriesRef.current.find(e => e.id === entryId)?.result;
        const selection = prev?.selection;
        if (!prev || !selection) return;
        const seq = (selectionSeq.current.get(entryId) ?? 0) + 1;
        selectionSeq.current.set(entryId, seq);
        selectionAbort.current.get(entryId)?.abort();
        const controller = new AbortController();
        selectionAbort.current.set(entryId, controller);
        const stale = () => session !== sessionRef.current || selectionSeq.current.get(entryId) !== seq;
        try {
            const response = await selectProperties(config, {
                bizKeys: keys,
                kind: selection.kind,
                subjectKey: selection.subjectKey,
                referenceKeys: selection.pinnedKeys,
                origin: prev.location?.origin ?? null,
                fields: selection.fields,
                metrics: prev.metricKeys,
                yearMonthFrom: prev.period?.year_month_from,
                yearMonthTo: prev.period?.year_month_to,
            }, { signal: controller.signal });
            if (stale()) return;
            if (!response || typeof response !== "object") throw new ApiError("invalid");
            const base = entriesRef.current.find(e => e.id === entryId)?.result ?? prev;
            const next = fromSelection(base, response, keys);
            const view = selection.view ?? prev.financialsPending?.view ?? prev.financials?.view ?? null;
            const wantsFinancials = view !== null && next.rows.length > 0;
            const pending = wantsFinancials && view ? { keys: next.rows.map(r => r.key), view } : null;
            const applied: AnalysisResult = { ...next, showProperties: prev.showProperties, financials: null, financialsError: null, financialsPending: pending };
            patchEntry(entryId, e => ({
                ...e,
                result: applied,
                saveState: e.saveState === "saved" ? "idle" : e.saveState,
            }));
            const prior = contextRef.current ?? {};
            contextRef.current = { ...prior, result_keys: [...selection.pinnedKeys, ...keys] };
            if (pending) void hydrateSelectionFinancials(entryId, seq, pending);
        } catch (err) {
            if (isAborted(err) || stale()) return;
            console.warn("[AskHighmark] selection update failed:", err instanceof ApiError ? err.kind : "unexpected");
            patchResult(entryId, { selection: { ...selection, selectedKeys: keys, status: "error" }, financialsPending: null });
            notify(describeError(err, "selection"), "error");
        } finally {
            if (selectionAbort.current.get(entryId) === controller) selectionAbort.current.delete(entryId);
        }
    };

    const handleSelectionChange = (entryId: string, keys: string[]) => {
        const unique = Array.from(new Set(keys));
        patchEntry(entryId, e => {
            const current = e.result?.selection;
            if (!e.result || !current) return e;
            return {
                ...e,
                saveState: e.saveState === "saved" ? "idle" : e.saveState,
                result: { ...e.result, selection: { ...current, selectedKeys: unique, status: "loading" } },
            };
        });
        window.clearTimeout(selectionTimers.current.get(entryId));
        const timer = window.setTimeout(() => {
            selectionTimers.current.delete(entryId);
            void runSelection(entryId, unique);
        }, 250);
        selectionTimers.current.set(entryId, timer);
    };

    const updateSaveState = (id: string, saveState: ChatEntry["saveState"]) => {
        setEntries(prev => prev.map(e => (e.id === id ? { ...e, saveState } : e)));
    };

    const handleSave = async (id: string) => {
        const entry = entries.find(e => e.id === id);
        if (!entry || !entry.result) return;
        if (savingRef.current.has(id) || entry.saveState === "saved") return;
        if (!configured) {
            notify(UNAVAILABLE_TEXT, "error");
            return;
        }
        savingRef.current.add(id);
        updateSaveState(id, "saving");
        try {
            await saveResponse(config, {
                query: entry.query ?? "",
                response: buildSaveResponse(entry.result),
                user_id: username ?? undefined,
                metadata: { source: "Ask Highmark Power BI visual", clientTime: new Date().toISOString() },
            });
            updateSaveState(id, "saved");
        } catch (err) {
            console.warn("[AskHighmark] save failed:", err instanceof ApiError ? err.kind : "unexpected");
            updateSaveState(id, "failed");
            notify(describeError(err, "save"), "error");
        } finally {
            savingRef.current.delete(id);
        }
    };

    const savedCount = entries.filter(e => e.role !== "user" && e.saveState === "saved").length;
    const activeSaveState = activeEntry?.saveState ?? "idle";
    const canSave = Boolean(activeResult) && !activeEntry?.isError && !busy
        && activeResult?.selection?.status !== "loading"
        && activeSaveState !== "saving" && activeSaveState !== "saved";

    const subjectName = (() => {
        const r = activeResult;
        if (!r || !r.subjectKey) return null;
        const row = r.rows.find(x => x.key === r.subjectKey);
        return row ? String(row.values.PropertyName ?? "") || null : null;
    })();

    const baseSuggestions = subjectName
        ? [
            `Compare rents for ${subjectName}`,
            `Check occupancy for ${subjectName}`,
            `Give me an overview of ${subjectName}`,
            `Show properties within 20 miles of ${subjectName} with their unit counts`,
        ]
        : ["Draw a map of ", "Compare ", "Give me an overview of "];

    const chartHints: string[] = [];
    if (activeResult && !activeEntry?.isError && !activeResult.chart) {
        const options = chartableColumns(activeResult.columns, activeResult.rows);
        if (options.length > 0) {
            chartHints.push("Show this as a bar chart");
            if (options.some(supportsShare)) chartHints.push("Show this as a pie chart");
        }
    }
    const suggestions = [...baseSuggestions, ...chartHints];

    const accent = settings.sendButton.backgroundColor;
    const rootStyle = {
        width: viewport.width,
        height: viewport.height,
        fontFamily: settings.header.fontFamily || undefined,
        "--ap-accent": accent,
        "--ap-accent-strong": settings.sendButton.hoverBackground,
        "--ap-accent-soft": soft(accent, 0.1),
    } as React.CSSProperties;

    const contextLabel = nearbyPending ? "Find Nearby Properties: type a property name" : null;
    const placeholder = nearbyPending
        ? "Type a property name…"
        : landing
            ? mapsKey ? "Ask anything, or search an area like Downtown Austin" : "Ask anything about your portfolio"
            : mapsKey ? "Ask Highmark or search an area…" : "Ask Highmark…";

    const workspace = (
        <ResponseWorkspace
            entry={activeEntry}
            busy={busy && Boolean(activeResult)}
            thinkingLabel={thinkingLabel}
            filters={filters}
            options={options}
            settings={settings}
            onFiltersReset={() => setFilters(createDefaultFilters())}
            onRetry={handleRetry}
            onLoadFinancials={loadFinancials}
            onSelectionChange={handleSelectionChange}
        />
    );

    const chat = (
        <ChatPanel
            entries={entries}
            activeId={activeId}
            view={panel}
            thinkingLabel={thinkingLabel}
            value={inputValue}
            placeholder={placeholder}
            disabled={busy}
            bubbleSettings={settings.messageBubble}
            inputSettings={settings.chatInput}
            buttonSettings={settings.sendButton}
            inputRef={inputRef}
            contextLabel={contextLabel}
            suggestions={suggestions}
            areaSuggest={areaSuggest}
            onChange={setInputValue}
            onSend={handleSend}
            onSelect={id => {
                setActiveId(id);
                if (compact) setTab("analysis");
            }}
            onSuggest={handleSuggest}
            onClearContext={() => setNearbyPending(false)}
        />
    );

    const drawer = (
        <FilterDrawer
            open={filterOpen}
            filters={filters}
            options={options}
            activeCount={activeCount}
            onChange={setFilters}
            onReset={() => setFilters(createDefaultFilters())}
            onClose={() => setFilterOpen(false)}
        />
    );

    let content: React.ReactNode;
    if (landing) {
        content = (
            <WelcomeScreen
                username={username}
                viewport={viewport}
                greetingIndex={greetingIndex}
                value={inputValue}
                onChange={setInputValue}
                onSend={handleSend}
                onQuickAction={handleQuickAction}
                disabled={busy}
                placeholder={placeholder}
                inputSettings={settings.chatInput}
                buttonSettings={settings.sendButton}
                inputRef={inputRef}
                contextLabel={contextLabel}
                onClearContext={() => setNearbyPending(false)}
                notice={!configured ? <ConfigNotice /> : undefined}
                areaSuggest={areaSuggest}
            />
        );
    } else if (compact) {
        content = (
            <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
                <div className="ap-tabs" role="tablist">
                    <button type="button" role="tab" aria-selected={tab === "chat"} onClick={() => setTab("chat")}>Chat</button>
                    <button type="button" role="tab" aria-selected={tab === "analysis"} onClick={() => setTab("analysis")}>Analysis</button>
                </div>
                <div style={{ flex: 1, minHeight: 0, display: "flex", position: "relative" }}>
                    {tab === "chat" ? chat : workspace}
                    {drawer}
                </div>
            </div>
        );
    } else {
        content = (
            <>
                <div style={{ position: "relative", width: "30%", minWidth: 240, maxWidth: 420, flexShrink: 0, minHeight: 0 }}>
                    {chat}
                    {drawer}
                </div>
                <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>{workspace}</div>
            </>
        );
    }

    return (
        <div className="ap-root" style={rootStyle}>
            <style>{STYLES}</style>
            <Header settings={settings.header} />
            {!landing && (
                <TopActions
                    view={panel}
                    historyCount={savedCount}
                    filterOpen={filterOpen}
                    activeFilters={activeCount}
                    filterDisabled={!activeResult || Boolean(activeEntry?.isError)}
                    saveState={activeSaveState}
                    saveDisabled={!canSave}
                    clearDisabled={false}
                    onChat={() => showPanel("chat")}
                    onHistory={() => showPanel("history")}
                    onFilter={toggleFilter}
                    onSave={() => activeEntry && void handleSave(activeEntry.id)}
                    onClear={handleNewChat}
                />
            )}
            {!configured && !landing && <ConfigNotice />}
            <div className="ap-body">{content}</div>
            {settings.footer.text && <Footer settings={settings.footer} />}
            {toast && (
                <div className={`ap-toast${toast.tone === "error" ? " ap-toast--error" : ""}`} role="status">
                    {toast.text}
                </div>
            )}
        </div>
    );
};

export default App;