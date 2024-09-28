import { MarkdownPostProcessorContext, Notice } from 'obsidian';
import { Card } from "./Card";
import { CardList } from './CardList';
import { CardStat } from './CardStat';
import { createEmpty, getSource, renderSingleCard } from './utils';
import VocabularyView from './main';
import { toggleAutoMode, disableButtons, runAutoMode } from './automaticMode';
import { i10n, userLang } from "./i10n";



export function renderTableRow(tableBody: HTMLElement, word: Card) {
    const trEl = tableBody.createEl('tr');
    const derivative = trEl.createEl('td', { cls: 'voca-table_derivative' });

    derivative.createEl('span', { cls: 'voca-table_derivative-text', text: word.derivative });
    if (word.transcription) {
        renderTranscription(derivative, word.transcription);
    }

    const explanation = trEl.createEl('td', { cls: 'voca-table_explanation' });
    explanation.createEl('span', { 'text': word.explanation });
}

function renderTranscription(derivative: HTMLElement, transcription: string) {
    const transcriptionEl = derivative.createEl('span', { cls: 'voca-table_derivative-transcription' });
    transcriptionEl.createEl('span', { cls: 'voca-table_derivative-transcription-delimiter', text: '/' });
    transcriptionEl.createEl('span', { cls: 'voca-table_derivative-transcription-text', text: transcription });
    transcriptionEl.createEl('span', { cls: 'voca-table_derivative-transcription-delimiter', text: '/' });
}

export function renderTableBody(plugin: VocabularyView, cardList: CardList, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }
    const tableEl = el.createEl('table', { cls: "voca-table" });
    const tableBody = tableEl.createEl('tbody');

    if (cardList.length === 0) {
        createEmpty(tableBody);
    } else {
        for (const card of cardList) {
            if (!card) continue;
            renderTableRow(tableBody, card);
        }
    }

    reloadButton(plugin, el, cardList, ctx, 'table');
}


export async function renderCard(plugin: VocabularyView, cardStat: CardStat, cardList: CardList, el: HTMLElement, ctx: MarkdownPostProcessorContext, source: string) {
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }
    const container = el.createDiv("voca-card-container");
    const cardEl = container.createDiv("voca-card");

    if (!cardList.length) {
        createEmpty(cardEl);
    } else {
        await renderSingleCard(plugin, cardList, cardStat, cardEl, ctx, source);
    }

    reloadButton(plugin, container, cardList, ctx, 'card', cardStat);
    mode(plugin, container);
    invert(plugin, container);

    if (!cardList.length) {
        el.querySelector('.mode-div')?.classList.add('hidden');
        el.querySelector('.invert-div')?.classList.add('hidden');
    }

    const buttonContainer = el.querySelector('.reload-container') as HTMLElement;
    const playButton = buttonContainer.createEl('button', {
        cls: 'reload-container_play-button',
        text: plugin.autoMode ? '⏹' : '▶',
        attr: { title: plugin.autoMode ? 'Stop' : 'Start Auto Mode' }
    });
    playButton.addEventListener('click', async () => await toggleAutoMode(plugin, cardList, cardStat, container, ctx, source));

    if (plugin.autoMode) {
        disableButtons(cardEl);
    }
}

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
    if (plugin.autoMode && !plugin.settings.disableConfirmationButtons) {
        if (plugin.autoModeTimer) {
            clearTimeout(plugin.autoModeTimer);
            plugin.autoModeTimer = null;
            await runAutoMode(plugin, cardList, cardStat, el.parentElement as HTMLElement, ctx, src);
            return
        }
    }
    await renderSingleCard(plugin, cardList, cardStat, el, ctx, src);
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
            const secondChild = firstChild.nextElementSibling as HTMLElement;
            firstChild.detach();
            createEmpty(el, secondChild);
            if (type === 'card') {
                el.querySelector('.mode-div')?.classList.add('hidden');
                el.querySelector('.invert-div')?.classList.add('hidden');
            }
            return
        }
        if (type === 'card') {
            el.querySelector('.mode-div')?.classList.remove('hidden');
            el.querySelector('.invert-div')?.classList.remove('hidden');
            cardList.updateSource(contentAfter);
            const parent = el.parentElement
            if (!parent) return
            el.detach()
            await renderCard(plugin, cardStat as CardStat, cardList, parent, ctx, contentAfter)
        } else {
            cardList.updateSource(contentAfter);
            renderTableBody(plugin, cardList, el, ctx)
        }
    })
}

export function mode(plugin: VocabularyView, el: HTMLElement) {
    const container = el.querySelector('.reload-container') as HTMLElement;
    container.createEl('div', { cls: 'mode-div', text: plugin.mode === "random" ? i10n.random[userLang] : i10n.next[userLang] });
}

export function invert(plugin: VocabularyView, el: HTMLElement) {
    const container = el.querySelector('.reload-container') as HTMLElement;
    container.createEl('div', { cls: 'invert-div', text: plugin.invert ? i10n.invert[userLang] : i10n.normal[userLang] });
}