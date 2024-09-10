import { MarkdownPostProcessorContext } from "obsidian";
import VocabularyView from "./main";
import { Card } from "./Card";
import { CardStat } from "./CardStat";

export async function leafContent(plugin: VocabularyView, ctx: MarkdownPostProcessorContext) {
    const relativePath = ctx.sourcePath
    const file = plugin.app.vault.getFileByPath(relativePath)
    if (!file) return
    const content = await plugin.app.vault.read(file)
    return content
}

/**
 * Returns the content of the source code block or the content of the
 * underlying markdown page if the source code block is empty.
 *
 * @returns The content of the markdown page or the source code block (and set this.sourceFromLeaf)
 */
export async function getSource(plugin: VocabularyView, source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    plugin.sourceFromLeaf = ""
    // source has some content
    if (source.trim()) {
        return source}

    const sectionInfo = ctx.getSectionInfo(el);
    if (!sectionInfo) {
        return "";
    }

    const lines = sectionInfo.text.split('\n');
    const codeBlockEndLine = sectionInfo.lineEnd;

    // Get the lines after the current code block
    let contentAfter = lines.slice(codeBlockEndLine + 1);

    // Find the next code block that starts with 'voca-card' or 'voca-table'
    const nextCodeBlockIndex = contentAfter.findIndex(line =>
        line.trim().startsWith("```voca-card") ||
        line.trim().startsWith("```voca-table")
    );

    // If another relevant code block is found, keep only the content until that block
    if (nextCodeBlockIndex !== -1) {
        contentAfter = contentAfter.slice(0, nextCodeBlockIndex);
    }
    source = contentAfter.join('\n').trim();

    plugin.sourceFromLeaf = source
    return source
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
    cardEl.createEl('div', { cls: 'voca-card-empty', text: 'No cards found.' });
}

export function reloadEmptyButton(plugin: VocabularyView, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    const reloadButton = el.createEl('button', { cls: 'voca-card_empty-reload', text: '↺' });
    reloadButton.addEventListener("click", async () => {
        await plugin.parseCardCodeBlock(plugin.sourceFromLeaf, el, ctx);
    });
}

export function getFileFromCtx(ctx: MarkdownPostProcessorContext, plugin: VocabularyView) {
    const relativePath = ctx.sourcePath
    const file = plugin.app.vault.getAbstractFileByPath(relativePath)
    if (!file) return
    return file
}

// string from date in ms
export function createIdfromDate() {
    return Date.now().toString()
}


