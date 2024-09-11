export class Card {
    private _rightCount = 0;
    private _wrongCount = 0;

    constructor(
        public readonly derivative: string,
        public readonly transcription: string,
        public readonly explanation: string
    ) {
        if (!this.isValid()) {
            throw new Error("Invalid card: derivative must be non-empty and at least one of transcription or explanation must be non-empty");
        }
    }

    get rightCount(): number {
        return this._rightCount;
    }

    get wrongCount(): number {
        return this._wrongCount;
    }

    isValid(): boolean {
        return this.derivative !== '' && (this.transcription !== '' || this.explanation !== '');
    }

    setRight(count: number): void {
        this._rightCount = Math.max(0, Math.min(count, 5));
    }

    setWrong(count: number): void {
        this._wrongCount = Math.max(0, Math.min(count, 5));
    }

    incrementRight(): void {
        this._rightCount = Math.min(this._rightCount + 1, 5);
    }

    incrementWrong(): void {
        this._wrongCount = Math.min(this._wrongCount + 1, 5);
    }

    reset(): void {
        this._rightCount = 0;
        this._wrongCount = 0;
    }
}