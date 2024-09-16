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

//do a list of all codeblocks voca-card or voca-table and check if their id is in stats. do a manual cleaning.


export default class VocabularyView extends Plugin {
    stats: Record<string, PageStats>
    viewedIds: string[] = []

    async onload() {
        this.registerMarkdownCodeBlockProcessor("voca-table", async (source, el, ctx) => await this.renderTable(source, el, ctx));
        this.registerMarkdownCodeBlockProcessor("voca-card", async (source, el, ctx) => await this.parseCodeBlock(el, ctx));
        // await this.deleteUnusedKeys();
    }

    //  not working on rendered codeblocks I have to work on all md files
    // async deleteUnusedKeys(): Promise<void> {
    //     await new Promise(resolve => setTimeout(resolve, 10000));
    //     // console.log("this.viewedIds", this.viewedIds)
    //     // console.log("this.stats", Object.keys(this.stats))

    //     const unusedKeys = Object.keys(this.stats).filter(key => !this.viewedIds.includes(key));
    //     console.log("unusedKeys", unusedKeys)
    //     if (!unusedKeys.length) return;
    //     // for (const key of unusedKeys) {
    //     //     delete this.stats[key];
    //     // }
    //     // await this.saveStats();
    // }

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

        if (!contentAfter) {
            this.createEmptyCard(el, ctx);
            return;
        }

        //parse source & create cards
        const cardList = new CardList(this, contentAfter);
        // manage stats & getId
        const cardStat = new CardStat(this, this.app, el, ctx, cardList);
        await cardStat.initialize();
        await this.renderCard( cardStat, cardList, el, ctx, contentAfter);
    }

    private createEmptyCard(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        createEmpty(el);
        reloadEmptyButton(this, el, ctx);
    }

    async renderCard(
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
        await this.renderSingleCard(card, cardList, cardStat, el, ctx, source);
    }

    private selectCard(cardList: CardList, cardStat: CardStat): Card | undefined {
        const remainingCards = cardList.cards.filter(c => c !== cardList.currentCard);
        return remainingCards.length ? getRandomCardWithWeight(remainingCards, cardStat) : undefined;
    }

    async renderSingleCard( card: Card, cardList: CardList, cardStat: CardStat, el: HTMLElement, ctx: MarkdownPostProcessorContext, source: string) {
        const cardEl = el.createDiv("voca-card");
        await cardStat.cleanupSavedStats();
        renderCardStats(cardEl, cardStat, card, cardList);
        reloadButton(this, cardEl, cardList, ctx, 'card' ,cardStat);
        renderCardContent(cardEl, card);
        renderCardButtons(this, cardEl, card, cardStat, cardList, el, ctx, source);
    }

    async renderTable(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        source = await getSource(el, ctx) || '';
        if (!source) {
            this.createEmptyCard(el, ctx);
        } else {
            const cardList = new CardList(this, source);
            renderTableBody(this, cardList, el, ctx);
        }
    }
}

