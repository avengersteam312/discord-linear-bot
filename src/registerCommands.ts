import { REST, Routes, SlashCommandBuilder } from "discord.js";

import { config } from "./config.js";

const commands = [
  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Summarize this thread with AI and create a Linear issue."),
].map((command) => command.toJSON());

async function resolveApplicationId(rest: REST): Promise<string> {
  if (config.discordApplicationId) {
    return config.discordApplicationId;
  }

  const application = (await rest.get(Routes.currentApplication())) as { id?: string };
  if (!application.id) {
    throw new Error("Could not resolve Discord application ID from the bot token");
  }

  return application.id;
}

async function main(): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(config.discordBotToken);
  const applicationId = await resolveApplicationId(rest);

  if (config.discordGuildId) {
    await rest.put(Routes.applicationGuildCommands(applicationId, config.discordGuildId), {
      body: commands,
    });

    console.log(`Registered /ticket in guild ${config.discordGuildId} for app ${applicationId}`);
    return;
  }

  await rest.put(Routes.applicationCommands(applicationId), {
    body: commands,
  });

  console.log(`Registered global /ticket command for app ${applicationId}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
