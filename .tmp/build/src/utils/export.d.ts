import type { MapProperty, TableColumn, TableRow } from "../types";
export type SaveOutcome = "saved" | "requested" | "failed";
interface DownloadResultLike {
    downloadCompleted?: boolean;
}
export interface DownloadServiceLike {
    exportVisualsContentExtended?: (content: string, filename: string, fileType: string, description: string) => Promise<DownloadResultLike | boolean>;
    exportVisualsContent?: (content: string, filename: string, fileType: string, description: string) => Promise<boolean>;
}
export declare function toCsv(columns: TableColumn[], rows: TableRow[]): string;
export declare function saveCsv(service: DownloadServiceLike | undefined, filename: string, csv: string): Promise<SaveOutcome>;
export declare function savePng(service: DownloadServiceLike | undefined, filename: string, canvas: HTMLCanvasElement): Promise<SaveOutcome>;
export declare function renderTablePng(title: string, columns: TableColumn[], rows: TableRow[], accent: string): HTMLCanvasElement;
export declare function renderMapSnapshotPng(title: string, props: MapProperty[], subjectColor: string, nearbyColor: string): HTMLCanvasElement;
export {};
