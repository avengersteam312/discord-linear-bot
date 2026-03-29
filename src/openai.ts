import OpenAI from "openai";

import { config } from "./config.js";
import { normalizeDraft } from "./draftUtils.js";
import type { ThreadContext, ThreadMessageInput, TicketDraft } from "./types.js";

const client = new OpenAI({
  apiKey: config.openAiApiKey,
});

const ticketSchema = {
  name: "discord_thread_ticket",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      title: {
        type: "string",
        description: "Short actionable issue title under 120 characters.",
      },
      issueType: {
        type: "string",
        enum: ["bug", "task", "support"],
      },
      summary: {
        type: "string",
        description: "One concise paragraph describing the problem or work item.",
      },
      stepsToReproduce: {
        type: "array",
        items: {
          type: "string",
        },
      },
      expectedBehavior: {
        type: "string",
      },
      actualBehavior: {
        type: "string",
      },
      impact: {
        type: "string",
      },
      openQuestions: {
        type: "array",
        items: {
          type: "string",
        },
      },
      priority: {
        type: "string",
        enum: ["none", "low", "medium", "high", "urgent"],
      },
    },
    required: [
      "title",
      "issueType",
      "summary",
      "stepsToReproduce",
      "expectedBehavior",
      "actualBehavior",
      "impact",
      "openQuestions",
      "priority",
    ],
  },
} as const;

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

function buildTranscript(messages: ThreadMessageInput[]): string {
  return messages
    .map((message) => {
      const lines = [
        `[${message.createdAt}] ${message.authorName}: ${truncate(message.content, config.maxMessageLength)}`,
      ];

      if (message.attachments.length > 0) {
        lines.push(`Attachments: ${message.attachments.join(", ")}`);
      }

      return lines.join("\n");
    })
    .join("\n\n");
}

export async function summarizeThread(
  thread: ThreadContext,
  messages: ThreadMessageInput[],
): Promise<TicketDraft> {
  const completion = await client.chat.completions.create({
    model: config.openAiModel,
    temperature: 0.2,
    response_format: {
      type: "json_schema",
      json_schema: ticketSchema,
    },
    messages: [
      {
        role: "system",
        content: [
          "You convert Discord support or engineering discussion threads into high-signal Linear issue drafts.",
          "Use only information that is explicitly present in the thread.",
          "Do not invent reproduction steps, expected behavior, actual behavior, impact, or open questions.",
          "Prefer omission over guessing: use empty strings or empty arrays when the thread does not support a field.",
          "Write a concise title that states the concrete problem or requested work.",
          "Do not prefix the title with words like bug, issue, ticket, task, or support.",
          "Keep the title under 120 characters and avoid vague titles like 'Fix login' unless the thread is truly that vague.",
          "The summary should be one short paragraph focused on the reported problem, affected area, and current state.",
          "Only include reproduction steps if they are explicitly described or clearly enumerated in the thread.",
          "Open questions should contain only unresolved questions that materially block implementation or triage.",
          "Set priority to urgent, high, medium, low, or none based on stated impact only. If impact is unclear, use none.",
          "Classify issueType as bug, task, or support.",
          "Return JSON only.",
        ].join(" "),
      },
      {
        role: "user",
        content: [
          `Thread name: ${thread.threadName}`,
          `Guild: ${thread.guildName ?? "Unknown guild"}`,
          `Messages included: ${thread.messageCount}`,
          "",
          "Write one Linear issue draft for a single default team.",
          "Latest messages may correct or narrow earlier messages in the thread.",
          "When the thread mixes multiple topics, focus on the main issue that dominates the discussion.",
          "",
          buildTranscript(messages),
        ].join("\n"),
      },
    ],
  });

  const content = completion.choices[0]?.message.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  return normalizeDraft(JSON.parse(content) as TicketDraft, thread, messages);
}
