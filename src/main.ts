import { MarkdownPostProcessorContext, Menu, Notice, Plugin } from 'obsidian';
import "./styles.scss";
import { CardStat } from "./CardStat";
import { CardList } from "./CardList";
import { Card } from "./Card";
import { cleanStats, createEmpty, getNextCard, getSource } from './utils';
import { reloadButton, renderCardButtons, renderCardContent, renderCardStats } from './renderCardUtils';
import { renderTableBody } from './renderTable';
import { PageStats } from './global';
import { i10n, userLang } from './i10n';


export default class VocabularyView extends Plugin {
    stats: Record<string, PageStats>
    viewedIds: string[] = []
    mode: "random" | "next" = 'random'
    invert = false

    async onload() {
        this.registerMarkdownCodeBlockProcessor("voca-table", async (source, el, ctx) => {
            await this.renderTable(source, el, ctx)
            el.addEventListener("contextmenu", this.handleContextMenu.bind(this));
        })
        this.registerMarkdownCodeBlockProcessor("voca-card", async (source, el, ctx) => {
            await this.parseCodeBlock(el, ctx)
        })
    }

    handleContextMenu(event: MouseEvent, el: HTMLElement, cardStat: CardStat , cardList: CardList  , ctx : MarkdownPostProcessorContext  , contentAfter : string) {
        event.preventDefault();
        const menu = new Menu();
        menu.addItem((item) =>
            item
                // clean up old stats
                .setTitle(i10n.clean[userLang])
                .setIcon("trash")
                .onClick(async () => await cleanStats.bind(this)())
        );
        menu.addItem(async (item) => item
            .setTitle(`${this.mode === "random" ? i10n.next[userLang] : i10n.random[userLang]}`)
            .setIcon("arrow-right")
            .onClick(async () => {
                this.mode = this.mode === "random" ? "next" : "random";
                await this.saveData({});
                (el.querySelector(".mode-div") as HTMLSpanElement).textContent = this.mode === "random" ? i10n.random[userLang] : i10n.next[userLang];
            })
        )

        menu.addItem(async (item) => item
            // invert showing
            .setTitle(`${this.invert ? i10n.normal[userLang] :  i10n.invert[userLang]}`)
            .setIcon("arrow-right")
            .onClick(async () => {
                this.invert = !this.invert;
                await this.saveData({});
                (el.querySelector(".invert-div") as HTMLSpanElement).textContent = this.invert ? i10n.invert[userLang] : i10n.normal[userLang];
                await this.renderCard(this, cardStat, cardList, el, ctx, contentAfter)
            })
        )
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
        const cardList = new CardList(this, contentAfter);
        const cardStat = new CardStat(this, this.app, el, ctx, cardList);
        await this.renderCard(this, cardStat, cardList, el, ctx, contentAfter);
        el.addEventListener("contextmenu", (event) => this.handleContextMenu(event, el,cardStat, cardList, ctx, contentAfter));
    }

    async renderCard(plugin: VocabularyView, cardStat: CardStat, cardList: CardList, el: HTMLElement, ctx: MarkdownPostProcessorContext, source: string) {
        el.innerHTML = '';
        const container = el.createDiv("voca-card-container");
        const cardEl = container.createDiv("voca-card");

        if (!cardList.length) {
            createEmpty(cardEl);
        } else {
            await plugin.renderSingleCard(cardList, cardStat, cardEl, ctx, source);
        }

        reloadButton(plugin, container, cardList, ctx, 'card', cardStat);
        mode(plugin, container)
        invert(plugin, container)
    }

    private selectCard(cardList: CardList, cardStat: CardStat): Card | undefined {
        const remainingCards = cardList.cards.filter(c => c !== cardList.currentCard);
        return remainingCards.length ? getNextCard(this, remainingCards, cardStat, cardList) : undefined;
    }

    async renderSingleCard(cardList: CardList, cardStat: CardStat, el: HTMLElement, ctx: MarkdownPostProcessorContext, source: string) {
        if (cardList.cards.length) {
            await cardStat.resolveId();
        }
        const card = this.selectCard(cardList, cardStat);
        if (!card) return;
        cardList.currentCard = card;

        await cardStat.cleanupSavedStats();

        el.innerHTML = '';
        renderCardStats(el, cardStat, card, cardList);
        renderCardContent(this,el, card);
        renderCardButtons(this, el, card, cardStat, cardList, el, ctx, source);
    }

    async renderTable(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        source = await getSource(el, ctx) || '';
        const cardList = new CardList(this, source);
        renderTableBody(this, cardList, el, ctx);
    }
}

export function mode(plugin: VocabularyView, el: HTMLElement) {
    const container = el.querySelector('.reload-container') as HTMLElement;
    container.createEl('div', { cls: 'mode-div', text: plugin.mode ? i10n.random[userLang] : i10n.next[userLang] });
}

export function invert(plugin: VocabularyView, el: HTMLElement) {
    const container = el.querySelector('.reload-container') as HTMLElement;
    container.createEl('div', { cls: 'invert-div', text: plugin.invert ? i10n.invert[userLang] : i10n.normal[userLang] });
}