import type { ThreadContext, TicketDraft, TicketPriority } from "./types.js";

export function mapPriority(priority: TicketPriority): number | undefined {
  switch (priority) {
    case "urgent":
      return 1;
    case "high":
      return 2;
    case "medium":
      return 3;
    case "low":
      return 4;
    case "none":
      return undefined;
  }
}

export function buildSourceLink(thread: ThreadContext): string | null {
  if (!thread.guildId) {
    return null;
  }

  return `https://discord.com/channels/${thread.guildId}/${thread.threadId}`;
}

export function buildDescription(thread: ThreadContext, draft: TicketDraft): string {
  const sections: string[] = [];

  sections.push("## Type");
  sections.push(draft.issueType);

  sections.push("## Summary");
  sections.push(draft.summary || "No clear summary was provided in the thread.");

  if (draft.stepsToReproduce.length > 0) {
    sections.push("## Reproduction");
    sections.push(draft.stepsToReproduce.map((step, index) => `${index + 1}. ${step}`).join("\n"));
  }

  if (draft.expectedBehavior) {
    sections.push("## Expected Behavior");
    sections.push(draft.expectedBehavior);
  }

  if (draft.actualBehavior) {
    sections.push("## Actual Behavior");
    sections.push(draft.actualBehavior);
  }

  if (draft.impact) {
    sections.push("## Impact");
    sections.push(draft.impact);
  }

  if (draft.openQuestions.length > 0) {
    sections.push("## Open Questions");
    sections.push(draft.openQuestions.map((question) => `- ${question}`).join("\n"));
  }

  const sourceLink = buildSourceLink(thread);
  sections.push("## Source");
  sections.push(
    [
      `- Discord thread: ${thread.threadName}`,
      `- Messages summarized: ${thread.messageCount}`,
      sourceLink ? `- Link: ${sourceLink}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return sections.join("\n\n");
}
