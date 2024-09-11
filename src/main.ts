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

// add a context menu
// command insert voca-card/voca-table at cursor position (avoid first line )

export default class VocabularyView extends Plugin {
    sourceFromLeaf = ""
    stats: Record<string, PageStats>
    viewedIds: string[] = []

    async onload() {
        this.registerMarkdownCodeBlockProcessor("voca-table", (source, el, ctx) => {
            this.app.workspace.onLayoutReady(async () => { await this.renderTable(source, el, ctx) })
        });

        this.registerMarkdownCodeBlockProcessor("voca-card", (source: string, el, ctx) =>
            this.app.workspace.onLayoutReady(async () => {
                await this.parseCardCodeBlock(source, el, ctx)
            })
        );
        await this.deleteUnusedKeys();
    }

    async loadStats(): Promise<void> {
        this.stats = await this.loadData() || {};
    }

    async saveStats(): Promise<void> {
        await this.saveData(this.stats);
    }

    async parseCardCodeBlock(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        await this.loadStats();
        // source is the text in the code block or the markdown page
        if (!ctx) {
           new Notice(i10n.noContext[userLang]);
            return}

        source = await getSource(this, source, el, ctx);

        if (!source) { // repeated code. do a function
            createEmpty(el);
            reloadEmptyButton(this, el, ctx);
            return;
        }

        //parse source & create cards
        const cardList = new CardList(this, source, ctx);
        // manage stats & getId
        const cardStat = new CardStat(this, this.app, el, ctx, cardList);
        await cardStat.initialize();
        await this.renderCard(cardStat, cardList, el, ctx);
    }

    async deleteUnusedKeys(): Promise<void> {
        return new Promise(() => {
            setTimeout(async () => {
                for (const key in this.stats) {
                    if (!this.viewedIds.includes(key)) {
                        if (this.stats.hasOwnProperty(key))
                            delete this.stats[key];
                    }
                }
                await this.saveStats();
            }, 3000);
        });
    }


    async renderCard(
        cardStat: CardStat,
        cardList: CardList,
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext,
        mode: 'next' | 'random' = 'random'
    ) {
        let card: Card | undefined;
        el.innerHTML = '';
        // exclude current card
        const remainingCards = cardList.cards.filter(c => c !== cardList.currentCard);

        if (mode === 'next') { //to see later. add a button or context menu
            const iterator = cardList[Symbol.iterator]();
            const result = iterator.next();
            card = result.value || remainingCards[0];
        } else {
            // weighted random selection based on stats
            card = getRandomCardWithWeight(remainingCards, cardStat);
        }

        cardList.currentCard = card;
        await this.renderSingleCard(card, cardList, cardStat, el, ctx);
    }

    async renderSingleCard(card: Card, cardList: CardList, cardStat: CardStat, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        el.innerHTML = '';

        if (!card) {
            createEmpty(el);
            reloadEmptyButton(this, el, ctx);
            return
        }

        
        const cardEl = el.createEl('div', { cls: "voca-card" });
        
        await cardStat.cleanupSavedStats();
        renderCardStats(this, cardEl, cardStat, card, cardList);
        
        if (this.sourceFromLeaf) {
            reloadButton(this, cardEl, cardList, cardStat, ctx);
        }

        renderCardContent(cardEl, card);

        renderCardButtons(cardEl, this, card, cardStat, cardList, el, ctx);
    }

    async renderTable(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        source = await getSource(this, source, el, ctx);
        if (!source) {
            createEmpty(el);
            reloadEmptyButton(this, el, ctx);
        }
        const cardList = new CardList(this, source, ctx);
        renderTableBody(this, cardList, el, ctx);
    }
}

