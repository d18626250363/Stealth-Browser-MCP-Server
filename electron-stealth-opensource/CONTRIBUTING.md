# Contributing to Electron Stealth

Thanks for your interest in contributing!

## Getting started

```bash
git clone https://github.com/electron-stealth/electron-stealth.git
cd electron-stealth
npm install
npm start
```

## Development workflow

1. Fork the repo and create a feature branch
2. Make your changes
3. Test by launching `npm start` and connecting via `node src/bridge.js`
4. Run `npm run build:portable` to verify the build
5. Open a PR with a clear description

## Code conventions

- ES modules (`import`/`export`) throughout
- No TypeScript — plain JavaScript with JSDoc for types where helpful
- CDP operations go through `BrowserController` methods in `tools.js`
- New MCP tools: add definition to `getToolDefinitions()`, handler to `handleToolCall()`, method to `BrowserController`
- Stealth patches go in `stealth.js` via `Page.addScriptToEvaluateOnNewDocument`

## Adding a new tool

1. Add the tool schema to `getToolDefinitions()` in `src/tools.js`
2. Add a `case` to `handleToolCall()` 
3. Add the CDP handler method to `BrowserController`
4. Update the tool table in `README.md`
5. If the tool introduces a new capability area, document it

## Reporting bugs

Open an issue with:
- OS and Electron version
- Steps to reproduce
- Expected vs actual behavior
- Any relevant console output or error messages

## Security

If you discover a security vulnerability, please report it privately via GitHub Security Advisories rather than opening a public issue.
