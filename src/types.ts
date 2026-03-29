export type TicketPriority = "none" | "low" | "medium" | "high" | "urgent";

export interface ThreadMessageInput {
  authorName: string;
  createdAt: string;
  content: string;
  attachments: string[];
}

export interface ThreadContext {
  guildId: string | null;
  guildName: string | null;
  threadId: string;
  threadName: string;
  messageCount: number;
}

export interface TicketDraft {
  title: string;
  issueType: "bug" | "task" | "support";
  summary: string;
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  impact: string;
  openQuestions: string[];
  priority: TicketPriority;
}
