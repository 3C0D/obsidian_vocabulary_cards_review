import { MarkdownPostProcessorContext, Plugin } from 'obsidian';
import "./styles.scss";
import { CardStat } from "./CardStat";
import { CardList } from "./CardList";
import { Card } from "./Card";
import { createEmpty, getExtSource, reloadEmptyButton } from './utils';
import { reloadButton, renderCardButtons, renderCardContent, renderCardStats } from './renderCard';
import { renderTableBody } from './renderTable';

// add a context menu
// bug 1 card next ? chiant!!
// command insert voca-card/voca-table
// add clean code to scripts...
// table section according to titles ? later ?... system to have several code blocks by page ?

export default class VocabularyView extends Plugin {
    sourceFromLeaf = ""

    async onload() {
        this.registerMarkdownCodeBlockProcessor("voca-table", (source, el, ctx) => {
            this.app.workspace.onLayoutReady(async () => { await renderTable(this, source, el, ctx) })
        });

        this.registerMarkdownCodeBlockProcessor("voca-card", (source: string, el, ctx) =>
            this.app.workspace.onLayoutReady(async () => {
                await parseCardCodeBlock(this, source, el, ctx)
            })
        );
    }
}

export async function parseCardCodeBlock(plugin: Plugin, source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    source = await getExtSource(source, plugin, ctx);

    if (!source) {
        el.innerHTML = '';
        createEmpty(el);
        reloadEmptyButton(plugin, el, ctx);
        return;
    }

    const cardList = new CardList(this, source, ctx);
    const cardStat = new CardStat(plugin, ctx);
    await renderCard(plugin, cardStat, cardList, el, ctx);
}

export async function renderCard(
    plugin: Plugin,
    cardStat: CardStat,
    cardList: CardList,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
    mode: 'next' | 'random' = 'random'
) {
    let card: Card | undefined;
    el.innerHTML = '';
    // Filter out cards to exclude the current card
    const remainingCards = cardList.cards.filter(c => c !== cardList.currentCard);

    if (!remainingCards.length) {
        return; // If no remaining cards
    }

    if (mode === 'next') {
        const iterator = cardList[Symbol.iterator]();
        const result = iterator.next();
        card = result.value || remainingCards[0]; // If no next card, take the first one
    } else {
        // Use weighted random selection based on stats
        card = getRandomCardWithWeight(remainingCards, cardStat);
    }

    cardList.currentCard = card;
    await renderSingleCard(plugin, card, cardList, cardStat, el, ctx);
}

export function getRandomCardWithWeight(cards: Card[], cardStat: CardStat): Card {
    const weightedCards = cards.map(card => {
        const [right, wrong] = cardStat.getStats(card);
        // Calculer le poids selon la logique fournie
        return { card, weight: (wrong + 1) / (right + 1) };
    });

    const totalWeight = weightedCards.reduce((sum, wc) => sum + wc.weight, 0);
    const randomValue = Math.random() * totalWeight;

    let cumulativeWeight = 0;

    // Trouver la carte correspondant au poids aléatoire
    for (const wc of weightedCards) {
        cumulativeWeight += wc.weight;
        if (randomValue < cumulativeWeight) {
            return wc.card;
        }
    }

    // Fallback si aucune carte n'est trouvée (ne devrait pas arriver en théorie)
    return cards[Math.floor(Math.random() * cards.length)];
}

async function renderSingleCard(plugin: Plugin, card: Card, cardList: CardList, cardStat: CardStat, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    el.innerHTML = '';

    if (!card) {
        createEmpty(el);
        return
    }

    const cardEl = el.createEl('div', { cls: "voca-card" });

    renderCardStats(cardEl, cardStat, card, cardList);
    await cardList.cleanupSavedStats(cardStat);

    if (this.sourceFromLeaf) {
        reloadButton(cardEl, plugin, cardList, cardStat, ctx);
    }

    renderCardContent(cardEl, card);

    renderCardButtons(cardEl, plugin, card, cardStat, cardList, el, ctx);
}

async function renderTable(plugin: Plugin, source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    source = await getExtSource(source, plugin, ctx);
    if (!source) {
        el.innerHTML = '';
        createEmpty(el);
        if (this.sourceFromLeaf) {
            reloadEmptyButton(plugin, el, this.ctx);
        }
        return;
    }
    const cardList = new CardList(this, source, ctx);

    renderTableBody(plugin, cardList, el, ctx);
}


