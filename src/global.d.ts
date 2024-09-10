export interface StatRecord {
    r: number;
    w: number;
}

export interface PageStats {
    [derivative: string]: StatRecord;
}