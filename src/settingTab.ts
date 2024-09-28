import { PluginSettingTab, App, Setting } from "obsidian";
import VocabularyView from "./main";
import { i10n, userLang } from "./i10n";

export class VocabularySettingTab extends PluginSettingTab {
    plugin: VocabularyView;

    constructor(app: App, plugin: VocabularyView) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h3', { text: 'Automatic Mode Settings' });

        new Setting(containerEl)
            .setName('Show Time')
            .setDesc(`${i10n.derivateTime[userLang]} (in seconds)`)
            .addSlider(slider => slider
                .setLimits(1, 5, 0.5)
                .setValue(this.plugin.settings.showTime)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.showTime = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Explain Time')
            .setDesc(`${i10n.explanationTime[userLang]} (in seconds)`)
            .addSlider(slider => slider
                .setLimits(1, 5, 0.5)
                .setValue(this.plugin.settings.explainTime)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.explainTime = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
        .setName('Disable confirmation buttons in automatic mode')
        .setDesc(`${i10n.disableConfirmationButtons[userLang]}`)
        .addToggle(toggle => toggle
            .setValue(this.plugin.settings.disableConfirmationButtons)
            .onChange(async (value) => {
                this.plugin.settings.disableConfirmationButtons = value;
                await this.plugin.saveSettings();
            }));
    }
}