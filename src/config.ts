import dotenv from "dotenv";

dotenv.config({ quiet: true });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function numberFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value) || value <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer`);
  }

  return value;
}

export const config = {
  discordApplicationId: process.env.DISCORD_APPLICATION_ID,
  discordBotToken: required("DISCORD_BOT_TOKEN"),
  discordGuildId: process.env.DISCORD_GUILD_ID,
  linearApiKey: required("LINEAR_API_KEY"),
  linearTeamId: required("LINEAR_TEAM_ID"),
  openAiApiKey: required("OPENAI_API_KEY"),
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  threadMessageLimit: numberFromEnv("THREAD_MESSAGE_LIMIT", 25),
  maxMessageLength: numberFromEnv("MAX_MESSAGE_LENGTH", 1500),
} as const;
