import { MarkdownPostProcessorContext, Notice } from "obsidian";
import { Card } from "./Card";
import { CardStat } from "./CardStat";
import { i10n, userLang } from "./i10n";
import VocabularyView from "./main";
import { CardList } from "./CardList";

/**
 * returns the content of the markdown page untill next code block if exists
 */
export async function getSource(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    const sectionInfo = ctx.getSectionInfo(el);
    if (!sectionInfo) return ""
    // page content
    const lines = sectionInfo.text.split('\n').filter(line => !/^#{1,6}\s+/.test(line));
    if (!lines.length) return "";

    return getContentAfterCodeBlock(lines, sectionInfo.lineEnd);
}

function getContentAfterCodeBlock(lines: string[], codeBlockEndLine: number): string {
    let contentAfter = lines.slice(codeBlockEndLine);

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

export async function replaceLanguage(plugin: VocabularyView, ctx: MarkdownPostProcessorContext, el: HTMLElement) {
    const sectionInfo = ctx.getSectionInfo(el);
    if (!sectionInfo) return "";
    const file = plugin.app.vault.getFileByPath(ctx.sourcePath);
    if (!file) return "";

    // get header
    const lines = sectionInfo.text.split('\n');
    const codeBlockHeader = lines[sectionInfo.lineStart] ?? '';

    await plugin.app.vault.process(file, (content) => {
        const newLines = [...lines];
        newLines[sectionInfo.lineStart] = codeBlockHeader.includes("voca-card") ? newLines[sectionInfo.lineStart].replace("voca-card", "voca-table") : newLines[sectionInfo.lineStart].replace("voca-table", "voca-card");
        const newText = newLines.join('\n');
        return content.replace(sectionInfo.text, newText);
    });
}

export function getNextCard(plugin: VocabularyView, remainingCards: Card[], cardStat: CardStat, cardList: CardList): Card | undefined {
    return plugin.mode === "random"
        ? getRandomCardWithWeight(remainingCards, cardStat)
        : cardList.nextCard();
}

export function getRandomCardWithWeight(cards: Card[], cardStat: CardStat): Card {
    const randomFactor = 0.2;
    const maxWeight = 9;
    const baseWeight = 1;
    const sortThreshold = 100; // Threshold above which we sort the list

    const weightedCards = cards.map(card => {
        const [right, wrong] = cardStat.getStats(card);
        const weight = Math.min((Math.log(wrong + 1) + baseWeight) / (right + 1) * (1 + Math.random() * randomFactor), maxWeight);
        return { card, weight };
    });

    // Sort the list if the number of cards exceeds the threshold
    if (cards.length > sortThreshold) {
        weightedCards.sort((a, b) => b.weight - a.weight);
    }

    const totalWeight = weightedCards.reduce((sum, wc) => sum + wc.weight, 0);
    const randomValue = Math.random() * totalWeight;

    let cumulativeWeight = 0;
    for (const wc of weightedCards) {
        cumulativeWeight += wc.weight;
        if (randomValue < cumulativeWeight) {
            return wc.card;
        }
    }

    return weightedCards[0].card;
}

export function createEmpty(el: HTMLElement, secondChild?: HTMLElement) {
    const emptyElement = el.createEl('div', { cls: 'voca-empty', text: i10n.empty[userLang] });
    if (secondChild) {
        el.insertBefore(emptyElement, secondChild)
    }
}

// string from date in ms
export function createIdfromDate() {
    return Date.now().toString()
}

export async function cleanStats() {
    const markdownFiles = this.app.vault.getMarkdownFiles();
    const codeBlockRegex = /^```(voca-card|voca-table)\s*(.*?)\s*$/gm;
    const usedIds = new Set();

    for (const file of markdownFiles) {
        const fileContent = await this.app.vault.cachedRead(file);
        const matches = fileContent.matchAll(codeBlockRegex);
        for (const match of matches) {
            const id = match[2].trim();
            if (id) {
                usedIds.add(id);
            }
        }
    }

    const unusedKeys = Object.keys(this.stats).filter(key => !usedIds.has(key));

    if (!unusedKeys.length) {
        new Notice(i10n.nothingToClean[userLang]);
        return;
    }

    for (const key of unusedKeys) {
        delete this.stats[key];
    }

    new Notice(i10n.statsCleaned[userLang]);

    await this.saveData(this.stats);
}


