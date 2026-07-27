import { APP_THEMES, DEFAULT_STATE, DEFAULT_THEME, REMINDER_FILTERS, STORAGE_KEY } from "./config.js";

const state = loadState();

export function getState() {
  return state;
}

export function updateSalary(payload) {
  state.salary = {
    ...state.salary,
    ...payload,
    notification: {
      ...state.salary.notification,
      ...(payload.notification || {})
    }
  };
  persistState();
}

export function addReminder(payload) {
  state.reminders = [
    ...state.reminders,
    normalizeReminder({
      ...payload,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    })
  ];
  persistState();
}

export function deleteReminder(id) {
  state.reminders = state.reminders.filter((entry) => entry.id !== id);
  persistState();
}

export function setReminderCompletion(id, completed) {
  state.reminders = state.reminders.map((entry) => {
    if (entry.id !== id) {
      return entry;
    }

    return {
      ...entry,
      completed: Boolean(completed),
      completedAt: completed ? new Date().toISOString() : ""
    };
  });
  persistState();
}

export function setReminderFilter(filter) {
  state.preferences.reminderFilter = filter;
  persistState();
}

export function setTheme(theme) {
  state.preferences.theme = normalizeTheme(theme);
  persistState();
}

export function setCustomTheme(imageDataUrl, tone) {
  const previousPreferences = {
    ...state.preferences,
    customTheme: { ...state.preferences.customTheme }
  };
  state.preferences.customTheme = {
    imageDataUrl: String(imageDataUrl || ""),
    tone: tone === "light" ? "light" : "dark"
  };
  state.preferences.theme = "custom";
  try {
    persistState();
  } catch (error) {
    state.preferences = previousPreferences;
    throw new Error("存储空间不足，请选择一张更小的照片");
  }
}

export function clearCustomTheme() {
  state.preferences.customTheme = {
    imageDataUrl: "",
    tone: "dark"
  };
  if (state.preferences.theme === "custom") {
    state.preferences.theme = DEFAULT_THEME;
  }
  persistState();
}

export function setWeatherPending(city) {
  state.preferences.city = city;
  state.weather = {
    ...state.weather,
    status: "loading",
    error: ""
  };
  persistState();
}

export function setWeatherSuccess(city, payload) {
  state.preferences.city = city;
  state.weather = {
    status: "ready",
    payload,
    updatedAt: new Date().toISOString(),
    error: ""
  };
  persistState();
}

export function setWeatherFailure(city, message) {
  state.preferences.city = city;
  state.weather = {
    ...state.weather,
    status: "error",
    error: message
  };
  persistState();
}

export function replaceSyncedData(payload) {
  const normalized = normalizeState({
    ...state,
    salary: {
      ...state.salary,
      ...(payload?.salary || {}),
      notification: {
        ...state.salary.notification,
        leadDays: payload?.salary?.notification?.leadDays ?? state.salary.notification.leadDays
      }
    },
    reminders: Array.isArray(payload?.reminders) ? payload.reminders : state.reminders
  });

  state.salary = normalized.salary;
  state.reminders = normalized.reminders;
  persistState();
}

export function getSyncSnapshot() {
  return {
    version: 1,
    salary: {
      day: state.salary.day,
      amount: state.salary.amount,
      account: state.salary.account,
      notification: {
        leadDays: state.salary.notification.leadDays
      }
    },
    reminders: state.reminders,
    updatedAt: new Date().toISOString()
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return cloneDefaultState();
    }

    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch (error) {
    console.warn("Failed to load local state", error);
    return cloneDefaultState();
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("yoyuan:state-changed"));
}

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function normalizeState(raw) {
  const base = cloneDefaultState();
  return {
    salary: {
      ...base.salary,
      ...(raw?.salary || {}),
      day: clampPayday(raw?.salary?.day),
      notification: {
        ...base.salary.notification,
        ...(raw?.salary?.notification || {}),
        leadDays: clampLeadDays(raw?.salary?.notification?.leadDays),
        hour: clampReminderHour(raw?.salary?.notification?.hour),
        timezone: String(raw?.salary?.notification?.timezone || base.salary.notification.timezone),
        permission: String(raw?.salary?.notification?.permission || base.salary.notification.permission),
        endpoint: String(raw?.salary?.notification?.endpoint || ""),
        lastSyncedAt: String(raw?.salary?.notification?.lastSyncedAt || ""),
        lastTestedAt: String(raw?.salary?.notification?.lastTestedAt || ""),
        lastError: String(raw?.salary?.notification?.lastError || "")
      }
    },
    reminders: Array.isArray(raw?.reminders) ? raw.reminders.map(normalizeReminder) : [],
    preferences: {
      ...base.preferences,
      ...(raw?.preferences || {}),
      theme: normalizeTheme(raw?.preferences?.theme),
      reminderFilter: normalizeReminderFilter(raw?.preferences?.reminderFilter),
      customTheme: normalizeCustomTheme(raw?.preferences?.customTheme)
    },
    weather: {
      ...base.weather,
      ...(raw?.weather || {})
    }
  };
}

function normalizeTheme(theme) {
  const value = String(theme || DEFAULT_THEME);
  return Object.hasOwn(APP_THEMES, value) ? value : DEFAULT_THEME;
}

function normalizeReminder(entry) {
  return {
    id: String(entry?.id || crypto.randomUUID()),
    title: String(entry?.title || "").trim(),
    date: String(entry?.date || ""),
    category: String(entry?.category || "其他"),
    leadDays: clampReminderLeadDays(entry?.leadDays),
    hour: clampReminderHour(entry?.hour),
    notificationEnabled: Boolean(entry?.notificationEnabled),
    notes: String(entry?.notes || "").trim(),
    createdAt: entry?.createdAt || new Date().toISOString(),
    completed: Boolean(entry?.completed),
    completedAt: entry?.completed ? String(entry?.completedAt || entry?.createdAt || "") : ""
  };
}

function normalizeCustomTheme(theme) {
  return {
    imageDataUrl: String(theme?.imageDataUrl || ""),
    tone: theme?.tone === "light" ? "light" : "dark"
  };
}

function normalizeReminderFilter(filter) {
  const value = String(filter || REMINDER_FILTERS.all);
  return Object.values(REMINDER_FILTERS).includes(value) ? value : REMINDER_FILTERS.all;
}

function clampPayday(day) {
  const value = Number(day);
  if (!Number.isFinite(value)) {
    return DEFAULT_STATE.salary.day;
  }

  return Math.min(Math.max(Math.trunc(value), 1), 28);
}

function clampLeadDays(day) {
  const value = Number(day);
  if (!Number.isFinite(value)) {
    return DEFAULT_STATE.salary.notification.leadDays;
  }

  return Math.min(Math.max(Math.trunc(value), 0), 7);
}

function clampReminderLeadDays(day) {
  const value = Number(day);
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(Math.trunc(value), 0), 30);
}

function clampReminderHour(hour) {
  const value = Number(hour);
  if (!Number.isFinite(value)) {
    return DEFAULT_STATE.salary.notification.hour;
  }

  return Math.min(Math.max(Math.trunc(value), 0), 23);
}
