# GitaChat

## Installation
Install `bun`:
```bash
curl -fsSL https://bun.sh/install | bash
```

Install dependencies:
```bash
bun install
```

## Development
Run `bun run dev`. This will start the Next.js development server on `localhost:3000`, where you'll see changes live as you make them.

### Code style
Please create a `.vscode/settings.json` file and add these lines:
```json
{
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.detectIndentation": false,
  "editor.formatOnSave": true,
  "css.lint.unknownAtRules": "ignore",
  "[javascript][javascriptreact][typescript][typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
      "source.organizeImports": "explicit"
    }
  },
  "search.quickOpen.history.filterSortOrder": "recency",
  "files.exclude": {
    "**/dashboard": true,
  }
}
```
We use Prettier to format our code. You can install that in VSCode as an extension.