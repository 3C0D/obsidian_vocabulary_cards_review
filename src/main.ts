import { Plugin } from 'obsidian';
import "./styles.scss";
import { CardStat } from "./CardStat";
import { CardList } from "./CardList";
import { Card } from "./Card";
import { getExtSource } from './utils';
import { reloadButton, renderCardButtons, renderCardContent, renderCardStats } from './renderCard_utils';
import { renderTableBody } from './renderTable_utils';

export default class VocabularyView extends Plugin {
    sourceFromLeaf = ""

    async onload() {
        this.registerMarkdownCodeBlockProcessor("voca-table", (source, el) => {// to fix...
            this.app.workspace.onLayoutReady(() => { renderTable(this, source, el) })
        });

        this.registerMarkdownCodeBlockProcessor("voca-card", (source: string, el) =>
            this.app.workspace.onLayoutReady(() => {
                parseCardCodeBlock(this, source, el)
            })
        );
    }
}


function createEmpty(el: HTMLElement) {
    const cardEl = el.createEl('div', { cls: "voca-card" });
    cardEl.createEl('div', { cls: 'voca-card-empty', text: 'No cards found.' });
}

function parseCardCodeBlock(plugin: Plugin, source: string, el: HTMLElement) {
    source = getExtSource(source, plugin);
    if (!source) {
        el.innerHTML = '';
        createEmpty(el);
        return;
    }
    renderCard(plugin, new CardStat(plugin), new CardList(source), el);//empty or random card
}

export function renderCard(plugin: Plugin, cardStat: CardStat, cardList: CardList, el: HTMLElement, mode: 'next' | 'random' = 'random') {
    let card: Card | undefined;
    el.innerHTML = '';

    const cards = cardList.cards.filter(c => c !== cardList.currentCard);
    if (!cards.length) { // only 1 card...
        return
    }

    if (mode === 'next') { // to see later...
        const iterator = cardList[Symbol.iterator]();
        const result = iterator.next();
        card = result.value;
    } else {
        card = cards[Math.floor(Math.random() * cards.length)];
    }

    cardList.currentCard = card
    renderSingleCard(plugin, card, cardList, cardStat, el);
}

function renderSingleCard(plugin: Plugin, card: Card | undefined, cardList: CardList, cardStat: CardStat, el: HTMLElement) {
    el.innerHTML = '';

    if (!card) {
        createEmpty(el);
        return;
    }

    const cardEl = el.createEl('div', { cls: "voca-card" });

    renderCardStats(cardEl, cardStat, card, cardList);

    if (this.sourceFromLeaf) {
        reloadButton(cardEl, plugin, cardList, cardStat);
    }

    renderCardContent(cardEl, card);

    renderCardButtons(cardEl, plugin, card, cardStat, cardList, el);
}

function renderTable(plugin: Plugin, source: string, el: HTMLElement) {
    source = getExtSource(source, plugin);
    if (!source) {
        el.innerHTML = '';
        createEmpty(el);
        return;
    }
    const cardList = new CardList(source);

    renderTableBody(plugin, cardList, el);
}


