import { Card } from "./Card";
import type VocabularyView from './main';

export class CardList {
    cards: Card[] = [];
    currentCard: Card | undefined = undefined;

    constructor(public plugin: VocabularyView, public src: string) {
        if (src) {
            this.parseSource(src);
        }
    }

    get length(): number {
        return this.cards.length;
    }

    push(card: Card): void {
        this.cards.push(card);
    }

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

    nextCard(): Card | undefined {
        if (this.cards.length === 0) return undefined;
        if (!this.currentCard) return this.cards[0];
        const currentIndex = this.cards.indexOf(this.currentCard);
        const nextIndex = (currentIndex + 1) % this.cards.length;
        this.currentCard = this.cards[nextIndex];
        return this.currentCard;
    }

    updateSource(src: string): void {
        this.cards = [];
        this.parseSource(src);
    }

    private parseSource(src: string): void {
        const lines = src.split('\n');
        for (const line of lines) {
            const card = this.parseLine(line);
            if (card) {
                this.push(card);
            }
        }
    }

    private parseLine(line: string): Card | null {
        // delete - or + or * + space at line start
        const trimmedLine = line.trim().replace(/^\s*[-+*]\s*/, '');
        if (!trimmedLine) return null;

        const [word, ...restParts] = trimmedLine.split(':');
        // delete * around
        const trimmedWord = word.trim().replace(/^\*+|\*+$/g, '');
        const rest = restParts.join(':').trim();

        const { transcription, explanation } = this.parseTranscriptionAndExplanation(rest);

        if (explanation) {
            try {
                // delete "**" around
                return new Card(trimmedWord, transcription, explanation.replace(/^\*+|\*+$/g, ''));
            } catch (error) {
                console.warn(`Skipping invalid card: ${trimmedWord}. Error: ${error.message}`);
            }
        }
        return null;
    }

    private parseTranscriptionAndExplanation(rest: string): { transcription: string, explanation: string } {
        let transcription = "";
        let explanation = "";

        // [transcription]
        const match = rest.match(/^\[(.+?)\]\s*(.*)$/);
        if (match) {
            transcription = match[1].trim();
            explanation = match[2].trim();
        } else {
            explanation = rest;
        }

        return { transcription, explanation };
    }
}
