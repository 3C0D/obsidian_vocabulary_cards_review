import { Plugin } from "obsidian";
import { Card } from "./Card";

interface StatRecord {
    r: number;
    w: number;
}

export class CardStat {
    private stat: Record<string, StatRecord> = {};
    // private readonly file = '.voca_stat.json';

    constructor(private plugin: Plugin) {
        this.loadStat();
    }

    async loadStat(): Promise<void> {
        this.stat = await this.plugin.loadData() || {};
    }

    private async saveStat(): Promise<void> {
        await this.plugin.saveData(this.stat);
    }

    getStat(card: Card): [number, number] {
        const record = this.stat[card.derivative];
        return record ? [record.r, record.w] : [0, 0];
    }

    async rightAnswer(card: Card): Promise<void> {
        if (!this.stat[card.derivative]) {
            this.stat[card.derivative] = { r: 0, w: 0 };
        }
        this.stat[card.derivative].r++;
        this.stat[card.derivative].w = 0;
        card.setWrong(this.stat[card.derivative].w);
        card.setRight(this.stat[card.derivative].r);
        await this.saveStat();
    }


    async wrongAnswer(card: Card): Promise<void> {
        if (!this.stat[card.derivative]) {
            this.stat[card.derivative] = { r: 0, w: 0 };
        }
        this.stat[card.derivative].w++;
        this.stat[card.derivative].r = 0;
        card.setRight(this.stat[card.derivative].r);
        card.setWrong(this.stat[card.derivative].w);
        await this.saveStat();
    }
}
