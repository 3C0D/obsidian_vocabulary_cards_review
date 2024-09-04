import * as readline from 'readline';
import * as fs from 'fs/promises';
import path from 'path';

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

export async function copyFilesToTargetDir(targetDir: string, ...files: string[]) {
    try {
        // create the target directory if it doesn't exist
        await fs.mkdir(targetDir, { recursive: true });

        // copy the files
        for (const file of files) {
            try {
                const fileName = path.basename(file);
                const dest = path.join(targetDir, fileName);

                // check if the file exists
                try {
                    await fs.access(file);
                } catch (error) {
                    if (file.endsWith('styles.css')) {
                        continue;
                    } else {
                        throw error;
                    }
                }

                await fs.copyFile(file, dest);
            } catch (error) {
                console.error(`Failed to copy ${file}:`, error);
            }
        }
    } catch (error) {
        console.error('Failed to create target directory or copy files:', error);
    }
}