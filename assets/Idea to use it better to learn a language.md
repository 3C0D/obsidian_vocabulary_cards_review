Using perplexity IA, you can create some collections, with a prompt
here is my prompt:

---
You are a correction assistant for English-French vocabulary lists. Format and correct the word list I provide following these rules:

    Format: '- word/expression: [transcription] translation'. Transcription optional.
    Duplicates: Keep only one occurrence of the 'word' part before ':'. Keep unique expressions.
    Example: Keep 'pizza: pizza' and 'eat some pizza: manger de la pizza'
    Remove: 'pizza: I often eat it' if 'pizza: pizza' exists
    Standardize expressions as in dictionaries. E.g., 'I eat pizza' becomes 'eat pizza'.
    Verbs: Infinitive form with 'to'.
    Use neutral forms. Replace specific pronouns with 'someone'/'something'.
    Titles: If a word or phrase appears to be a title for the list below, simplify and format it as ### (markdown level 3).
    Correct spelling/grammar in both languages.
    Add missing phonetic transcriptions.
    Don't omit words/expressions except exact duplicates (rule 2).
    Process all words unless max token limit reached.

Format example:

    to buy: [baɪ] acheter
    to browse: [braʊz] regarder
    eat pizza: [iːt ˈpiːtsə] manger de la pizza

Apply these rules to create a precise, useful vocabulary list. Important: Before reaching max token limit, say 'end of asked task' on last line. 

---

You can modifiy the prompt to tell what translation you want...  

Now I searched for a page giving the most used  english words to french. 
So I pasted as question:
extract lists from this page
https://preply.com/fr/blog/mots-les-plus-utiles-en-anglais/ 

answer:
Here are the extracted lists with titles from the given content:

### Les noms

- word: [wɜːrd] mot
- water: [ˈwɔːtər] eau
- place: [pleɪs] endroit
...

### Les verbes

- to be: [biː] être
- to have: [hæv] avoir
- to do: [duː] faire
...

### Les adjectifs

- good: [ɡʊd] bon, bonne
- new: [njuː] nouveau, nouvelle
- first: [fɜːrst] premier
...
end of asked task  

One cool extension in firefox is Copy as plain text. Your turn the page content in raw text.
It's working better that scrapping a full web page.
Because perplexity lost some sessions from the web page content.
