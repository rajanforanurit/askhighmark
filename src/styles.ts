export const STYLES = `
.ap-root{--ap-accent:#2a5bd7;--ap-accent-soft:rgba(42,91,215,.1);--ap-accent-strong:#1e47b0;--ap-ink:#0b1220;--ap-muted:#64748b;--ap-line:#e5e7eb;--ap-surface:#ffffff;--ap-bg:#f6f7fa;--ap-danger:#b42318;--ap-ok:#067647;--ap-radius:10px;
position:relative;display:flex;flex-direction:column;overflow:hidden;color:var(--ap-ink);background:var(--ap-bg);font-family:"Segoe UI Variable Text","Segoe UI",system-ui,-apple-system,"Helvetica Neue",Arial,sans-serif;font-size:13px;line-height:1.45;box-sizing:border-box}
.ap-root *,.ap-root *::before,.ap-root *::after{box-sizing:border-box}
.ap-root button{font-family:inherit;font-size:inherit;color:inherit;cursor:pointer}
.ap-root button:disabled{cursor:default;opacity:.5}
.ap-root :focus-visible{outline:2px solid var(--ap-accent);outline-offset:2px;border-radius:6px}
.ap-header{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-shrink:0;border-bottom:1px solid var(--ap-line)}
.ap-brand{display:flex;align-items:center;gap:10px;min-width:0}
.ap-logo{width:26px;height:26px;border-radius:8px;background:var(--ap-ink);color:#fff;display:grid;place-items:center;font-weight:700;font-size:12px;letter-spacing:.02em;flex-shrink:0}
.ap-brand-text{min-width:0}
.ap-brand-title{font-weight:650;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ap-brand-sub{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ap-header-actions{display:flex;align-items:center;gap:6px;flex-shrink:0}
.ap-btn{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 11px;border:1px solid var(--ap-line);background:var(--ap-surface);border-radius:8px;font-weight:550;transition:background .15s,border-color .15s,box-shadow .15s}
.ap-btn:hover:not(:disabled){background:#f3f5f9;border-color:#cfd6e2}
.ap-btn--primary{background:var(--ap-accent);border-color:var(--ap-accent);color:#fff}
.ap-btn--primary:hover:not(:disabled){background:var(--ap-accent-strong);border-color:var(--ap-accent-strong)}
.ap-btn--ghost{border-color:transparent;background:transparent}
.ap-btn--active{background:var(--ap-accent-soft);border-color:transparent;color:var(--ap-accent-strong)}
.ap-badge{min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:var(--ap-accent);color:#fff;font-size:11px;font-weight:650;display:inline-grid;place-items:center}
.ap-icon-btn{width:30px;height:30px;padding:0;justify-content:center}
.ap-body{flex:1;min-height:0;display:flex;position:relative}
.ap-landing{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px 20px 16px;text-align:center;background:radial-gradient(120% 80% at 50% 0%,#ffffff 0%,var(--ap-bg) 70%)}
.ap-landing-inner{width:100%;max-width:640px;display:flex;flex-direction:column;align-items:center;gap:10px}
.ap-mascot{display:block;object-fit:contain;animation:ap-float 4s ease-in-out infinite}
.ap-greeting{margin:0;font-size:26px;letter-spacing:-.02em;font-weight:680}
.ap-welcome{margin:0;font-size:15px;font-weight:600;color:var(--ap-accent-strong)}
.ap-tagline{margin:0;color:var(--ap-muted);max-width:420px}
.ap-cards{display:grid;gap:8px;width:100%;margin-top:6px}
.ap-card-btn{display:flex;align-items:center;gap:10px;text-align:left;padding:10px 12px;border:1px solid var(--ap-line);background:var(--ap-surface);border-radius:12px;transition:transform .15s,border-color .15s,box-shadow .15s}
.ap-card-btn:hover:not(:disabled){border-color:var(--ap-accent);box-shadow:0 4px 14px rgba(42,91,215,.12);transform:translateY(-1px)}
.ap-card-ico{width:28px;height:28px;border-radius:8px;background:var(--ap-accent-soft);color:var(--ap-accent-strong);display:grid;place-items:center;flex-shrink:0}
.ap-card-title{font-weight:600;display:block}
.ap-card-desc{color:var(--ap-muted);font-size:11.5px;display:block}
.ap-landing-input{width:100%;max-width:560px;margin-top:8px}
.ap-chat{display:flex;flex-direction:column;min-height:0;background:var(--ap-surface);border-right:1px solid var(--ap-line);flex-shrink:0}
.ap-chat-top{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid var(--ap-line);font-weight:600}
.ap-chat-scroll{flex:1;min-height:0;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px}
.ap-msg{display:flex;flex-direction:column;gap:6px;max-width:100%}
.ap-msg--user{align-items:flex-end}
.ap-bubble{padding:8px 11px;white-space:pre-wrap;word-break:break-word;max-width:94%}
.ap-msg-ai{width:100%;text-align:left;border:1px solid var(--ap-line);background:#fff;border-radius:12px;padding:9px 11px;transition:border-color .15s,background .15s}
.ap-msg-ai--active{border-color:var(--ap-accent);background:var(--ap-accent-soft)}
.ap-msg-ai--error{border-color:#f4c7c3;background:#fef3f2}
.ap-msg-text{white-space:pre-wrap;word-break:break-word}
.ap-msg-meta{display:flex;align-items:center;gap:6px;margin-top:6px;color:var(--ap-muted);font-size:11.5px;flex-wrap:wrap}
.ap-chips{display:flex;flex-wrap:wrap;gap:6px}
.ap-chip{border:1px solid var(--ap-line);background:#fff;border-radius:999px;padding:4px 10px;font-size:12px;transition:border-color .15s,background .15s}
.ap-chip:hover:not(:disabled){border-color:var(--ap-accent);background:var(--ap-accent-soft)}
.ap-composer{padding:10px 12px 12px;border-top:1px solid var(--ap-line);display:flex;flex-direction:column;gap:8px}
.ap-input-row{display:flex;align-items:center;gap:8px;border:1px solid var(--ap-line);background:#fff;transition:border-color .15s,box-shadow .15s}
.ap-input-row:focus-within{border-color:var(--ap-accent);box-shadow:0 0 0 3px var(--ap-accent-soft)}
.ap-input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:inherit;color:var(--ap-ink);padding:0 4px}
.ap-input::placeholder{color:#94a3b8}
.ap-send{border:0;display:grid;place-items:center;flex-shrink:0;transition:background .15s}
.ap-work{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;position:relative;background:var(--ap-bg)}
.ap-toolbar{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;border-bottom:1px solid var(--ap-line);background:var(--ap-surface);flex-shrink:0;flex-wrap:wrap}
.ap-toolbar-group{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.ap-work-scroll{flex:1;min-height:0;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:12px}
.ap-panel{background:var(--ap-surface);border:1px solid var(--ap-line);border-radius:12px;overflow:hidden}
.ap-panel-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 12px;border-bottom:1px solid var(--ap-line);font-weight:600}
.ap-insight{padding:12px 14px;display:flex;flex-direction:column;gap:8px}
.ap-insight-text{margin:0;font-size:14px;white-space:pre-wrap}
.ap-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px}
.ap-kpi{padding:9px 11px;border:1px solid var(--ap-line);border-radius:10px;background:#fbfcfe}
.ap-kpi-val{font-size:19px;font-weight:680;letter-spacing:-.02em;line-height:1.2}
.ap-kpi-label{color:var(--ap-muted);font-size:11.5px}
.ap-map-wrap{position:relative;height:340px;min-height:220px;background:#eef1f6}
.ap-map{position:absolute;inset:0}
.ap-map-msg{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;padding:16px;color:var(--ap-muted)}
.ap-pin{display:inline-flex;align-items:center;gap:5px;padding:3px 8px 3px 5px;border-radius:999px;background:#fff;border:1.5px solid var(--ap-ink);box-shadow:0 2px 6px rgba(11,18,32,.25);font:600 11px "Segoe UI",system-ui,sans-serif;color:#0b1220;transform:translateY(0);transition:transform .15s,box-shadow .15s;white-space:nowrap}
.ap-pin-dot{width:9px;height:9px;border-radius:50%;background:var(--pin,#0b1220);flex-shrink:0}
.ap-pin--subject{padding:4px 10px 4px 6px;background:var(--pin,#2a5bd7);border-color:#fff;color:#fff;font-size:12px}
.ap-pin--subject .ap-pin-dot{background:#fff}
.ap-pin--selected{transform:translateY(-3px) scale(1.08);box-shadow:0 6px 14px rgba(11,18,32,.35);border-color:var(--pin,#2a5bd7)}
.ap-info{position:absolute;left:12px;bottom:12px;width:min(280px,calc(100% - 24px));background:rgba(255,255,255,.96);backdrop-filter:blur(8px);border:1px solid var(--ap-line);border-radius:12px;box-shadow:0 10px 30px rgba(11,18,32,.16);padding:12px;animation:ap-rise .18s ease-out}
.ap-info-title{font-weight:650;margin-right:22px}
.ap-info-sub{color:var(--ap-muted);font-size:11.5px}
.ap-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 12px;margin-top:10px}
.ap-info-k{color:var(--ap-muted);font-size:11px}
.ap-info-v{font-weight:600}
.ap-info-close{position:absolute;top:6px;right:6px}
.ap-table-wrap{overflow:auto;max-height:340px}
.ap-table{border-collapse:separate;border-spacing:0;width:100%;min-width:max-content}
.ap-table{font-size:var(--ap-table-fs,12px);color:var(--ap-table-text,#0b1220)}
.ap-table th{position:sticky;top:0;z-index:1;text-align:left;font-weight:600;padding:8px 12px;white-space:nowrap;background:var(--ap-head-bg,#f3f5f9);color:var(--ap-head-text,#475569);border-bottom:1px solid var(--ap-table-line,#e5e7eb);user-select:none}
.ap-table th button{display:inline-flex;align-items:center;gap:4px;border:0;background:transparent;padding:0;font-weight:600}
.ap-table td{padding:8px 12px;border-bottom:1px solid var(--ap-table-line,#e5e7eb);white-space:nowrap}
.ap-table tbody tr{background:var(--ap-row-bg,#fff)}
.ap-table tbody tr:nth-child(even){background:var(--ap-row-alt,#fafbfd)}
.ap-table td.ap-num,.ap-table th.ap-num{text-align:right}
.ap-table tbody tr{cursor:pointer;transition:background .12s}
.ap-table tbody tr:hover{background:var(--ap-accent-soft)}
.ap-table tbody tr[aria-selected="true"]{background:var(--ap-accent-soft);box-shadow:inset 3px 0 0 var(--ap-accent)}
.ap-tag{display:inline-block;padding:1px 7px;border-radius:999px;background:var(--ap-accent);color:#fff;font-size:10.5px;font-weight:600;margin-left:6px}
.ap-delta{display:block;font-size:10.5px;font-weight:600}
.ap-delta--up{color:var(--ap-ok)}
.ap-delta--down{color:var(--ap-danger)}
.ap-seg{display:inline-flex;border:1px solid var(--ap-line);border-radius:8px;overflow:hidden}
.ap-seg button{border:0;background:#fff;padding:4px 10px;font-weight:550}
.ap-seg button[aria-pressed="true"]{background:var(--ap-accent-soft);color:var(--ap-accent-strong)}
.ap-drawer{position:absolute;top:0;right:0;bottom:0;width:min(340px,100%);background:rgba(255,255,255,.97);backdrop-filter:blur(10px);border-left:1px solid var(--ap-line);box-shadow:-12px 0 32px rgba(11,18,32,.12);z-index:5;display:flex;flex-direction:column;animation:ap-slide .2s ease-out}
.ap-drawer-head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--ap-line)}
.ap-drawer-title{font-weight:680;letter-spacing:.01em}
.ap-drawer-sub{color:var(--ap-muted);font-size:11.5px}
.ap-drawer-body{flex:1;min-height:0;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:14px}
.ap-drawer-foot{padding:10px 14px;border-top:1px solid var(--ap-line);display:flex;justify-content:space-between;align-items:center}
.ap-field{display:flex;flex-direction:column;gap:6px}
.ap-field-label{font-weight:600;font-size:12px}
.ap-select,.ap-num-input{height:32px;border:1px solid var(--ap-line);border-radius:8px;background:#fff;padding:0 8px;font:inherit;color:var(--ap-ink);width:100%}
.ap-select:disabled,.ap-num-input:disabled{background:#f3f5f9;color:#94a3b8}
.ap-check{display:flex;align-items:center;gap:8px;padding:2px 0}
.ap-check input{accent-color:var(--ap-accent);width:15px;height:15px}
.ap-range{position:relative;height:22px}
.ap-range-track{position:absolute;left:0;right:0;top:9px;height:4px;border-radius:2px;background:var(--ap-line)}
.ap-range-fill{position:absolute;top:9px;height:4px;border-radius:2px;background:var(--ap-accent)}
.ap-range input[type=range]{position:absolute;left:0;top:0;width:100%;height:22px;margin:0;background:transparent;pointer-events:none;-webkit-appearance:none;appearance:none}
.ap-range input[type=range]::-webkit-slider-thumb{pointer-events:auto;-webkit-appearance:none;appearance:none;width:16px;height:16px;border-radius:50%;background:#fff;border:2px solid var(--ap-accent);cursor:grab;box-shadow:0 1px 3px rgba(11,18,32,.3)}
.ap-range input[type=range]::-moz-range-thumb{pointer-events:auto;width:12px;height:12px;border-radius:50%;background:#fff;border:2px solid var(--ap-accent);cursor:grab}
.ap-range input[type=range]:focus-visible{outline:none}
.ap-range input[type=range]:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 3px var(--ap-accent-soft)}
.ap-range-vals{display:grid;grid-template-columns:1fr auto 1fr;gap:6px;align-items:center;color:var(--ap-muted)}
.ap-state{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;padding:24px;color:var(--ap-muted)}
.ap-state-title{color:var(--ap-ink);font-weight:650;font-size:15px}
.ap-state--error .ap-state-title{color:var(--ap-danger)}
.ap-think{display:flex;flex-direction:column;align-items:center;gap:10px;padding:18px 12px}
.ap-think-track{position:relative;width:min(240px,80%);height:64px;overflow:hidden}
.ap-think-ground{position:absolute;left:0;right:0;bottom:4px;height:2px;background:linear-gradient(90deg,transparent,var(--ap-line),transparent)}
.ap-think-runner{position:absolute;bottom:6px;left:0;animation:ap-run 3.2s linear infinite}
.ap-think-runner img{display:block;animation:ap-bob .5s ease-in-out infinite}
.ap-think-text{color:var(--ap-muted);font-weight:550}
.ap-dots::after{content:"";animation:ap-dots 1.4s steps(4,end) infinite}
.ap-toast{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);background:var(--ap-ink);color:#fff;padding:8px 14px;border-radius:10px;z-index:20;max-width:90%;animation:ap-rise .18s ease-out;box-shadow:0 8px 24px rgba(11,18,32,.3)}
.ap-toast--error{background:var(--ap-danger)}
.ap-notice{margin:12px;padding:12px 14px;border:1px solid #f1d9a7;background:#fffaf0;border-radius:12px;display:flex;flex-direction:column;gap:6px;text-align:left}
.ap-notice-title{font-weight:650}
.ap-conn{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ap-tabs{display:flex;border-bottom:1px solid var(--ap-line);background:#fff;flex-shrink:0}
.ap-tabs button{flex:1;border:0;background:transparent;padding:9px;font-weight:600;color:var(--ap-muted);border-bottom:2px solid transparent}
.ap-tabs button[aria-selected="true"]{color:var(--ap-accent-strong);border-bottom-color:var(--ap-accent)}
.ap-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.ap-tip{position:relative}
.ap-tip::after{content:attr(data-tip);position:absolute;top:calc(100% + 6px);left:50%;transform:translateX(-50%) translateY(-2px);background:var(--ap-ink);color:#fff;font-size:11px;font-weight:500;padding:4px 8px;border-radius:6px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .12s,transform .12s;z-index:30}
.ap-tip:hover::after,.ap-tip:focus-visible::after{opacity:1;transform:translateX(-50%) translateY(0)}
.ap-header .ap-tip::after,.ap-toolbar .ap-tip:last-child::after{left:auto;right:0;transform:translateY(-2px)}
.ap-header .ap-tip:hover::after,.ap-toolbar .ap-tip:last-child:hover::after{transform:translateY(0)}
@keyframes ap-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes ap-run{0%{transform:translateX(-60px)}100%{transform:translateX(260px)}}
@keyframes ap-bob{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-6px) rotate(2deg)}}
@keyframes ap-dots{0%{content:""}25%{content:"."}50%{content:".."}75%,100%{content:"..."}}
@keyframes ap-rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes ap-slide{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
@media (prefers-reduced-motion:reduce){.ap-root *,.ap-root *::before,.ap-root *::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}}
`;
