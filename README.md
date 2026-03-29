# Discord Linear Bot

Open-source TypeScript bot for one focused workflow:

`/ticket` inside a Discord thread -> summarize the thread with OpenAI -> create a Linear issue -> reply with the Linear link.

## Architecture

- Discord slash command via `discord.js`
- OpenAI structured output for title and issue body draft
- Linear SDK for issue creation
- Optional Railway deploy as a long-running service

## Features

- `/ticket` only works in Discord threads
- Reads the latest thread messages and ignores bot/system messages
- Produces a structured issue draft with title, summary, reproduction, impact, and open questions
- Creates the issue in one configured Linear team
- Replies in Discord with the created issue key and URL

## Requirements

- Node.js 20+
- Discord application with a bot user
- Linear personal API key
- OpenAI API key

## Discord Setup

1. Create a Discord application in the [Discord Developer Portal](https://discord.com/developers/applications).
2. Add a bot user.
3. Copy the bot token into `DISCORD_BOT_TOKEN`.
4. In `OAuth2 -> URL Generator`, select:
   - Scopes: `bot`, `applications.commands`
   - Bot permissions: `View Channels`, `Send Messages`, `Read Message History`
5. Install the bot into your server.
6. Enable Developer Mode in Discord and copy the server ID into `DISCORD_GUILD_ID`.
7. If your server configuration requires it, enable `Message Content Intent` on the bot page.

`DISCORD_APPLICATION_ID` is optional. If omitted, the registration script resolves it from the bot token.

## Linear Setup

1. Create a personal API key in [Linear Settings -> Security & access](https://linear.app/settings/security-and-access).
2. Open the target team in Linear.
3. Press `Cmd/Ctrl + K`, run `Copy model UUID`, and paste that value into `LINEAR_TEAM_ID`.

## Environment

Copy `.env.example` to `.env` and fill in the values:

```env
DISCORD_BOT_TOKEN=
DISCORD_APPLICATION_ID=
DISCORD_GUILD_ID=

LINEAR_API_KEY=
LINEAR_TEAM_ID=

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

THREAD_MESSAGE_LIMIT=25
MAX_MESSAGE_LENGTH=1500
```

## Local Development

```bash
npm install
npm test
npm run check:setup
npm run register:commands
npm run dev
```

Production build:

```bash
npm run build
npm start
```

## Railway Deploy

Deploy this repo as a Railway service.

1. Create a new Railway project from this GitHub repository.
2. Use the repo root directly. No monorepo root override is required.
3. Set:
   - Build command: `npm run build`
   - Start command: `npm start`
4. Add all environment variables from `.env.example` into Railway Variables.
5. Deploy the service.

You do not need a public domain for this version because the bot connects to Discord over the Gateway.

## Validation

- `npm test` checks draft normalization and Linear description formatting
- `npm run check:setup` validates Discord, Linear, and OpenAI credentials
- Run `/ticket` inside a real Discord thread to confirm end-to-end behavior

## Security Notes

- Never commit `.env`
- Rotate any token immediately if it is exposed in chat, screenshots, shell history, or logs
- Use a dedicated Discord bot token, Linear API key, and OpenAI key for this app
- Review [SECURITY.md](./SECURITY.md) before publishing or deploying

## License

[MIT](./LICENSE)
