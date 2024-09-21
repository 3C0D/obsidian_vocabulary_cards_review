import { MarkdownPostProcessorContext } from 'obsidian';
import { Card } from "./Card";
import { reloadButton } from "./renderCardUtils";
import { CardList } from './CardList';
import VocabularyView from './main';
import { createEmpty } from './utils';

export function renderTableRow(tableBody: HTMLElement, word: Card) {
    const trEl = tableBody.createEl('tr');
    const derivative = trEl.createEl('td', { cls: 'voca-table_derivative' });

    derivative.createEl('span', { cls: 'voca-table_derivative-text', text: word.derivative });
    if (word.transcription) {
        renderTranscription(derivative, word.transcription);
    }

    const explanation = trEl.createEl('td', { cls: 'voca-table_explanation' });
    explanation.createEl('span', { 'text': word.explanation });
}

function renderTranscription(derivative: HTMLElement, transcription: string) {
    const transcriptionEl = derivative.createEl('span', { cls: 'voca-table_derivative-transcription' });
    transcriptionEl.createEl('span', { cls: 'voca-table_derivative-transcription-delimiter', text: '/' });
    transcriptionEl.createEl('span', { cls: 'voca-table_derivative-transcription-text', text: transcription });
    transcriptionEl.createEl('span', { cls: 'voca-table_derivative-transcription-delimiter', text: '/' });
}

export function renderTableBody(plugin: VocabularyView, cardList: CardList, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    el.innerHTML = '';
    const tableEl = el.createEl('table', { cls: "voca-table" });
    const tableBody = tableEl.createEl('tbody');

    if (cardList.length === 0) {
        createEmpty(tableBody);
    } else {
        for (const card of cardList) {
            if (!card) continue;
            renderTableRow(tableBody, card);
        }
    }

    reloadButton(plugin, el, cardList, ctx, 'table');
}