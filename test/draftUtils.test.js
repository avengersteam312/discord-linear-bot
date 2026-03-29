import test from "node:test";
import assert from "node:assert/strict";

import { cleanList, normalizeDraft, normalizeTitle } from "../dist/draftUtils.js";

test("normalizeTitle strips noisy prefixes and punctuation", () => {
  assert.equal(normalizeTitle("Bug: Login fails on refresh.", "thread"), "Login fails on refresh");
});

test("normalizeDraft deduplicates list fields and falls back to thread summary", () => {
  const draft = {
    title: "Issue:   ",
    issueType: "bug",
    summary: "   ",
    stepsToReproduce: ["Refresh after login", "Refresh after login", "  "],
    expectedBehavior: " Stay signed in ",
    actualBehavior: " Blank screen ",
    impact: " Blocks sign-in ",
    openQuestions: ["Does it affect Safari only?", "does it affect safari only?"],
    priority: "high",
  };

  const thread = {
    guildId: "guild-1",
    guildName: "Guild",
    threadId: "thread-1",
    threadName: "Safari login issue",
    messageCount: 3,
  };

  const messages = [
    {
      authorName: "Alice",
      createdAt: "2026-03-27T00:00:00.000Z",
      content: "Login works initially",
      attachments: [],
    },
    {
      authorName: "Bob",
      createdAt: "2026-03-27T00:01:00.000Z",
      content: "Refreshing breaks the session",
      attachments: [],
    },
  ];

  assert.deepEqual(normalizeDraft(draft, thread, messages), {
    title: "Safari login issue",
    issueType: "bug",
    summary: "Login works initially Refreshing breaks the session",
    stepsToReproduce: ["Refresh after login"],
    expectedBehavior: "Stay signed in",
    actualBehavior: "Blank screen",
    impact: "Blocks sign-in",
    openQuestions: ["Does it affect Safari only?"],
    priority: "high",
  });
});
