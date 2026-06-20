const DAY_MS = 86400000;

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function parseDateInput(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatLocalDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateLong(value) {
  const date = typeof value === "string" ? parseDateInput(value) : value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
}

export function formatDateWithWeekday(value) {
  const date = typeof value === "string" ? parseDateInput(value) : value;
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(date);
}

export function formatTime(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function getNextSalaryDate(dayOfMonth, reference = new Date()) {
  const current = startOfDay(reference);
  const candidate = getSalaryExecutionDate(reference.getFullYear(), reference.getMonth(), dayOfMonth);

  if (candidate >= current) {
    return candidate;
  }

  return getSalaryExecutionDate(reference.getFullYear(), reference.getMonth() + 1, dayOfMonth);
}

export function getDaysUntil(value, reference = new Date()) {
  const target = typeof value === "string" ? parseDateInput(value) : value;
  const current = startOfDay(reference);
  return Math.ceil((startOfDay(target) - current) / DAY_MS);
}

export function formatCountdown(days) {
  if (days < 0) {
    return `逾期 ${Math.abs(days)} 天`;
  }

  if (days === 0) {
    return "今天";
  }

  return `${days} 天`;
}

export function getSalaryCycleProgress(dayOfMonth, reference = new Date()) {
  const nextSalaryDate = getNextSalaryDate(dayOfMonth, reference);
  const daysUntil = getDaysUntil(nextSalaryDate, reference);

  if (daysUntil <= 0) {
    return 1;
  }

  const current = startOfDay(reference);
  let lastSalaryDate = getSalaryExecutionDate(reference.getFullYear(), reference.getMonth(), dayOfMonth);

  if (lastSalaryDate >= current) {
    lastSalaryDate = getSalaryExecutionDate(reference.getFullYear(), reference.getMonth() - 1, dayOfMonth);
  }

  const totalDays = Math.max(1, Math.ceil((startOfDay(nextSalaryDate) - lastSalaryDate) / DAY_MS));
  return Math.min(1, Math.max(0, (totalDays - daysUntil) / totalDays));
}

export function getReminderTone(days) {
  if (days < 0) {
    return "overdue";
  }

  if (days === 0) {
    return "today";
  }

  if (days <= 7) {
    return "soon";
  }

  return "planned";
}

export function buildSalaryAgenda(dayOfMonth, count = 4) {
  const items = [];
  const now = new Date();

  for (let index = 0; index < count; index += 1) {
    const candidate = getSalaryExecutionDate(now.getFullYear(), now.getMonth() + index, dayOfMonth);
    items.push({
      id: `salary-${formatLocalDateInput(candidate)}`,
      type: "salary",
      title: "发薪日",
      date: formatLocalDateInput(candidate),
      notes: "月度薪资节点"
    });
  }

  return items;
}

export function buildAgendaItems(reminders, salaryDay, count = 8) {
  const reminderItems = reminders.map((entry) => ({
    id: entry.id,
    type: "reminder",
    title: entry.title,
    date: entry.date,
    notes: entry.notes,
    category: entry.category
  }));

  return [...reminderItems, ...buildSalaryAgenda(salaryDay, 4)]
    .filter((entry) => {
      const days = getDaysUntil(entry.date);
      return days >= 0 && days <= 30;
    })
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(0, count);
}

function getSalaryExecutionDate(year, month, dayOfMonth) {
  const candidate = startOfDay(new Date(year, month, dayOfMonth));
  return moveWeekendBackward(candidate);
}

function moveWeekendBackward(date) {
  const day = date.getDay();

  if (day === 6) {
    return startOfDay(new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1));
  }

  if (day === 0) {
    return startOfDay(new Date(date.getFullYear(), date.getMonth(), date.getDate() - 2));
  }

  return date;
}
