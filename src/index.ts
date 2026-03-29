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

async function loadThreadMessages(
  interaction: ChatInputCommandInteraction,
): Promise<{ thread: ThreadContext; messages: ThreadMessageInput[] }> {
  const channel = interaction.channel;
  if (!channel || !channel.isThread()) {
    throw new Error("Run `/ticket` inside a thread.");
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
