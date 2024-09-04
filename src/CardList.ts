import { Card } from "./Card";

export class CardList {
    cards: Card[] = [];

    constructor(src: string) {
        if (src) {
            this.parseSource(src);
        }
    }

    get length(): number {
        return this.cards.length;
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

    private parseSource(src: string): void {
        const lines = src.split('\n');
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine) {
                const [word, rest] = trimmedLine.split(':');
                const trimmedWord = word.trim();

                if (rest === undefined) {
                    // Case where there's nothing after the colon
                    this.push(new Card(trimmedWord, "", ""));
                } else {
                    const trimmedRest = rest.trim();
                    const parts = trimmedRest.split('>');

                    if (parts.length > 1) {
                        const transcription = parts[0].substring(1).trim(); // Remove the opening '<'
                        const explanation = parts.slice(1).join('>').trim(); // Join the rest in case there are '>' in the explanation. peu probable...
                        this.push(new Card(trimmedWord, transcription, explanation));
                    } else {
                        // No transcription, everything is explanation
                        this.push(new Card(trimmedWord, "", trimmedRest));
                    }
                }
            }
        }
    }

    push(card: Card): void {
        this.cards.push(card);
    }

    getRandomWord(): Card {
        return this.cards[Math.floor(Math.random() * this.length)];
    }
    

}

