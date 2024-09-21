import { MarkdownPostProcessorContext, Menu, Notice } from "obsidian";
import { Card } from "./Card";
import { CardStat } from "./CardStat";
import { i10n, userLang } from "./i10n";
import VocabularyView from "./main";
import { CardList } from "./CardList";
import { reloadButton, renderCardButtons, renderCardContent, renderCardStats } from "./renderCardUtils";
import { disableButtons, toggleAutoMode } from "./automaticMode";

/**
 * returns the content of the markdown page untill next code block if exists
 */
export async function getSource(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    const sectionInfo = ctx.getSectionInfo(el);
    if (!sectionInfo) return ""
    // page content
    const lines = sectionInfo.text.split('\n').filter(line => !/^#{1,6}\s+/.test(line));
    return getContentAfterCodeBlock(lines, sectionInfo.lineEnd);
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

    const unusedKeys = Object.keys(this.settings.stats).filter(key => !usedIds.has(key));

    if (!unusedKeys.length) {
        new Notice(i10n.nothingToClean[userLang]);
        return;
    }

    for (const key of unusedKeys) {
        delete this.settings.stats[key];
    }

    new Notice(i10n.statsCleaned[userLang]);

    await this.saveSettings;
}

export function handleContextMenu(event: MouseEvent, plugin: VocabularyView, el: HTMLElement, ctx: MarkdownPostProcessorContext, source: string, cardStat?: CardStat, cardList?: CardList, contentAfter?: string) {
    event.preventDefault();
    const isVocaCard = el.classList.contains("block-language-voca-card");
    const menu = new Menu();

    menu.addItem((item) => item
        // clean up old stats
        .setTitle(i10n.clean[userLang])
        .setIcon("trash")
        .onClick(async () => await cleanStats.bind(plugin)())
    );

    menu.addItem((item) => item
        // change language
        .setTitle(isVocaCard ? i10n.tableSwitch[userLang] : i10n.cardSwitch[userLang])
        .setIcon("arrow-right")
        .onClick(async () => {
            await replaceLanguage(plugin, ctx, el);
            el.detach();
            if (!isVocaCard) {
                await plugin.parseCodeBlock(el, ctx, source);
            } else {
                await plugin.renderTable(source, el, ctx);
                el.addEventListener("contextmenu", (event) => handleContextMenu(event, plugin, el, ctx, source));
            }
        })
    );

    if (cardStat && cardList && contentAfter) {
        menu.addItem((item) => item
            // change mode (random/next)
            .setTitle(plugin.mode === "random" ? i10n.next[userLang] : i10n.random[userLang])
            .setIcon("arrow-right")
            .onClick(async () => {
                plugin.mode = plugin.mode === "random" ? "next" : "random";
                await plugin.saveSettings();
                (el.querySelector(".mode-div") as HTMLSpanElement).textContent = plugin.mode === "random" ? i10n.random[userLang] : i10n.next[userLang];
            })
        );

        menu.addItem((item) => item
            // invert showing
            .setTitle(plugin.invert ? i10n.normal[userLang] : i10n.invert[userLang])
            .setIcon("arrow-right")
            .onClick(async () => {
                plugin.invert = !plugin.invert;
                await plugin.saveSettings();
                (el.querySelector(".invert-div") as HTMLSpanElement).textContent = plugin.invert ? i10n.invert[userLang] : i10n.normal[userLang];
                await renderCard(plugin, cardStat, cardList, el, ctx, contentAfter);
            })
        );
    }

    menu.showAtMouseEvent(event);
}

export async function renderCard(plugin: VocabularyView, cardStat: CardStat, cardList: CardList, el: HTMLElement, ctx: MarkdownPostProcessorContext, source: string) {
    el.innerHTML = '';
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

export function selectCard(plugin: VocabularyView, cardList: CardList, cardStat: CardStat): Card | undefined {
    const remainingCards = cardList.cards.filter(c => c !== cardList.currentCard);
    return remainingCards.length ? getNextCard(plugin, remainingCards, cardStat, cardList) : undefined;
}

export async function renderSingleCard(plugin: VocabularyView, cardList: CardList, cardStat: CardStat, el: HTMLElement, ctx: MarkdownPostProcessorContext, source: string) {
    if (cardList.cards.length) {
        await cardStat.resolveId();
    }
    const card = selectCard(plugin, cardList, cardStat);
    if (!card) return;
    cardList.currentCard = card;

    await cardStat.cleanupSavedStats();

    el.innerHTML = '';
    renderCardStats(el, cardStat, card, cardList);
    renderCardContent(plugin, el, card);
    renderCardButtons(plugin, el, card, cardStat, cardList, el, ctx, source);
}

export function mode(plugin: VocabularyView, el: HTMLElement) {
    const container = el.querySelector('.reload-container') as HTMLElement;
    container.createEl('div', { cls: 'mode-div', text: plugin.mode === "random" ? i10n.random[userLang] : i10n.next[userLang] });
}

export function invert(plugin: VocabularyView, el: HTMLElement) {
    const container = el.querySelector('.reload-container') as HTMLElement;
    container.createEl('div', { cls: 'invert-div', text: plugin.invert ? i10n.invert[userLang] : i10n.normal[userLang] });
}
