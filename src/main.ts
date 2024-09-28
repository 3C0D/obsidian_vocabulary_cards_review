import { MarkdownPostProcessorContext, Notice, Plugin } from 'obsidian';
import "./styles.scss";
import { CardStat } from "./CardStat";
import { CardList } from "./CardList";
import { Settings } from './global';
import { i10n, userLang } from './i10n';
import { VocabularySettingTab } from './settingTab';
import { DEFAULT_SETTINGS } from './variables';
import { renderCard, renderTableBody } from './render';
import { getSource, handleContextMenu } from './utils';


export default class VocabularyView extends Plugin {
    settings: Settings
    viewedIds: string[] = []
    mode: "random" | "next" = 'random'
    invert = false
    autoMode = false
    autoModeTimer: NodeJS.Timeout | null = null

    async onload() {
        this.registerMarkdownCodeBlockProcessor("voca-table", async (source, el, ctx) => {
            await this.renderTable(source, el, ctx)
        })
        this.registerMarkdownCodeBlockProcessor("voca-card", async (source, el, ctx) => {
            await this.parseCodeBlock(el, ctx, source)
        })
        this.addSettingTab(new VocabularySettingTab(this.app, this));
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async parseCodeBlock(el: HTMLElement, ctx: MarkdownPostProcessorContext, source: string) {
        await this.loadSettings();

        if (!ctx) {
            new Notice(i10n.noContext[userLang]);
            return;
        }

        const contentAfter = await getSource(el, ctx);
        const cardList = new CardList(this, contentAfter);
        const cardStat = new CardStat(this, this.app, el, ctx, cardList);
        await renderCard(this, cardStat, cardList, el, ctx, contentAfter);
        el.addEventListener("contextmenu", (e) => handleContextMenu(e, this, el, ctx, source, cardStat, cardList, contentAfter));
    }

    async renderTable(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        source = await getSource(el, ctx) || '';
        const cardList = new CardList(this, source);
        renderTableBody(this, cardList, el, ctx);
        el.addEventListener("contextmenu", (e) => handleContextMenu(e, this, el, ctx, source));
    }
}