import { MarkdownPostProcessorContext, Notice } from 'obsidian';
import { Card } from "./Card";
import { CardList } from "./CardList";
import { CardStat } from "./CardStat";
import { i10n, userLang } from "./i10n";
import VocabularyView from "./main";
import { createEmpty, getSource } from './utils';
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
    const buttonContainer = el.createEl('div', { cls: 'reload-container' });
    const reload = buttonContainer.createEl('button', { cls: 'reload-container_button-reload', title: i10n.reload[userLang], text: " ↺" });

    reload.addEventListener("click", async () => {
        if (!ctx) {
            return
        }
        const contentAfter = await getSource(el, ctx);
        if (!contentAfter) {
            const firstChild = el.firstElementChild as HTMLElement;
            if (!firstChild) return;
            const secondChild = firstChild.nextElementSibling as HTMLElement;
            firstChild.detach();
            createEmpty(el, secondChild);
            return
        }
        if (type === 'card') {
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

export function renderCardContent(plugin: VocabularyView, cardEl: HTMLElement, card: Card) {
    // Create the main content (derivative or explanation based on invert)
    cardEl.createEl('span', {
        cls: 'voca-card_derivative',
        text: plugin.invert ? card.explanation : card.derivative
    });

    // Create a container for transcription and blurred content
    const contentContainer = cardEl.createEl('div', { cls: 'voca-card_content-container' });

    if (plugin.invert) {
        // If inverted, put transcription and derivative in the blurred container
        const blurredContent = contentContainer.createEl('div', {
            cls: 'voca-card_explanation-blurred',
        });
        blurredContent.createEl('span', {
            cls: 'voca-card_ts',
            text: card.transcription || ' '
        });
        blurredContent.createEl('span', {
            cls: 'voca-card_inverted-derivative',
            text: card.derivative
        });

        blurredContent.addEventListener("click", () => {
            blurredContent.classList.remove('voca-card_explanation-blurred');
            blurredContent.classList.add('voca-card_explanation');
        });
    } else {
        // If not inverted, keep the original structure
        contentContainer.createEl('span', {
            cls: 'voca-card_ts',
            text: card.transcription || ' '
        });
        const blurred = contentContainer.createEl('span', {
            cls: 'voca-card_explanation-blurred',
            text: card.explanation
        });
        blurred.addEventListener("click", () => {
            blurred.classList.remove('voca-card_explanation-blurred');
            blurred.classList.add('voca-card_explanation');
        });
    }
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
    plugin.renderSingleCard(cardList, cardStat, el, ctx, src);
}