import { App, MarkdownPostProcessorContext } from "obsidian";
import { Card } from "./Card";
import VocabularyView from "./main";
import { PageStats } from "./global";
import { CardList } from "./CardList";
import { createIdfromDate } from "./utils";

export class CardStat {
    id = "";

    constructor(public plugin: VocabularyView, public app: App, public el: HTMLElement, public ctx: MarkdownPostProcessorContext, public cardList: CardList) { }

    async initialize(): Promise<void> {
        // await this.plugin.loadStats();
        this.id = await this.resolveId();
        this.plugin.viewedIds.push(this.id);
    }

    async resolveId(): Promise<string> {
        // get section info lineStart, lineEnd, text (page content)
        const sectionInfo = this.ctx.getSectionInfo(this.el);

        if (!sectionInfo) {
            return "";
        }
        // get header
        const lines = sectionInfo.text.split('\n');
        const codeBlockHeader = lines[sectionInfo.lineStart] ?? '';
        // get attribute
        const match = /^`{3,}\S+\s+(.*)$/.exec(codeBlockHeader);
        let id: string;
        if (!match) {
            id = createIdfromDate();
            const file = this.app.vault.getFileByPath(this.ctx.sourcePath);
            if (!file) return ""
            await this.app.vault.process(file, (content) => {
                const newLines = lines.slice();// copy
                newLines[sectionInfo.lineStart] = newLines[sectionInfo.lineStart].trim() + ` id:${id}`;
                const newText = newLines.join('\n');
                return content.replace(sectionInfo.text, newText);
            });
        } else {
            id = match[1].trim();
        }
        return id
    }

    getStats(card: Card): [number, number] {
        const pageStats = this.plugin.stats[this.id];
        if (!pageStats) return [0, 0];
        const answer = pageStats[card.derivative];
        return answer ? [answer.r, answer.w] : [0, 0];
    }

    async cleanupSavedStats(): Promise<void> {
        const stats = this.plugin.stats
        if (!stats[this.id]) {
            return
        }

        const currentDerivatives = new Set(this.cardList.cards.map(card => card.derivative));
        const statsToKeep: PageStats = {};

        for (const [derivative, stat] of Object.entries(stats[this.id])) {
            if (currentDerivatives.has(derivative)) {
                statsToKeep[derivative] = stat;
            }
        }
        stats[this.id] = statsToKeep;
        const source = this.plugin.sourceFromLeaf
        await this.plugin.saveStats();// reintialize this.plugin.sourceFromLeaf !
        this.plugin.sourceFromLeaf = source
    }

    async rightAnswer(card: Card): Promise<void> {
        if (!this.plugin.stats[this.id]) {
            this.plugin.stats[this.id] = {};
        }
        const answer = this.plugin.stats[this.id][card.derivative] || { r: 0, w: 0 };

        if (answer.r < 5) {
            answer.r++;
        }

        answer.w = 0;
        card.setRight(answer.r);
        card.setWrong(answer.w);

        this.plugin.stats[this.id][card.derivative] = answer;
        await this.plugin.saveStats();
    }

    async wrongAnswer(card: Card): Promise<void> {
        if (!this.plugin.stats[this.ctx.sourcePath]) {
            this.plugin.stats[this.ctx.sourcePath] = {};
        }
        const answer = this.plugin.stats[this.ctx.sourcePath][card.derivative] || { r: 0, w: 0 };

        if (answer.w < 5) {
            answer.w++;
        }

        answer.r = 0;
        card.setRight(answer.r);
        card.setWrong(answer.w);

        this.plugin.stats[this.ctx.sourcePath][card.derivative] = answer;
        await this.plugin.saveStats();
    }
}