# Contributing

## Local Setup

```bash
npm install
npm test
npm run check:setup
```

Create a local `.env` from `.env.example` before running the bot.

## Development Workflow

- make focused changes
- keep `/ticket` behavior thread-only unless intentionally changing product scope
- avoid committing secrets, `dist/`, or `node_modules/`

## Verification

Before opening a pull request:

```bash
npm test
npm run build
```

If the change affects live behavior, also verify one `/ticket` flow in a real Discord thread.
