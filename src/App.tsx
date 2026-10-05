import * as React from "react";
import type { VisualSettings } from "./settings";
import {
    ApiError, askAI, compareProperties, compareWithNearest, describeError, fetchFinancials, isConfigured,
    saveResponse, searchProperties, warmUp,
    type BackendConfig, type FinancialPeriod, type FinancialsPayload,
} from "./api";
import { STYLES } from "./styles";
import type { ChatEntry, FilterState, Phase, ToastMessage } from "./types";
import { buildOptions, countActive, createDefaultFilters, toPayload } from "./utils/filters";
import { fromAsk, fromNearest } from "./utils/normalize";
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

    const inputRef = React.useRef<HTMLInputElement>(null);
    const sessionRef = React.useRef(0);
    const savingRef = React.useRef<Set<string>>(new Set());
    const toastTimer = React.useRef<number | undefined>(undefined);

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

    React.useEffect(() => () => window.clearTimeout(toastTimer.current), []);

    React.useEffect(() => {
        if (configured) warmUp(config);
    }, [configured, config]);

    const loadFinancials = React.useCallback(
        async (keys: string[], view: "actual" | "budget", period: FinancialPeriod | null): Promise<FinancialsPayload> => {
            const options = { view, yearMonthFrom: period?.year_month_from, yearMonthTo: period?.year_month_to };
            if (keys.length === 1) return fetchFinancials(config, keys[0], options);
            const response = await compareProperties(config, keys, options);
            if (!response.financials) throw new ApiError("server");
            return response.financials;
        },
        [config],
    );

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

    const appendAi = (entry: Omit<ChatEntry, "id" | "role">) => {
        const id = nextId();
        setEntries(prev => [...prev, { ...entry, id, role: "ai" }]);
        setActiveId(id);
        setTab("analysis");
    };

    const appendFailure = (err: unknown, retry: ChatEntry["retry"]) => {
        console.warn("[AskHighmark] request failed:", err instanceof ApiError ? err.kind : "unexpected");
        appendAi({ text: describeError(err), isError: true, retry });
    };

    const runAsk = async (query: string) => {
        const session = sessionRef.current;
        setPhase("analyzing");
        try {
            const result = await askAI(config, query, toPayload(filters, options));
            if (session !== sessionRef.current) return;
            if (!result || typeof result !== "object") throw new ApiError("invalid");
            const analysis = fromAsk(result);
            appendAi({ text: analysis.answer, query, result: analysis, saveState: "idle" });
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
            const found = await compareWithNearest(config, search.results[0].PropertyBizKey, 5);
            if (session !== sessionRef.current) return;
            if (!found || !found.target || !Array.isArray(found.nearby)) throw new ApiError("invalid");
            const answer = `Here's ${found.target.PropertyName} and its ${found.nearby.length} nearest properties.`;
            const analysis = fromNearest(found.target, found.nearby, found.comparison, answer, found);
            appendAi({ text: answer, query: `Nearby properties for ${name}`, result: analysis, saveState: "idle" });
        } catch (err) {
            if (session === sessionRef.current) appendFailure(err, { type: "nearby", text: name });
        } finally {
            if (session === sessionRef.current) setPhase("idle");
        }
    };

    const handleSend = () => {
        const text = inputValue.trim();
        if (!text || busy) return;
        if (!configured) {
            notify(UNAVAILABLE_TEXT, "error");
            return;
        }
        appendUser(text);
        setInputValue("");
        if (nearbyPending) {
            setNearbyPending(false);
            void runNearby(text);
        } else {
            void runAsk(text);
        }
    };

    const handleRetry = (entry: ChatEntry) => {
        if (!entry.retry || busy) return;
        if (entry.retry.type === "nearby") void runNearby(entry.retry.text);
        else void runAsk(entry.retry.text);
    };

    const handleQuickAction = (action: QuickAction) => {
        if (action.id === "find-nearby") {
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
        setEntries([]);
        setActiveId(null);
        setInputValue("");
        setNearbyPending(false);
        setPhase("idle");
        setFilters(createDefaultFilters());
        setFilterOpen(false);
        setPanel("chat");
        setTab("chat");
    };

    const showPanel = (next: PanelView) => {
        setPanel(next);
        if (compact) setTab("chat");
    };

    const toggleFilter = () => {
        setFilterOpen(open => !open);
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
                response: { answer: entry.result.answer, result: entry.result.raw },
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
        && activeSaveState !== "saving" && activeSaveState !== "saved";

    const subjectName = (() => {
        const r = activeResult;
        if (!r || !r.subjectKey) return null;
        const row = r.rows.find(x => x.key === r.subjectKey);
        return row ? String(row.values.PropertyName ?? "") || null : null;
    })();

    const suggestions = subjectName
        ? [`Compare rents for ${subjectName}`, `Check occupancy for ${subjectName}`, `Give me an overview of ${subjectName}`]
        : ["Draw a map of ", "Compare ", "Give me an overview of "];

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
    const placeholder = nearbyPending ? "Type a property name…" : landing ? "Ask anything about your portfolio" : "Ask Highmark…";

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