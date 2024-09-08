import { i10n, userLang } from "./i10n";

export function renderError(error: string, el: HTMLElement) {
    const container = el.createEl('table', { cls: "voca-error" });

    container.createEl('div', { cls: 'voca-error_header', text: i10n.parseError[userLang] });

    container.createEl('div', { cls: 'voca-error_text', text: error });
}
