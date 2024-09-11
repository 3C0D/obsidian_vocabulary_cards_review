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
// add shortcuts space make visible, right/left arows right/wrong
// command insert voca-card/voca-table at cursor position (avoid first line )
// bug css don't reduce size menu immediatly

export default class VocabularyView extends Plugin {
    // sourceFromLeaf = ""
    // The value of `sourceFromLeaf` is saved in localStorage to persist it after clicking the wrong/right button.
    // A simple class variable was lost. I could use a more advanced save function, to not just save stats, but it's not needed.
    // And it's a cool example of using `saveData(something)`.
    stats: Record<string, PageStats>
    viewedIds: string[] = []

    async onload() {
        this.registerCodeBlockProcessors();
        await this.deleteUnusedKeys();
    }

    private registerCodeBlockProcessors() {
        
        this.registerMarkdownCodeBlockProcessor("voca-table", this.renderTable.bind(this));
        this.registerMarkdownCodeBlockProcessor("voca-card", this.parseCardCodeBlock.bind(this));
    }
    
    async loadStats(): Promise<void> {
        this.stats = await this.loadData() || {};
    }

    async saveStats(): Promise<void> {
        await this.saveData(this.stats);
    }

    get sourceFromLeaf(): string {
        return localStorage.getItem('sourceFromLeaf') || "";
    }

    set sourceFromLeaf(value: string) {
        localStorage.setItem('sourceFromLeaf', value);
    }

    // source is source (in the code block) or the markdown page
    async parseCardCodeBlock(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        await this.loadStats();

        if (!ctx) {
           new Notice(i10n.noContext[userLang]);
            return}

        source = await getSource(this, source, el, ctx);

        if (!source) { // repeated code. do a function
            this.createEmptyCard(el, ctx);
            return;
        }

        //parse source & create cards
        const cardList = new CardList(this, source, ctx);
        // manage stats & getId
        const cardStat = new CardStat(this, this.app, el, ctx, cardList);
        await cardStat.initialize();
        await this.renderCard(cardStat, cardList, el, ctx);
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
        cardStat: CardStat,
        cardList: CardList,
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext,
        mode: 'next' | 'random' = 'random'
    ) {
        el.innerHTML = '';
        const card = this.selectCard(cardList, cardStat, mode);
        if (!card) return
        cardList.currentCard = card;
        await this.renderSingleCard(card, cardList, cardStat, el, ctx);
    }

    private selectCard(cardList: CardList, cardStat: CardStat, mode: 'next' | 'random'): Card | undefined {
        const remainingCards = cardList.cards.filter(c => c !== cardList.currentCard);

        if (!remainingCards.length) return;

        if (mode === 'next') {
            const iterator = cardList[Symbol.iterator]();
            const result = iterator.next();
            return result.value || remainingCards[0];
        } else {
            // weighted random selection based on stats
            return getRandomCardWithWeight(remainingCards, cardStat);
        }
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
            this.createEmptyCard(el, ctx);
            return;
        }
        const cardList = new CardList(this, source, ctx);
        renderTableBody(this, cardList, el, ctx);
    }
}

