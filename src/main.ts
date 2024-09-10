import { MarkdownPostProcessorContext, Plugin } from 'obsidian';
import "./styles.scss";
import { CardStat } from "./CardStat";
import { CardList } from "./CardList";
import { Card } from "./Card";
import { createEmpty, getRandomCardWithWeight, getSource, reloadEmptyButton } from './utils';
import { reloadButton, renderCardButtons, renderCardContent, renderCardStats } from './renderCard';
import { renderTableBody } from './renderTable';
import { PageStats } from './global';

// add a context menu
// command insert voca-card/voca-table at cursor position (avoid first line )

export default class VocabularyView extends Plugin {
    sourceFromLeaf = ""
    stats: Record<string, PageStats>

    async onload() {
        this.registerMarkdownCodeBlockProcessor("voca-table", (source, el, ctx) => {
            this.app.workspace.onLayoutReady(async () => { await this.renderTable(source, el, ctx) })
        });

        this.registerMarkdownCodeBlockProcessor("voca-card", (source: string, el, ctx) =>
            this.app.workspace.onLayoutReady(async () => {
                await this.parseCardCodeBlock(source, el, ctx)
            })
        );
    }

    async parseCardCodeBlock(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        // source is the text in the code block or the markdown page
        source = await getSource(source, this, ctx);
        console.log("this.sourceFromLeaf////////", this.sourceFromLeaf)

        if (!source) { // repeated code. do a function
            el.innerHTML = '';
            createEmpty(el);
            reloadEmptyButton(this, el, ctx);
            return;
        }

        //parse source & create cards
        const cardList = new CardList(this, source, ctx);
        // manage stats & getId
        const cardStat = new CardStat(this, this.app, el, ctx, cardList);
        // load stats & resolveId
        await cardStat.initialize();
        const sourceFromLeaf = this.sourceFromLeaf// because of the await value is not synchronous
        await this.renderCard(cardStat, cardList, el, ctx, sourceFromLeaf);
    }

    async renderCard(
        cardStat: CardStat,
        cardList: CardList,
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext,
        sourceFromLeaf: string,
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
        await this.renderSingleCard(card, cardList, cardStat, el, ctx, sourceFromLeaf);
    }

    async renderSingleCard(card: Card, cardList: CardList, cardStat: CardStat, el: HTMLElement, ctx: MarkdownPostProcessorContext, sourceFromLeaf: string) {
        el.innerHTML = '';

        if (!card) {
            createEmpty(el);
            return
        }

        const cardEl = el.createEl('div', { cls: "voca-card" });

        renderCardStats(cardEl, cardStat, card, cardList, sourceFromLeaf);
        await cardStat.cleanupSavedStats();

        console.log("sourceFromLeaf", sourceFromLeaf)
        if (sourceFromLeaf) {
            reloadButton(this, cardEl, cardList, cardStat, ctx, sourceFromLeaf);
        }

        renderCardContent(cardEl, card);

        renderCardButtons(cardEl, this, card, cardStat, cardList, el, ctx, sourceFromLeaf);
    }

    async renderTable(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        source = await getSource(source, this, ctx);
        if (!source) {
            el.innerHTML = '';
            createEmpty(el);
            reloadEmptyButton(this, el, ctx);
        }
        const cardList = new CardList(this, source, ctx);
        const sourceFromLeaf = this.sourceFromLeaf
        renderTableBody(this, cardList, el, ctx, sourceFromLeaf);
    }
}

