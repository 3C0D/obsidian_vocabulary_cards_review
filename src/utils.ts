import { MarkdownPostProcessorContext, Plugin } from "obsidian";
import { parseCardCodeBlock } from "./main";

export async function leafContent(plugin: Plugin, ctx: MarkdownPostProcessorContext) {
    const relativePath = ctx.sourcePath
    const file = plugin.app.vault.getFileByPath(relativePath)
    if (!file) return
    const content = await plugin.app.vault.read(file)
    return content
}

/**
 * Returns the content of the source code block or the content of the
 * underlying markdown page if the source code block is empty.
 *
 * @returns The content of the markdown page or the source code block (and set this.sourceFromLeaf)
 */
export async function getExtSource(source: string, plugin: Plugin, ctx: MarkdownPostProcessorContext) {
    this.sourceFromLeaf = ""

    // source has some content
    if (source.trim()) return source
    // else get content from the underlying markdown page    
    let content = await leafContent(plugin,ctx)
    if (!content) return ""

    // remove code blocks from the page content
    const codeBlockRegex = /^(?:```|~~~)([a-z0-9-+]*)\n([\s\S]*?)\n(?:```|~~~)$/gim;
    content = content.trim();
    content = content.replace(codeBlockRegex, '');
    source = content
        .split('\n')
        .filter(line => line.includes(':'))
        .map(line => line.trim().replace(/^[*\-+]\s*/, ''))
        .join('\n');

    this.sourceFromLeaf = source
    return source
}

export function createEmpty(el: HTMLElement) {
    const cardEl = el.createEl('div', { cls: "voca-card" });
    cardEl.createEl('div', { cls: 'voca-card-empty', text: 'No cards found.' });
}

export function reloadEmptyButton(plugin: Plugin, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    const reloadButton = el.createEl('button', { cls: 'voca-card_empty-reload', text: '↺' });
    reloadButton.addEventListener("click", async () => {
        await parseCardCodeBlock(plugin, this.sourceFromLeaf, el, ctx);
    });
}
