import type { MapProperty, TableColumn, TableRow } from "../types";
import { formatValue } from "./format";

export type SaveOutcome = "saved" | "requested" | "failed";

interface DownloadResultLike {
    downloadCompleted?: boolean;
}

export interface DownloadServiceLike {
    exportVisualsContentExtended?: (
        content: string,
        filename: string,
        fileType: string,
        description: string,
    ) => Promise<DownloadResultLike | boolean>;
    exportVisualsContent?: (
        content: string,
        filename: string,
        fileType: string,
        description: string,
    ) => Promise<boolean>;
}

function escapeCell(value: unknown): string {
    if (value === null || value === undefined) return "";
    const text = typeof value === "object" ? JSON.stringify(value) : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(columns: TableColumn[], rows: TableRow[]): string {
    const header = columns.map(c => escapeCell(c.label)).join(",");
    const lines = rows.map(r => columns.map(c => escapeCell(r.values[c.key])).join(","));
    return [header, ...lines].join("\r\n");
}

async function viaService(
    service: DownloadServiceLike | undefined,
    content: string,
    filename: string,
    fileType: string,
    description: string,
): Promise<boolean | null> {
    if (!service) return null;
    try {
        if (service.exportVisualsContentExtended) {
            const res = await service.exportVisualsContentExtended(content, filename, fileType, description);
            if (typeof res === "boolean") return res;
            return res?.downloadCompleted === true;
        }
        if (service.exportVisualsContent) {
            return await service.exportVisualsContent(content, filename, fileType, description);
        }
    } catch {
        return null;
    }
    return null;
}

function viaAnchor(blob: Blob, filename: string): boolean {
    try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        return true;
    } catch {
        return false;
    }
}

export async function saveCsv(
    service: DownloadServiceLike | undefined,
    filename: string,
    csv: string,
): Promise<SaveOutcome> {
    const viaHost = await viaService(service, csv, filename, "csv", "CSV file");
    if (viaHost === true) return "saved";
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
    return viaAnchor(blob, filename) ? "requested" : "failed";
}

export async function savePng(
    service: DownloadServiceLike | undefined,
    filename: string,
    canvas: HTMLCanvasElement,
): Promise<SaveOutcome> {
    let dataUrl: string;
    try {
        dataUrl = canvas.toDataURL("image/png");
    } catch {
        return "failed";
    }
    const base64 = dataUrl.split(",")[1] ?? "";
    const viaHost = await viaService(service, base64, filename, "base64", "PNG image");
    if (viaHost === true) return "saved";
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i += 1) arr[i] = bytes.charCodeAt(i);
    const blob = new Blob([arr], { type: "image/png" });
    return viaAnchor(blob, filename) ? "requested" : "failed";
}

const INK = "#0b1220";
const MUTED = "#64748b";
const LINE = "#e5e7eb";

function createCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.scale(scale, scale);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    return { canvas, ctx };
}

const FONT = "Segoe UI, Helvetica, Arial, sans-serif";

