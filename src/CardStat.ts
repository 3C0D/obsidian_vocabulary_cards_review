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

    getStat(card: Card): [number, number] {
        const pageStats = this.stats[this.sourcePath];
        if (!pageStats) return [0, 0];
        const record = pageStats[card.derivative];
        return record ? [record.r, record.w] : [0, 0];
    }

    updateStat(card: Card): void {
        const stat = this.getStat(card);
        card.setRight(stat[0]);
        card.setWrong(stat[1]);
    }

    async rightAnswer(card: Card): Promise<void> {
        if (!this.stats[this.sourcePath]) {
            this.stats[this.sourcePath] = {};
        }
        if (!this.stats[this.sourcePath][card.derivative]) {
            this.stats[this.sourcePath][card.derivative] = { r: 0, w: 0 };
        }
        this.stats[this.sourcePath][card.derivative].r++;
        this.stats[this.sourcePath][card.derivative].w = 0;
        card.setWrong(this.stats[this.sourcePath][card.derivative].w);
        card.setRight(this.stats[this.sourcePath][card.derivative].r);
        await this.saveStats();
    }

    async wrongAnswer(card: Card): Promise<void> {
        if (!this.stats[this.sourcePath]) {
            this.stats[this.sourcePath] = {};
        }
        if (!this.stats[this.sourcePath][card.derivative]) {
            this.stats[this.sourcePath][card.derivative] = { r: 0, w: 0 };
        }
        this.stats[this.sourcePath][card.derivative].w++;
        this.stats[this.sourcePath][card.derivative].r = 0;
        card.setRight(this.stats[this.sourcePath][card.derivative].r);
        card.setWrong(this.stats[this.sourcePath][card.derivative].w);
        await this.saveStats();
    }
}