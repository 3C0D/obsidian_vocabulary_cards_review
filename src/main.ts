import { MarkdownPostProcessorContext, Menu, Notice, Plugin } from 'obsidian';
import "./styles.scss";
import { CardStat } from "./CardStat";
import { CardList } from "./CardList";
import { Card } from "./Card";
import { cleanStats, createEmpty, getRandomCardWithWeight, getSource } from './utils';
import { reloadButton, renderCardButtons, renderCardContent, renderCardStats } from './renderCardUtils';
import { renderTableBody } from './renderTable';
import { PageStats } from './global';
import { i10n, userLang } from './i10n';

// ajouter mode next/random & invert word translation (complex) ?

export default class VocabularyView extends Plugin {
    stats: Record<string, PageStats>
    viewedIds: string[] = []

    async onload() {
        this.registerMarkdownCodeBlockProcessor("voca-table", async (source, el, ctx) => {
            await this.renderTable(source, el, ctx)
            el.addEventListener("contextmenu", this.handleContextMenu.bind(this));
        })
        this.registerMarkdownCodeBlockProcessor("voca-card", async (source, el, ctx) => {
            await this.parseCodeBlock(el, ctx)
            el.addEventListener("contextmenu", this.handleContextMenu.bind(this));
        })
    }

    handleContextMenu(event: MouseEvent) {
        event.preventDefault();
        const menu = new Menu();
        menu.addItem((item) =>
            item
                .setTitle("Clean up old stats (deleted codeblocks)")
                .setIcon("trash")
                .onClick(async () => await cleanStats.bind(this)())
        );
        menu.showAtMouseEvent(event);
    }

    async loadStats(): Promise<void> {
        this.stats = await this.loadData() || {};
    }

    async saveStats(): Promise<void> {
        await this.saveData(this.stats);
    }

    async parseCodeBlock(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        await this.loadStats();

        if (!ctx) {
            new Notice(i10n.noContext[userLang]);
            return
        }

        const contentAfter = await getSource(el, ctx);
        // console.log("contentAfter", contentAfter)

        const cardList = new CardList(this, contentAfter);
        const cardStat = new CardStat(this, this.app, el, ctx, cardList);
        await this.renderCard(this, cardStat, cardList, el, ctx, contentAfter);
    }

    async renderCard(plugin: VocabularyView, cardStat: CardStat, cardList: CardList, el: HTMLElement, ctx: MarkdownPostProcessorContext, source: string) {
        el.innerHTML = '';
        const container = el.createDiv("voca-card-container");
        const cardEl = container.createDiv("voca-card");
        
        if (!cardList.length) {
            createEmpty(cardEl);
        }else {
            await this.renderSingleCard(cardList, cardStat, cardEl, ctx, source);
        }

        reloadButton(plugin, container, cardList, ctx, 'card', cardStat);
    }

    private selectCard(cardList: CardList, cardStat: CardStat): Card | undefined {
        const remainingCards = cardList.cards.filter(c => c !== cardList.currentCard);
        return remainingCards.length ? getRandomCardWithWeight(remainingCards, cardStat) : undefined;
    }

    async renderSingleCard(cardList: CardList, cardStat: CardStat, el: HTMLElement, ctx: MarkdownPostProcessorContext, source: string) {
        // if only one card
        if (cardList.cards.length) {
            await cardStat.initializeId();
        }
        const card = this.selectCard(cardList, cardStat);
        if (!card) return;
        cardList.currentCard = card;

        await cardStat.cleanupSavedStats();

        el.innerHTML = '';
        renderCardStats(el, cardStat, card, cardList);
        renderCardContent(el, card);
        renderCardButtons(this, el, card, cardStat, cardList, el, ctx, source);
    }

    async renderTable(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        source = await getSource(el, ctx) || '';
        const cardList = new CardList(this, source);
        renderTableBody(this, cardList, el, ctx);
    }
}