import assert from "node:assert/strict";
import test from "node:test";

import { normalizeReminderPushRules } from "../functions/_utils/push.js";
import { applyFilter } from "../scripts/views/render.js";

test("completed reminders are excluded from server push rules", () => {
  const payload = normalizeReminderPushRules({
    installationId: "device-1",
    reminders: [
      {
        id: "pending",
        title: "续费",
        date: "2099-08-10",
        notificationEnabled: true,
        completed: false
      },
      {
        id: "completed",
        title: "已处理账单",
        date: "2099-08-11",
        notificationEnabled: true,
        completed: true
      }
    ]
  });

  assert.equal(payload.reminders.length, 1);
  assert.equal(payload.reminders[0].reminderId, "pending");
});

test("default and overdue views exclude completed reminders", () => {
  const reminders = [
    { id: "pending", date: "2099-08-10", completed: false },
    { id: "overdue", date: "2020-08-10", completed: false },
    { id: "completed", date: "2020-08-10", completed: true, completedAt: "2026-07-27T09:00:00.000Z" }
  ];

  assert.deepEqual(applyFilter(reminders, "all").map((entry) => entry.id), ["pending", "overdue"]);
  assert.deepEqual(applyFilter(reminders, "overdue").map((entry) => entry.id), ["overdue"]);
  assert.deepEqual(applyFilter(reminders, "completed").map((entry) => entry.id), ["completed"]);
});
