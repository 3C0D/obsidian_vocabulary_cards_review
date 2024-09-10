import { MarkdownPostProcessorContext, Notice } from 'obsidian';
import { Card } from "./Card";
import { CardList } from "./CardList";
import { CardStat } from "./CardStat";
import { i10n, userLang } from "./i10n";
import VocabularyView from "./main";
import { createEmpty, getSource, reloadEmptyButton } from './utils';
import { renderTableBody } from './renderTable';

export function renderCardStats(cardEl: HTMLElement, cardStat: CardStat, card: Card, cardList: CardList, sourceFromLeaf: string) {
    const statData = cardStat.getStats(card);
    const stat = cardEl.createEl('span', { cls: 'voca-card_stat' });

    if (cardList.length) {
        cardEl.createEl('span', { cls: 'voca-card_stat-total', title: i10n.total[userLang], text: `${cardList.length.toString()} ${i10n.cards[userLang]} ${sourceFromLeaf ? "/ext" : ''}` });
    }

    stat.createEl('span', { cls: 'voca-card_stat-wrong', text: statData[1].toString() });
    stat.createEl('span', { cls: 'voca-card_stat-delimiter', text: '/' });
    stat.createEl('span', { cls: 'voca-card_stat-right', text: statData[0].toString() });
}

export function reloadButton(plugin: VocabularyView, el: HTMLElement, cardList: CardList, cardStat: CardStat | undefined, ctx: MarkdownPostProcessorContext, sourceFromLeaf: string) {
    const cls = cardStat ? 'voca-card_button-reload' : 'voca-table_button-reload';
    const reload = el.createEl('button', { cls, title: i10n.reload[userLang], text: " ↺" });
    reload.addEventListener("click", async () => {
        const before = sourceFromLeaf
        const source = await getSource("", plugin, ctx);
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
            await plugin.renderCard(cardStat, cardList, parent, ctx, sourceFromLeaf)
        } else {
            cardList.updateSource(source);
            renderTableBody(plugin, cardList, el, ctx, sourceFromLeaf)
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

export function renderCardButtons(cardEl: HTMLElement, plugin: VocabularyView, card: Card, cardStat: CardStat, cardList: CardList, el: HTMLElement, ctx: MarkdownPostProcessorContext, sourceFromLeaf: string) {
    const btns = cardEl.createEl('div', { cls: 'voca-card_buttons' });

    const wrong = btns.createEl('button', { cls: 'voca-card_button-danger', text: i10n.repeat[userLang] });
    wrong.addEventListener("click", async () => {
        await confirm(cardList, cardStat, card, plugin, el, ctx, false, sourceFromLeaf);
    });

    const success = btns.createEl('button', { cls: 'voca-card_button-success', text: i10n.iKnow[userLang] });
    success.addEventListener("click", async () => {
        await confirm(cardList, cardStat, card, plugin, el, ctx, true, sourceFromLeaf);
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

async function confirm(cardList: CardList, cardStat: CardStat, card: Card, plugin: VocabularyView, el: HTMLElement, ctx: MarkdownPostProcessorContext, right: boolean, sourceFromLeaf: string) {
    if (oneCard(cardList)) return;
    right ? cardStat.rightAnswer(card) : await cardStat.wrongAnswer(card);
    plugin.renderCard(cardStat, cardList, el, ctx,sourceFromLeaf);
}