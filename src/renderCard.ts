import { MarkdownPostProcessorContext, Plugin } from 'obsidian';
import { Card } from "./Card";
import { CardList } from "./CardList";
import { CardStat } from "./CardStat";
import { i10n, userLang } from "./i10n";
import { renderCard } from "./main";
import { createEmpty, getExtSource, reloadEmptyButton } from './utils';
import { renderTableBody } from './renderTable';

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

export function reloadButton(el: HTMLElement, plugin: Plugin, cardList: CardList, cardStat: CardStat | undefined, ctx: MarkdownPostProcessorContext) {
    const cls = cardStat ? 'voca-card_button-reload' : 'voca-table_button-reload';
    const reload = el.createEl('button', { cls, title: i10n.reload[userLang], text: " ↺" });
    reload.addEventListener("click", async () => {
        const before = this.sourceFromLeaf
        const source = await getExtSource("", plugin, ctx);
        if (!source) {
            el.innerHTML = ""
            const parent = el.parentElement
            if (!parent) return
            el.detach()
            createEmpty(parent)
            reloadEmptyButton(plugin, parent, this.ctx)
            return
        }
        if (source === before) {
            return
        }
        if (cardStat) {
            cardList.updateSource(source);
            const parent = el.parentElement
            if (!parent) return
            el.detach()
            renderCard(plugin, cardStat, cardList, parent, ctx)
        } else {
            cardList.updateSource(source);
            renderTableBody(plugin, cardList, el, ctx)
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

export function renderCardButtons(cardEl: HTMLElement, plugin: Plugin, card: Card, cardStat: CardStat, cardList: CardList, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    const btns = cardEl.createEl('div', { cls: 'voca-card_buttons' });

    const wrong = btns.createEl('button', { cls: 'voca-card_button-danger', text: i10n.repeat[userLang] });
    wrong.addEventListener("click", () => {
        cardStat.wrongAnswer(card);
        renderCard(plugin, cardStat, cardList, el, ctx);
    });

    const success = btns.createEl('button', { cls: 'voca-card_button-success', text: i10n.iKnow[userLang] });
    success.addEventListener("click", () => {
        cardStat.rightAnswer(card);
        renderCard(plugin, cardStat, cardList, el, ctx);
    });
}
