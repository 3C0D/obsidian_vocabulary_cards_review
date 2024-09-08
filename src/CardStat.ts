import { MarkdownPostProcessorContext, Plugin } from "obsidian";
import { Card } from "./Card";

export interface StatRecord {
    r: number;
    w: number;
}

export interface PageStats {
    [derivative: string]: StatRecord;
}

export class CardStat {
    public stats: Record<string, PageStats> = {};
    sourcePath: string;

    constructor(private plugin: Plugin, ctx: MarkdownPostProcessorContext) {
        this.loadStats();
        this.sourcePath = ctx.sourcePath
    }

    async loadStats(): Promise<void> {
        this.stats = await this.plugin.loadData() || {};
    }

    async saveStats(): Promise<void> {
        await this.plugin.saveData(this.stats);
    }

    getStats(card: Card): [number, number] {
        const pageStats = this.stats[this.sourcePath];
        if (!pageStats) return [0, 0];
        const record = pageStats[card.derivative];
        return record ? [record.r, record.w] : [0, 0];
    }

    async rightAnswer(card: Card): Promise<void> {
        if (!this.stats[this.sourcePath]) {
            this.stats[this.sourcePath] = {};
        }
        const record = this.stats[this.sourcePath][card.derivative] || { r: 0, w: 0 };

        if (record.r < 5) {
            record.r++;
        }

        record.w = 0;
        card.setRight(record.r);
        card.setWrong(record.w);

        this.stats[this.sourcePath][card.derivative] = record;
        await this.saveStats();
    }

    async wrongAnswer(card: Card): Promise<void> {
        if (!this.stats[this.sourcePath]) {
            this.stats[this.sourcePath] = {};
        }
        const record = this.stats[this.sourcePath][card.derivative] || { r: 0, w: 0 };

        if (record.w < 5) {
            record.w++;
        }

        record.r = 0;
        card.setRight(record.r);
        card.setWrong(record.w);

        this.stats[this.sourcePath][card.derivative] = record;
        await this.saveStats();
    }
}