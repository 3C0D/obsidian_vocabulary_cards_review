import { MarkdownPostProcessorContext, Notice } from 'obsidian';
import { Card } from "./Card";
import { CardList } from "./CardList";
import { CardStat } from "./CardStat";
import { i10n, userLang } from "./i10n";
import VocabularyView from "./main";
import { createEmpty, getSource, reloadEmptyButton } from './utils';
import { renderTableBody } from './renderTable';

export function renderCardStats(cardEl: HTMLElement, cardStat: CardStat, card: Card, cardList: CardList) {
    const statData = cardStat.getStats(card);
    const stat = cardEl.createEl('span', { cls: 'voca-card_stat' });

    if (cardList.length) {
        cardEl.createEl('span', { cls: 'voca-card_stat-total', title: i10n.total[userLang], text: `${cardList.length.toString()} ${i10n.cards[userLang]}` });
    }

    stat.createEl('span', { cls: 'voca-card_stat-wrong', text: statData[1].toString() });
    stat.createEl('span', { cls: 'voca-card_stat-delimiter', text: '/' });
    stat.createEl('span', { cls: 'voca-card_stat-right', text: statData[0].toString() });
}

export function reloadButton(plugin: VocabularyView, el: HTMLElement, cardList: CardList, ctx: MarkdownPostProcessorContext, type: 'card' | 'table' = 'table', cardStat?: CardStat) {

    const cls = type === 'card' ? 'voca-card_button-reload' : 'voca-table_button-reload';
    const reload = el.createEl('button', { cls, title: i10n.reload[userLang], text: " ↺" });
    reload.addEventListener("click", async () => {
        if (!ctx) {
            return
        }

        const contentAfter = await getSource(el, ctx);
        if (!contentAfter) {
            const parent = el.parentElement
            if (!parent) return
            el.detach()
            createEmpty(parent)
            reloadEmptyButton(plugin, parent, this.ctx)
            return
        }

        if (type === 'card') {//&& cardStat
            cardList.updateSource(contentAfter);
            const parent = el.parentElement
            if (!parent) return
            el.detach()
            await plugin.renderCard(plugin, cardStat as CardStat, cardList, parent, ctx, contentAfter)
        } else {
            cardList.updateSource(contentAfter);
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

export function renderCardButtons(plugin: VocabularyView, cardEl: HTMLElement, card: Card, cardStat: CardStat, cardList: CardList, el: HTMLElement, ctx: MarkdownPostProcessorContext, src: string) {
    const btns = cardEl.createEl('div', { cls: 'voca-card_buttons' });

    const wrong = btns.createEl('button', { cls: 'voca-card_button-danger', text: i10n.repeat[userLang] });
    wrong.addEventListener("click", async () => {
        await confirm(plugin, cardList, cardStat, card, el, ctx, false, src);
    });

    const success = btns.createEl('button', { cls: 'voca-card_button-success', text: i10n.iKnow[userLang] });
    success.addEventListener("click", async () => {
        await confirm(plugin, cardList, cardStat, card, el, ctx, true, src);
    });
}

function oneCard(cardList: CardList) {
    const remainingCards = cardList.cards.filter(c => c !== cardList.currentCard);
    if (!remainingCards.length) {
        new Notice("Only one card", 3000);
        return true
    }
    return false
}

async function confirm(plugin: VocabularyView, cardList: CardList, cardStat: CardStat, card: Card, el: HTMLElement, ctx: MarkdownPostProcessorContext, right: boolean, src: string) {
    if (oneCard(cardList)) return;
    right ? cardStat.rightAnswer(card) : await cardStat.wrongAnswer(card);
    plugin.renderCard(plugin, cardStat, cardList, el, ctx, src);
}