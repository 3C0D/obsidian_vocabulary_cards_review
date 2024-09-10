import { MarkdownPostProcessorContext } from "obsidian";
import { Card } from "./Card";
import type VocabularyView from './main';

export class CardList {
    cards: Card[] = [];
    currentCard: Card | undefined = undefined;
    sourcePath: string;

    constructor(public plugin: VocabularyView, public src: string, ctx: MarkdownPostProcessorContext) {
        if (src) {
            this.parseSource(src);
        }
        this.sourcePath = ctx.sourcePath
    }

    get length(): number {
        return this.cards.length;
    }

    push(card: Card): void {
        this.cards.push(card);
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

    parseSource(src: string): void {
        const lines = src.split('\n');
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine) {
                const [word, ...restParts] = trimmedLine.split(':');
                const trimmedWord = word.trim();
                const rest = restParts.join(':').trim();

                let transcription = "";
                let explanation = "";

                if (this.plugin.sourceFromLeaf) {
                    const match = rest.match(/^\[(.+?)\]\s*(.*)$/);
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