export function renderTablePng(title: string, columns: TableColumn[], rows: TableRow[], accent: string): HTMLCanvasElement {
    const limited = rows.slice(0, 40);
    const measure = createCanvas(10, 10).ctx;
    measure.font = `12px ${FONT}`;
    const widths = columns.map(c => {
        const header = measure.measureText(c.label).width;
        const body = limited.reduce(
            (m, r) => Math.max(m, measure.measureText(formatValue(r.values[c.key], c.type)).width),
            0,
        );
        return Math.min(240, Math.max(header, body) + 28);
    });
    const width = Math.max(480, widths.reduce((a, b) => a + b, 0) + 40);
    const rowH = 30;
    const height = 92 + rowH * (limited.length + 1) + 24;
    const { canvas, ctx } = createCanvas(width, height);

    ctx.fillStyle = INK;
    ctx.font = `600 16px ${FONT}`;
    ctx.fillText(title, 20, 34);
    ctx.fillStyle = MUTED;
    ctx.font = `11px ${FONT}`;
    ctx.fillText(`AskProp Data  |  ${new Date().toLocaleString()}`, 20, 54);

    let y = 72;
    ctx.fillStyle = "#f3f5f9";
    ctx.fillRect(20, y, width - 40, rowH);
    let x = 20;
    ctx.fillStyle = "#475569";
    ctx.font = `600 11px ${FONT}`;
    columns.forEach((c, i) => {
        ctx.fillText(c.label, x + 10, y + 19);
        x += widths[i];
    });
    y += rowH;
    ctx.font = `12px ${FONT}`;
    limited.forEach(r => {
        if (r.isSubject) {
            ctx.fillStyle = `${accent}1a`;
            ctx.fillRect(20, y, width - 40, rowH);
        }
        ctx.strokeStyle = LINE;
        ctx.beginPath();
        ctx.moveTo(20, y + rowH);
        ctx.lineTo(width - 20, y + rowH);
        ctx.stroke();
        ctx.fillStyle = INK;
        let cx = 20;
        columns.forEach((c, i) => {
            const text = formatValue(r.values[c.key], c.type);
            let out = text;
            while (out.length > 3 && ctx.measureText(out).width > widths[i] - 16) out = `${out.slice(0, -2)}…`;
            ctx.fillText(out, cx + 10, y + 19);
            cx += widths[i];
        });
        y += rowH;
    });
    return canvas;
}

export function renderMapSnapshotPng(
    title: string,
    props: MapProperty[],
    subjectColor: string,
    nearbyColor: string,
): HTMLCanvasElement {
    const width = 900;
    const height = 560;
    const { canvas, ctx } = createCanvas(width, height);
    ctx.fillStyle = "#eef1f6";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#dde3ec";
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= width; gx += 60) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
    }
    for (let gy = 0; gy <= height; gy += 60) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
    }

    if (props.length > 0) {
        const meanLat = props.reduce((a, p) => a + p.lat, 0) / props.length;
        const kx = Math.cos((meanLat * Math.PI) / 180);
        const xs = props.map(p => p.lng * kx);
        const ys = props.map(p => p.lat);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const spanX = maxX - minX || 0.01;
        const spanY = maxY - minY || 0.01;
        const pad = 90;
        const scale = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY);
        const offX = (width - spanX * scale) / 2;
        const offY = (height - spanY * scale) / 2;
        const pos = props.map((p, i) => ({
            p,
            x: offX + (xs[i] - minX) * scale,
            y: height - (offY + (ys[i] - minY) * scale),
        }));
        const subject = pos.find(o => o.p.isSubject);
        if (subject) {
            ctx.strokeStyle = "#8b97ab";
            ctx.setLineDash([5, 4]);
            pos.filter(o => !o.p.isSubject).forEach(o => {
                ctx.beginPath();
                ctx.moveTo(subject.x, subject.y);
                ctx.lineTo(o.x, o.y);
                ctx.stroke();
            });
            ctx.setLineDash([]);
        }
        pos.forEach(o => {
            ctx.fillStyle = o.p.isSubject ? subjectColor : nearbyColor;
            ctx.beginPath();
            ctx.arc(o.x, o.y, o.p.isSubject ? 11 : 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = INK;
            ctx.font = `${o.p.isSubject ? 600 : 500} 12px ${FONT}`;
            ctx.fillText(o.p.name, o.x + 15, o.y + 4);
        });
    }

    ctx.fillStyle = "#ffffffdd";
    ctx.fillRect(16, 16, 360, 52);
    ctx.fillStyle = INK;
    ctx.font = `600 15px ${FONT}`;
    ctx.fillText(title, 28, 38);
    ctx.fillStyle = MUTED;
    ctx.font = `11px ${FONT}`;
    ctx.fillText("Property positions only. Basemap tiles are not included.", 28, 56);
    return canvas;
}
