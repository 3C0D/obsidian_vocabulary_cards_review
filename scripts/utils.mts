import * as readline from 'readline';
import * as fs from 'fs/promises';

export function askQuestion(question: string, rl: readline.Interface): Promise<string> {
    return new Promise((resolve) => {
        rl.question(question, (input) => {
            resolve(input.trim());
        });
    });
}

export function cleanInput(inputStr: string): string {
    return inputStr.trim().replace(/["`]/g, "'").replace(/\r\n/g, '\n');
}

export async function isValidPath(path: string) {
    try {
        await fs.access(path.trim());
        return true;
    } catch (error) {
        return false;
    }
}

export async function copyFilesToTargetDir(vaultDir: string, scss: boolean, manifestId: string, real = "0") {

    if (real === "-1") return

    const outdir = `${vaultDir}/.obsidian/plugins/${manifestId}`;

    const man = `${outdir}/manifest.json`;
    const css = `${outdir}/styles.css`;
    const js = `${outdir}/main.js`;

    if (real === "1") {
        try {
            await fs.mkdir(outdir);
        } catch {
            null
        }
        try {
            await fs.copyFile("./styles.css", css);
        } catch  {
            null;
        }
        try {
            await fs.copyFile("./manifest.json", man);
            await fs.copyFile("./main.js", js);
        } catch (error) {
            console.log(error);
        }
        console.info(`\nInstalled in real vault ${outdir}\n`);
    }
    // real === "0"
    else {
        console.log("real === 0")
        try {
            await fs.mkdir(outdir);
        } catch {
            null;
        }
        if (!scss) {
            try {
                await fs.copyFile("./styles.css", css);
            } catch {
                null;
            }
        }
        await fs.copyFile("./manifest.json", man);
        console.info(`\nSaving plugin to ${outdir}\n`);
    }

}

