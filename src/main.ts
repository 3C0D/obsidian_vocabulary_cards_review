import { MarkdownPostProcessorContext, Notice, Plugin } from 'obsidian';
import "./styles.scss";
import { CardStat } from "./CardStat";
import { CardList } from "./CardList";
import { Card } from "./Card";
import { createEmpty, getRandomCardWithWeight, getSource, reloadEmptyButton } from './utils';
import { reloadButton, renderCardButtons, renderCardContent, renderCardStats } from './renderCardUtils';
import { renderTableBody } from './renderTable';
import { PageStats } from './global';
import { i10n, userLang } from './i10n';


// it's a mess between ext source and in source. so I will just keep ext source

// add a context menu ?
// add wikilinks to other page as ext source ! great idea !
// command insert voca-card/voca-table at cursor position (avoid first line )
// bug css don't reduce size menu immediatly
// add a system of notation in voca-table too. 5 red stars, 5 green stars. because it's faster to see in a table what words you already know. and then to turn it back to voca-card...


export default class VocabularyView extends Plugin {
    stats: Record<string, PageStats>
    viewedIds: string[] = []

    async onload() {
        this.registerCodeBlockProcessors();
        await this.deleteUnusedKeys();
    }

    private registerCodeBlockProcessors() {
        this.registerMarkdownCodeBlockProcessor("voca-table", async (source, el, ctx) => await this.renderTable(source, el, ctx));
        this.registerMarkdownCodeBlockProcessor("voca-card", async (source, el, ctx) => await this.parseCodeBlock(el, ctx));
    }

    async loadStats(): Promise<void> {
        this.stats = await this.loadData() || {};
    }

    async saveStats(): Promise<void> {
        await this.saveData(this.stats);
    }

    // source is source (in the code block) or the markdown page
    async parseCodeBlock(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        await this.loadStats();

        if (!ctx) {
            new Notice(i10n.noContext[userLang]);
            return
        }

        const contentAfter = await getSource(el, ctx);

        if (!contentAfter) {
            this.createEmptyCard(el, ctx);
            return;
        }

        //parse source & create cards
        const cardList = new CardList(this, contentAfter);
        // manage stats & getId
        const cardStat = new CardStat(this, this.app, el, ctx, cardList);
        await cardStat.initialize();
        await this.renderCard(this, cardStat, cardList, el, ctx, contentAfter);
    }

    private createEmptyCard(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        createEmpty(el);
        reloadEmptyButton(this, el, ctx);
    }

    async deleteUnusedKeys(): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(async () => {
                for (const key in this.stats) {
                    if (!this.viewedIds.includes(key) && this.stats.hasOwnProperty(key)) {
                        delete this.stats[key];
                    }
                }
                await this.saveStats();
                resolve();
            }, 3000);
        });
    }

    async renderCard(
        plugin: VocabularyView,
        cardStat: CardStat,
        cardList: CardList,
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext,
        source: string,
    ) {
        el.innerHTML = '';
        const card = this.selectCard(cardList, cardStat);
        if (!card) return
        cardList.currentCard = card;
        await this.renderSingleCard(plugin, card, cardList, cardStat, el, ctx, source);
    }

    private selectCard(cardList: CardList, cardStat: CardStat): Card | undefined {
        const remainingCards = cardList.cards.filter(c => c !== cardList.currentCard);
        if (!remainingCards.length) return;
        // weighted random selection based on stats
        return getRandomCardWithWeight(remainingCards, cardStat);
    }

    async renderSingleCard(plugin: VocabularyView, card: Card, cardList: CardList, cardStat: CardStat, el: HTMLElement, ctx: MarkdownPostProcessorContext, source: string) {
        el.innerHTML = '';

        const cardEl = el.createEl('div', { cls: "voca-card" });

        await cardStat.cleanupSavedStats();
        renderCardStats(cardEl, cardStat, card, cardList);

        reloadButton(plugin, cardEl, cardList, ctx, 'card' ,cardStat);

        renderCardContent(cardEl, card);
        renderCardButtons(plugin, cardEl, card, cardStat, cardList, el, ctx, source);
    }

    async renderTable(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        source = await getSource(el, ctx);
        if (!source) {
            el.innerHTML = '';
            createEmpty(el);
            reloadEmptyButton(this, el, ctx);
        }
        const cardList = new CardList(this, source);
        renderTableBody(this, cardList, el, ctx);
    }
}

