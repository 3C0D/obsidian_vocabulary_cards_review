export class Card {
    rightCount = 0;
    wrongCount = 0;

    constructor(
        public derivative: string,
        public transcription: string,
        public explanation: string
    ) { }

    setRight(cnt: number): void {
        this.rightCount = cnt;
    }

    setWrong(cnt: number): void {
        this.wrongCount = cnt;
    }
}