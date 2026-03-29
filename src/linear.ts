import { LinearClient } from "@linear/sdk";

import { config } from "./config.js";
import { buildDescription, mapPriority } from "./linearDescription.js";
import type { ThreadContext, TicketDraft } from "./types.js";

const linearClient = new LinearClient({
  apiKey: config.linearApiKey,
});

export interface LinearIssueResult {
  identifier: string;
  title: string;
  url: string;
}

export async function createLinearIssue(
  thread: ThreadContext,
  draft: TicketDraft,
): Promise<LinearIssueResult> {
  const payload = await linearClient.createIssue({
    teamId: config.linearTeamId,
    title: draft.title,
    description: buildDescription(thread, draft),
    priority: mapPriority(draft.priority),
  });

  if (!payload.success) {
    throw new Error("Linear did not confirm issue creation");
  }

  // @linear/sdk IssuePayload.issue is LinearFetch<Issue> (Promise): a lazy IssueQuery.fetch(id)
  // because the createIssue mutation fragment only includes issue { id }.
  const issueFetch = payload.issue;
  if (!issueFetch) {
    throw new Error("Linear did not return the created issue details");
  }
  const issue = await issueFetch;
  if (!issue.identifier || !issue.url || !issue.title) {
    throw new Error("Linear did not return the created issue details");
  }

  return {
    identifier: issue.identifier,
    title: issue.title,
    url: issue.url,
  };
}
