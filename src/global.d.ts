export interface StatRecord {
    r: number;
    w: number;
}

export interface PageStats {
    [derivative: string]: StatRecord;
}

export interface SectionInfo {
    lineStart: number;
    lineEnd: number;
    text: string;
}

export interface Settings {
    stats: Record<string, PageStats>;
    showTime: number;
    explainTime: number;
    disableConfirmationButtons: boolean;
}