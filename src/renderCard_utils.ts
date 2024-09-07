import { Plugin } from 'obsidian';
import { Card } from "./Card";
import { CardList } from "./CardList";
import { CardStat } from "./CardStat";
import { i10n, userLang } from "./i10n";
import { renderCard } from "./main";
import { getExtSource } from './utils';
import { renderTableBody } from './renderTable_utils';


//Vider dicco si retrait. Valeurs dicco selon leaf ?
// section table selon titres ?
// Reset stats Avec confirmation

export function renderCardStats(cardEl: HTMLElement, cardStat: CardStat, card: Card, cardList: CardList) {
    const statData = cardStat.getStat(card);
    const stat = cardEl.createEl('span', { cls: 'voca-card_stat' });

    if (cardList.length) {
        cardEl.createEl('span', { cls: 'voca-card_stat-total', title: i10n.total[userLang], text: `${cardList.length.toString()} ${i10n.cards[userLang]} ${this.sourceFromLeaf ? "/ext" : ''}` });
    }

    stat.createEl('span', { cls: 'voca-card_stat-wrong', text: statData[1].toString() });
    stat.createEl('span', { cls: 'voca-card_stat-delimiter', text: '/' });
    stat.createEl('span', { cls: 'voca-card_stat-right', text: statData[0].toString() });
}

export function reloadButton(el: HTMLElement, plugin: Plugin, cardList: CardList, cardStat: CardStat | undefined) {
    const cls = cardStat ? 'voca-card_button-reload' : 'voca-table_button-reload';
    const reload = el.createEl('button', { cls, title: i10n.reload[userLang], text: " ↺" });
    reload.addEventListener("click", () => {
        const before = this.sourceFromLeaf
        const source = getExtSource("", plugin);
        if (source === before) {
            return
        }
        if (cardStat) {
            cardList.updateSource(source);
            renderCard(plugin, cardStat, cardList, el)
        } else {
            cardList.updateSource(source);
            renderTableBody(plugin, cardList, el)
        }
    })
}


export function renderCardContent(cardEl: HTMLElement, card: Card) {
    cardEl.createEl('span', { cls: 'voca-card_derivative', text: card.derivative });
    cardEl.createEl('span', { cls: 'voca-card_ts', text: card.transcription || ' ' });

    const blurred = cardEl.createEl('span', {
        cls: 'voca-card_explanation-blurred',
        text: card.explanation
    });

    blurred.addEventListener("click", () => {
        blurred.classList.remove('voca-card_explanation-blurred');
        blurred.classList.add('voca-card_explanation');
    });
}

export function renderCardButtons(cardEl: HTMLElement, plugin: Plugin, card: Card, cardStat: CardStat, cardList: CardList, el: HTMLElement) {
    const btns = cardEl.createEl('div', { cls: 'voca-card_buttons' });

    const wrong = btns.createEl('button', { cls: 'voca-card_button-danger', text: i10n.repeat[userLang] });
    wrong.addEventListener("click", () => {
        cardStat.wrongAnswer(card);
        renderCard(plugin, cardStat, cardList, el);
    });

    const success = btns.createEl('button', { cls: 'voca-card_button-success', text: i10n.iKnow[userLang] });
    success.addEventListener("click", () => {
        cardStat.rightAnswer(card);
        renderCard(plugin, cardStat, cardList, el);
    });
}
