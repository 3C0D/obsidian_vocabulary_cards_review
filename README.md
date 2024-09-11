# Vocabulary cards

from [obsidian-vocabulary-cards](https://github.com/meniam/obsidian-vocabulary-cards)
Fixed and improved

![alt text](assets/example.jpg)

codeblock language voca-card or voca-table

### New features:

#### **Targeted Learning**

Cards are sorted by the number of errors, so cards with more errors are displayed first for targeted learning. The number of right and wrong answers is limited to 5. Cards with 5 right answers are rarely displayed when cards with 5 wrong answers are displayed often.  

#### **Empty codeblock**

If a code block is empty, it will be filled with the content from the markdown page below it. If there are multiple code blocks, each block will be filled with the content between them. 
Use [...] to indicate transcription.  
The **↺ button** is used to synchronize the code block after editing the markdown page.

In voca-table you can use `<...>` or `[...]` to indicate transcription.

#### **Each codeblock have an id**

Each code block is automatically assigned an ID to save statistics. Caution: avoid copying and pasting existing code blocks. If you do, immediately delete the ID to ensure the statistics are saved as a new code block.

## Development (Add this to your README)

### Optional (SASS):

If you add a `styles.scss` file to the `src` folder, it will automatically be converted to CSS when you run commands such as `npm run dev`.

### Environment Setup

- **Development in the plugins folder of your vault:**

  - Set the `REAL` variable to `-1` in the `.env` file. This indicates that you are developing your plugin directly in the plugins folder of your vault.

- **Development outside the vault:**
  - If your plugin's source code is outside the vault, set the `REAL` variable to `0` in the `.env` file. In this case, the necessary files, including `main.js`, will be automatically copied to the vault during development. During the build process, the JS and CSS files will be generated in the folder containing your source code. You can then push to GitHub and create a release directly from this folder using the commands listed below.

### Managing Vaults (IMPORTANT)

- Two vault paths are defined in the `.env` file:

  1. One for your **development vault** to protect your main vault.
  2. One for your **main vault**, where you can perform a real installation.

- The value of the REAL variable will change based on the command executed, adapting to the appropriate vault path.  

### Available Commands

- **`npm run dev` and `npm start`**: Used for development in your development vault. `npm start` opens Visual Studio Code, runs `npm install`, and then `npm run dev`, allowing for a quick start from the folder containing the source code.

- **`npm run build`**: Builds the project in the folder containing the source code.

- **`npm run real`**: Equivalent to a traditional installation of the plugin in your main vault. Note: `main.js` is generated via a build.

- **`npm run bacp`**: After development and before creating a release. `b` stands for build, and `acp` stands for add, commit, push. You will be prompted for the commit message.

- **`npm run acp`**: Performs add, commit, push without going through the build step.

- **`npm run version`**: Asks for the type of version update, modifies the relevant files, and then performs an add, commit, push. It makes sense to run this after `bacp`.

- **`npm run release`**: Asks for the release title and creates the release. This command works with the configurations in the `.github` folder. The title can be multiline by using `\n`.
