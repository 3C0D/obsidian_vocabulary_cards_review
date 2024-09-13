import { MarkdownPostProcessorContext } from "obsidian";
import VocabularyView from "./main";
import { Card } from "./Card";
import { CardStat } from "./CardStat";
import { i10n, userLang } from "./i10n";

/**
 * returns the content of the markdown page untill next code block if exists
 */
export async function getSource(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    const sectionInfo = ctx.getSectionInfo(el);
    if (!sectionInfo) return ""
    // page content
    let lines = sectionInfo.text.split('\n');
    // remove titles 
    lines = lines.filter(line => !/^#{1,6}\s+/.test(line));
    if (!lines.length) return "";

    const contentAfter = getContentAfterCodeBlock(lines, sectionInfo.lineEnd);

    return contentAfter;
}

function getContentAfterCodeBlock(lines: string[], codeBlockEndLine: number): string {
    let contentAfter = lines.slice(codeBlockEndLine + 1);

    const nextCodeBlockIndex = contentAfter.findIndex(line =>
        line.trim().startsWith("```voca-card") ||
        line.trim().startsWith("```voca-table")
    );

    // If another relevant code block is found, keep only the content until that block
    if (nextCodeBlockIndex !== -1) {
        contentAfter = contentAfter.slice(0, nextCodeBlockIndex);
    }

    return contentAfter.join('\n').trim();
}

export function getRandomCardWithWeight(cards: Card[], cardStat: CardStat): Card {
    const weightedCards = cards.map(card => {
        const [right, wrong] = cardStat.getStats(card);
        // Calculate the weight according to the provided logic
        return { card, weight: (wrong + 1) / (right + 1) };
    });

    const totalWeight = weightedCards.reduce((sum, wc) => sum + wc.weight, 0);
    const randomValue = Math.random() * totalWeight;

    let cumulativeWeight = 0;

    // Find the card corresponding to the random weight
    for (const wc of weightedCards) {
        cumulativeWeight += wc.weight;
        if (randomValue < cumulativeWeight) {
            return wc.card;
        }
    }

    // Fallback if no card is found (should not happen in theory)
    return cards[Math.floor(Math.random() * cards.length)];
}

export function createEmpty(el: HTMLElement) {
    const cardEl = el.createEl('div', { cls: "voca-card" });
    cardEl.createEl('div', { cls: 'voca-card-empty', text: i10n.empty[userLang] });
}

export function reloadEmptyButton(plugin: VocabularyView, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    const reloadButton = el.createEl('button', { cls: 'voca-card_empty-reload', text: '↺' });
    reloadButton.addEventListener("click", async () => {
        await plugin.parseCodeBlock(el, ctx);
    });
}

// string from date in ms
export function createIdfromDate() {
    return Date.now().toString()
}


