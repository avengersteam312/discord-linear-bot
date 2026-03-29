import test from "node:test";
import assert from "node:assert/strict";

import { buildDescription, mapPriority } from "../dist/linearDescription.js";

test("mapPriority converts ticket priorities to Linear values", () => {
  assert.equal(mapPriority("urgent"), 1);
  assert.equal(mapPriority("high"), 2);
  assert.equal(mapPriority("medium"), 3);
  assert.equal(mapPriority("low"), 4);
  assert.equal(mapPriority("none"), undefined);
});

test("buildDescription includes key ticket sections and source link", () => {
  const description = buildDescription(
    {
      guildId: "123",
      guildName: "Guild",
      threadId: "456",
      threadName: "Safari login issue",
      messageCount: 4,
    },
    {
      title: "Login fails after refresh",
      issueType: "bug",
      summary: "Refreshing after login shows a blank screen.",
      stepsToReproduce: ["Login", "Refresh the page"],
      expectedBehavior: "User remains signed in.",
      actualBehavior: "Blank screen appears.",
      impact: "Blocks users from continuing.",
      openQuestions: ["Does this affect all browsers?"],
      priority: "high",
    },
  );

  assert.match(description, /## Type/);
  assert.match(description, /## Summary/);
  assert.match(description, /## Reproduction/);
  assert.match(description, /## Source/);
  assert.match(description, /https:\/\/discord\.com\/channels\/123\/456/);
});
