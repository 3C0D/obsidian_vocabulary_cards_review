import { moment, Plugin } from 'obsidian';

import "./styles.scss";
import { CardStat } from "./CardStat";
import { i10n } from "./i10n";
import { CardList } from "./CardList";
import { Card } from "./Card";
import { renderError } from "./Renderer";
import { getExtSource } from './utils';

export default class VocabularyView extends Plugin {
    private currentCard: Card | undefined;
    async onload() {
        this.registerMarkdownCodeBlockProcessor("voca-table", (source, el) => {
            setTimeout(() => renderTable(this, source, el), 100);
        });

        this.registerMarkdownCodeBlockProcessor("voca-card", (source, el) => {
            setTimeout(() => parseCardCodeBlock(this, source, el), 100);
        });
    }
}

function createEmpty(el: HTMLElement) {
    const cardEl = el.createEl('div', { cls: "voca-card" });
    cardEl.createEl('div', { cls: 'voca-card-empty', text: 'No cards found.' });// pas de css pour cette classe
}

function parseCardCodeBlock(plugin: Plugin, source: string, el: HTMLElement) {
    el.innerHTML = '';
    source = getExtSource(source, plugin);
    renderNextCard(new CardStat(plugin), new CardList(source, plugin), el);//empty or random card
}

function renderNextCard(cardStat: CardStat, cardList: CardList, el: HTMLElement, mode: 'next' | 'random' = 'random') {
    let card: Card | undefined;
    if (mode === 'next') {
        const iterator = cardList[Symbol.iterator]();
        const result = iterator.next();
        card = result.value;
    } else {
        const cards = cardList.cards.filter(c => c !== this.currentCard);
        card = cards[Math.floor(Math.random() * cards.length)];
    }

    this.currentCard = card
    renderSingleCard(card, cardList, cardStat, el); //render empty or card
}

function renderSingleCard(card: Card | undefined, cardList: CardList, cardStat: CardStat, el: HTMLElement) {
    el.innerHTML = '';

    if (!card) {
        createEmpty(el);
        return;
    }

    const cardEl = el.createEl('div', { cls: "voca-card" });

    const statData: number[] = cardStat.getStat(card);

    const stat = cardEl.createEl('span', { cls: 'voca-card_stat' });

    const rightCount = statData[0];
    const wrongCount = statData[1];

    // haut gauche
    if (cardList.length) {
        cardEl.createEl('span', { cls: 'voca-card_stat-total', title: i10n.total[moment.locale()], text: cardList.length.toString() });
    }


    stat.createEl('span', { cls: 'voca-card_stat-wrong', text: wrongCount.toString() });
    stat.createEl('span', { cls: 'voca-card_stat-delimiter', text: '/' });
    stat.createEl('span', { cls: 'voca-card_stat-right', text: rightCount.toString() });

    cardEl.createEl('span', { cls: 'voca-card-derivative', text: card.derivative });

    cardEl.createEl('span', { cls: 'voca-card-ts', text: card.transcription ? card.transcription : ' ' });

    // to create a blurred text effect
    const maxMove = card.explanation.length < 10 ? 8 : 16;
    let spacing = Math.floor(Math.random() * maxMove)
    if (Math.floor(Math.random() * 2) === 1) {
        spacing = -spacing;
    }

    const blurred = cardEl.createEl('span', { cls: 'voca-card-explanation-blurred', text: card.explanation, attr: { style: 'letter-spacing: ' + spacing + 'px;' } });

    cardEl.addEventListener("click", () => {
        blurred.classList.replace('voca-card-explanation-blurred', 'voca-card-explanation');
        blurred.style.letterSpacing = '0px';
    });

    const btns = cardEl.createEl('div', { cls: 'voca-card_buttons' });

    const wrong = btns.createEl('button', { cls: 'voca-card_button-danger', text: i10n.repeat[moment.locale()] });
    wrong.addEventListener("click", () => {
        //cardStat.loadCardListStat(wordList);
        cardStat.wrongAnswer(card);

        renderNextCard(cardStat, cardList, el);
    });

    const success = btns.createEl('button', { cls: 'voca-card_button-success', text: i10n.iKnow[moment.locale()] });
    success.addEventListener("click", () => {
        cardStat.rightAnswer(card);
        renderNextCard(cardStat, cardList, el);
    });
}

function renderTable(plugin: Plugin, source: string, el: HTMLElement) {
    try {
        const wordList = new CardList(source, plugin);
        if (wordList.length < 1) return;

        const tableEl = el.createEl('table', { cls: "voca-table" });

        const tableBody = tableEl.createEl('tbody');

        for (const word of wordList) {
            if (!word) continue;
            const trEl = tableBody.createEl('tr');
            const derivative = trEl.createEl('td', { cls: 'voca-table_derivative' });

            derivative.createEl('span', { cls: 'voca-table_derivative-text', text: word.derivative });
            if (word.transcription) {
                const transcription = derivative.createEl('span', { cls: 'voca-table_derivative-transcription' });
                transcription.createEl('span', { cls: 'voca-table_derivative-transcription-delimiter', text: '/' });
                transcription.createEl('span', { cls: 'voca-table_derivative-transcription-text', text: word.transcription });
                transcription.createEl('span', { cls: 'voca-table_derivative-transcription-delimiter', text: '/' });
            }

            const explanation = trEl.createEl('td', { cls: 'voca-table_explanation' });

            explanation.createEl('span', { 'text': word.explanation });

        }
    } catch (e: unknown) {
        renderError(e instanceof Error ? e.message : String(e), el);
    }
}
