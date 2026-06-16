import { buildSalaryAgenda } from "../utils/date.js";

export function exportBoardCalendar(state) {
  const salaryEntries = buildSalaryAgenda(state.salary.day, 6).map((entry) => ({
    ...entry,
    category: "收入",
    notes:
      [state.salary.amount ? `金额：${state.salary.amount}` : "", state.salary.account ? `账户：${state.salary.account}` : ""]
        .filter(Boolean)
        .join(" / ") || entry.notes
  }));

  const payload = createCalendarPayload([
    ...state.reminders.map((entry) => ({
      id: entry.id,
      title: entry.title,
      date: entry.date,
      category: entry.category,
      notes: entry.notes
    })),
    ...salaryEntries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      date: entry.date,
      category: entry.category,
      notes: entry.notes
    }))
  ]);

  downloadBlob("yoyuan-ledger.ics", payload, "text/calendar;charset=utf-8");
}

export function exportSingleReminder(reminder) {
  const payload = createCalendarPayload([
    {
      id: reminder.id,
      title: reminder.title,
      date: reminder.date,
      category: reminder.category,
      notes: reminder.notes
    }
  ]);

  downloadBlob(`${slugify(reminder.title)}.ics`, payload, "text/calendar;charset=utf-8");
}

export function downloadText(name, contents, mimeType) {
  downloadBlob(name, contents, mimeType);
}

function createCalendarPayload(entries) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Yoyuan Ledger//CN",
    "CALSCALE:GREGORIAN"
  ];

  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  entries.forEach((entry) => {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${entry.id}@yoyuan-ledger`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART;VALUE=DATE:${entry.date.replaceAll("-", "")}`);
    lines.push(`SUMMARY:${escapeIcs(entry.title)}`);
    lines.push(`DESCRIPTION:${escapeIcs(`${entry.category || ""} ${entry.notes || ""}`.trim())}`);
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function downloadBlob(filename, contents, mimeType) {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replaceAll(/\s+/g, "-")
    .replaceAll(/[^\w-]/g, "");
}

function escapeIcs(value) {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;")
    .replaceAll("\n", "\\n");
}
