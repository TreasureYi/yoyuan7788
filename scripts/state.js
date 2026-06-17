import { DEFAULT_STATE, STORAGE_KEY } from "./config.js";

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

export function setReminderFilter(filter) {
  state.preferences.reminderFilter = filter;
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

export function buildBackupPayload() {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      app: "yoyuan-ledger",
      version: 3,
      data: state
    },
    null,
    2
  );
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
      ...(raw?.preferences || {})
    },
    weather: {
      ...base.weather,
      ...(raw?.weather || {})
    }
  };
}

function normalizeReminder(entry) {
  return {
    id: String(entry?.id || crypto.randomUUID()),
    title: String(entry?.title || "").trim(),
    date: String(entry?.date || ""),
    category: String(entry?.category || "其他"),
    leadDays: Number(entry?.leadDays) || 3,
    notes: String(entry?.notes || "").trim(),
    createdAt: entry?.createdAt || new Date().toISOString()
  };
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

function clampReminderHour(hour) {
  const value = Number(hour);
  if (!Number.isFinite(value)) {
    return DEFAULT_STATE.salary.notification.hour;
  }

  return Math.min(Math.max(Math.trunc(value), 0), 23);
}
