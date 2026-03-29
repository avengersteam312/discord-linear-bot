import type { ThreadContext, ThreadMessageInput, TicketDraft } from "./types.js";

const TITLE_MAX_LENGTH = 120;

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

export function cleanLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function cleanList(values: string[]): string[] {
  const seen = new Set<string>();

  return values
    .map(cleanLine)
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

export function normalizeTitle(title: string, threadName: string): string {
  const cleaned = cleanLine(title)
    .replace(/^(bug|issue|ticket|task|support)\s*[:\-]\s*/i, "")
    .replace(/\.$/, "");

  if (cleaned) {
    return truncate(cleaned, TITLE_MAX_LENGTH);
  }

  return truncate(cleanLine(threadName) || "Discord thread issue", TITLE_MAX_LENGTH);
}

export function fallbackSummary(messages: ThreadMessageInput[]): string {
  const latestContent = messages
    .map((message) => cleanLine(message.content))
    .filter(Boolean)
    .slice(-3);

  if (latestContent.length === 0) {
    return "Thread was summarized, but the discussion did not contain enough text to produce a reliable summary.";
  }

  return truncate(latestContent.join(" "), 500);
}

export function normalizeDraft(
  draft: TicketDraft,
  thread: ThreadContext,
  messages: ThreadMessageInput[],
): TicketDraft {
  const summary = cleanLine(draft.summary) || fallbackSummary(messages);

  return {
    title: normalizeTitle(draft.title, thread.threadName),
    issueType: draft.issueType,
    summary,
    stepsToReproduce: cleanList(draft.stepsToReproduce),
    expectedBehavior: cleanLine(draft.expectedBehavior),
    actualBehavior: cleanLine(draft.actualBehavior),
    impact: cleanLine(draft.impact),
    openQuestions: cleanList(draft.openQuestions),
    priority: draft.priority,
  };
}
