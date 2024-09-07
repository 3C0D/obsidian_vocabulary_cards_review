import { MarkdownPostProcessorContext } from "obsidian";
import { Card } from "./Card";
import { CardStat, PageStats } from "./CardStat";
import type VocabularyView  from './main';

export class CardList {
    cards: Card[] = [];
    currentCard: Card | undefined
    sourcePath: string;
    sourceFromLeaf: string;

    constructor(VocabularyView: VocabularyView, src: string, ctx: MarkdownPostProcessorContext,) {
        if (src) {
            this.parseSource(src);
        }
        this.currentCard = undefined;
        this.sourcePath = ctx.sourcePath
        this.sourceFromLeaf = VocabularyView.sourceFromLeaf
    }

    get length(): number {
        return this.cards.length;
    }

    push(card: Card): void {
        this.cards.push(card);
    }

    async cleanupSavedStats(cardStat: CardStat): Promise<void> {
        const stats = cardStat.stats
        if (!stats[this.sourcePath]) return;

        const currentDerivatives = new Set(this.cards.map(card => card.derivative));
        const statsToKeep: PageStats = {};

        for (const [derivative, stat] of Object.entries(stats[this.sourcePath])) {
            if (currentDerivatives.has(derivative)) {
                statsToKeep[derivative] = stat;
            }
        }

        stats[this.sourcePath] = statsToKeep;
        await cardStat.saveStats();
    }

    //usefull if adding a mode next card
    [Symbol.iterator] = () => {
        let index = 0;
        return {
            next: () => {
                if (index < this.length) {
                    return { value: this.cards[index++], done: false };
                } else {
                    return { done: true };
                }
            }
        };
    }

    updateSource(src: string): void {
        this.cards = [];
        this.parseSource(src);
    }

    private parseSource(src: string): void {
        const lines = src.split('\n');
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine) {
                const [word, ...restParts] = trimmedLine.split(':');
                const trimmedWord = word.trim();
                const rest = restParts.join(':').trim();

                let transcription = "";
                let explanation = "";

                if (this.sourceFromLeaf) {
                    const match = rest.match(/^\/(.+?)\/\s*(.*)$/);
                    if (match) {
                        transcription = match[1].trim();
                        explanation = match[2].trim();
                    } else {
                        explanation = rest;
                    }
                } else {
                    const match = rest.match(/^<(.+?)>\s*(.*)$/);
                    if (match) {
                        transcription = match[1].trim();
                        explanation = match[2].trim();
                    } else {
                        explanation = rest;
                    }
                }

                try {
                    const card = new Card(trimmedWord, transcription, explanation);
                    this.push(card);
                } catch (error) {
                    console.warn(`Skipping invalid card: ${trimmedWord}. Error: ${error.message}`);
                }
            }
        }
    }
}

