import { REST, Routes } from "discord.js";

import OpenAI from "openai";
import { LinearClient } from "@linear/sdk";

import { config } from "./config.js";

async function checkDiscord(): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(config.discordBotToken);
  const [botUser, application] = await Promise.all([
    rest.get(Routes.user("@me")),
    rest.get(Routes.currentApplication()),
  ]);

  const bot = botUser as { username?: string; id?: string };
  const app = application as { name?: string; id?: string };
  console.log(`Discord OK: bot=${bot.username ?? "unknown"} (${bot.id ?? "unknown"})`);
  console.log(`Discord app OK: app=${app.name ?? "unknown"} (${app.id ?? "unknown"})`);
}

async function checkLinear(): Promise<void> {
  const linearClient = new LinearClient({
    apiKey: config.linearApiKey,
  });

  const [viewer, team] = await Promise.all([
    linearClient.viewer,
    linearClient.team(config.linearTeamId),
  ]);

  if (!team) {
    throw new Error(`Linear team not found for LINEAR_TEAM_ID=${config.linearTeamId}`);
  }

  console.log(`Linear OK: viewer=${viewer.name} <${viewer.email}>`);
  console.log(`Linear team OK: ${team.name} (${team.id})`);
}

async function checkOpenAi(): Promise<void> {
  const openai = new OpenAI({
    apiKey: config.openAiApiKey,
  });

  await openai.models.retrieve(config.openAiModel);
  console.log(`OpenAI OK: model=${config.openAiModel}`);
}

async function main(): Promise<void> {
  await checkDiscord();
  await checkLinear();
  await checkOpenAi();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
