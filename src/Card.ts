export class Card {
    rightCount = 0;
    wrongCount = 0;

    constructor(
        public derivative: string,
        public transcription: string,
        public explanation: string
    ) {
        if (!this.isValid()) {
            throw new Error("Invalid card: derivative must be non-empty and at least one of transcription or explanation must be non-empty");
        }
    }

    isValid(): boolean {
        return this.derivative !== '' && (this.transcription !== '' || this.explanation !== '');
    }
    
    setRight(cnt: number): void {
        this.rightCount = cnt;
    }

    setWrong(cnt: number): void {
        this.wrongCount = cnt;
    }
}