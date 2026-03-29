import {
  Client,
  Events,
  GatewayIntentBits,
  type ChatInputCommandInteraction,
  type Message,
} from "discord.js";

import { config } from "./config.js";
import { createLinearIssue } from "./linear.js";
import { summarizeThread } from "./openai.js";
import type { ThreadContext, ThreadMessageInput } from "./types.js";

function formatMessage(message: Message): ThreadMessageInput | null {
  if (message.author.bot || message.system) {
    return null;
  }

  const attachmentUrls = message.attachments.map((attachment) => attachment.url);
  const content = message.cleanContent.trim();
  if (!content && attachmentUrls.length === 0) {
    return null;
  }

  return {
    authorName: message.member?.displayName ?? message.author.globalName ?? message.author.username,
    createdAt: message.createdAt.toISOString(),
    content: content || "[Attachment only]",
    attachments: attachmentUrls,
  };
}

function truncateThreadName(value: string, maxLength: number): string {
  const clean = value.trim();
  if (clean.length === 0) {
    return "Ticket";
  }
  if (clean.length <= maxLength) {
    return clean;
  }
  return `${clean.slice(0, maxLength - 1)}…`;
}

async function loadThreadMessages(
  interaction: ChatInputCommandInteraction,
): Promise<{ thread: ThreadContext; messages: ThreadMessageInput[] }> {
  const channel = interaction.channel;
  if (!channel) {
    throw new Error("This command must be used in a channel or thread.");
  }

  if (!channel.isThread()) {
    if (!channel.isTextBased()) {
      throw new Error("This command can only be used in text channels or threads.");
    }

    const recent = await channel.messages.fetch({ limit: config.threadMessageLimit });
    const starter = recent
      .filter((message) => !message.author.bot && !message.system)
      .sort((left, right) => right.createdTimestamp - left.createdTimestamp)
      .first();

    if (!starter) {
      throw new Error("No recent user message found to create a thread from.");
    }

    const baseName = starter.cleanContent || `${starter.author.username} ticket`;
    const threadName = truncateThreadName(`Ticket: ${baseName}`, 90);
    const thread = await starter.startThread({
      name: threadName,
      autoArchiveDuration: 1440,
    });

    const fetched = await thread.messages.fetch({ limit: config.threadMessageLimit });
    const messages = fetched
      .sort((left, right) => left.createdTimestamp - right.createdTimestamp)
      .map(formatMessage)
      .filter((message): message is ThreadMessageInput => message !== null);

    const starterInput = formatMessage(starter);
    const hasStarter = starterInput
      ? messages.some((message) => message.createdAt === starterInput.createdAt)
      : false;

    if (starterInput && !hasStarter) {
      messages.unshift(starterInput);
    }

    if (messages.length === 0) {
      throw new Error("No user messages were found in the new thread.");
    }

    return {
      thread: {
        guildId: interaction.guildId,
        guildName: interaction.guild?.name ?? null,
        threadId: thread.id,
        threadName: thread.name,
        messageCount: messages.length,
      },
      messages,
    };
  }

  const fetched = await channel.messages.fetch({ limit: config.threadMessageLimit });
  const messages = fetched
    .sort((left, right) => left.createdTimestamp - right.createdTimestamp)
    .map(formatMessage)
    .filter((message): message is ThreadMessageInput => message !== null);

  if (messages.length === 0) {
    throw new Error("No user messages were found in this thread.");
  }

  return {
    thread: {
      guildId: interaction.guildId,
      guildName: interaction.guild?.name ?? null,
      threadId: channel.id,
      threadName: channel.name,
      messageCount: messages.length,
    },
    messages,
  };
}

async function handleTicketCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const { thread, messages } = await loadThreadMessages(interaction);
  const draft = await summarizeThread(thread, messages);
  const issue = await createLinearIssue(thread, draft);

  await interaction.editReply({
    content: [
      `Created [${issue.identifier}](${issue.url})`,
      `**${issue.title}**`,
    ].join("\n"),
    allowedMentions: { parse: [] },
  });
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Discord bot logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "ticket") {
    return;
  }

  try {
    await handleTicketCommand(interaction);
  } catch (error) {
    console.error(error);

    const content = `Ticket creation failed: ${error instanceof Error ? error.message : "Unexpected error"}`;
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content });
      } else {
        await interaction.reply({ content, ephemeral: true });
      }
    } catch (replyError) {
      console.error("Failed to notify user about ticket error:", replyError);
    }
  }
});

client.login(config.discordBotToken).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
