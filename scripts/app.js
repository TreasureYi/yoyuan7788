import { APP_META, REMINDER_FILTERS } from "./config.js";
import {
  addReminder,
  buildBackupPayload,
  deleteReminder,
  getState,
  setReminderFilter,
  setWeatherFailure,
  setWeatherPending,
  setWeatherSuccess,
  updateSalary
} from "./state.js";
import { exportBoardCalendar, exportSingleReminder, downloadText } from "./services/calendar.js";
import {
  disableSalaryPushNotifications,
  enableSalaryPushNotifications,
  getCurrentPushSubscription,
  isStandaloneExperience,
  sendLocalTestNotification,
  supportsPushNotifications,
  syncSalaryPushRule
} from "./services/push.js";
import { fetchWeatherReportByCoordinates } from "./services/weather.js";
import {
  createRefs,
  populateSalaryOptions,
  renderDashboard,
  renderOverviewWeather,
  renderPushPanel,
  renderReminderBoard,
  renderSalaryPanel
} from "./views/render.js";
import { createShell } from "./views/shell.js";

let deferredInstallPrompt = null;
let activeView = "overview";

boot();

function boot() {
  document.title = APP_META.productName;
  const root = document.querySelector("#app");
  root.innerHTML = createShell();

  const refs = createRefs(document);
  const state = getState();

  populateSalaryOptions(refs.salaryDaySelect, state.salary.day);
  bindEvents(refs);
  renderAll(refs);
  registerServiceWorker();
  hydratePushSubscription(refs);
  hydrateDefaultWeather(refs, state);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    refs.installButton.textContent = "立即安装";
  });
}

function bindEvents(refs) {
  const root = document.querySelector("#app");

  root?.addEventListener("click", (event) => {
    const weatherButton = event.target instanceof Element ? event.target.closest("[data-refresh-weather]") : null;
    if (weatherButton) {
      refreshWeather(refs);
      return;
    }

    const button = event.target instanceof Element ? event.target.closest("[data-switch-view]") : null;
    if (!button) {
      return;
    }
    const nextView = button.dataset.switchView;
    if (!nextView) {
      return;
    }
    setActiveView(refs, nextView);
  });

  refs.salaryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const notification = getNotificationFormState(refs);
    updateSalary({
      day: Number(refs.salaryDaySelect.value),
      amount: refs.salaryAmountInput.value.trim(),
      account: refs.salaryAccountInput.value.trim(),
      notification
    });
    renderAll(refs);
    syncExistingPushSubscription(refs);
  });

  refs.reminderForm.addEventListener("submit", (event) => {
    event.preventDefault();

    addReminder({
      title: refs.reminderTitleInput.value.trim(),
      date: refs.reminderDateInput.value,
      category: refs.reminderCategoryInput.value,
      leadDays: Number(refs.reminderLeadDaysInput.value) || 3,
      notes: refs.reminderNotesInput.value.trim()
    });

    refs.reminderForm.reset();
    refs.reminderCategoryInput.value = "账单";
    refs.reminderLeadDaysInput.value = "3";
    renderAll(refs);
    setActiveView(refs, "overview");
  });

  refs.installButton.addEventListener("click", async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      refs.installButton.textContent = "安装已触发";
      return;
    }

    refs.installButton.textContent = "请在 Safari 中分享并添加";
  });

  refs.calendarExportButton.addEventListener("click", () => {
    exportBoardCalendar(getState());
  });

  refs.backupExportButton.addEventListener("click", () => {
    downloadText("yoyuan-ledger-backup.json", buildBackupPayload(), "application/json;charset=utf-8");
  });

  refs.pushEnableButton.addEventListener("click", async () => {
    const state = getState();
    const nextNotification = getNotificationFormState(refs);

    updateSalary({
      notification: {
        ...state.salary.notification,
        ...nextNotification,
        lastError: ""
      }
    });
    renderAll(refs);

    try {
      const result = await enableSalaryPushNotifications({
        day: state.salary.day,
        leadDays: nextNotification.leadDays
      });

      updateSalary({
        notification: {
          ...getState().salary.notification,
          ...nextNotification,
          enabled: true,
          permission: "granted",
          endpoint: result.endpoint,
          lastSyncedAt: new Date().toISOString(),
          lastError: ""
        }
      });
    } catch (error) {
      updateSalary({
        notification: {
          ...getState().salary.notification,
          ...nextNotification,
          enabled: false,
          permission: typeof Notification === "undefined" ? "default" : Notification.permission,
          lastError: error.message
        }
      });
    }

    renderAll(refs);
  });

  refs.pushDisableButton.addEventListener("click", async () => {
    try {
      await disableSalaryPushNotifications();
      updateSalary({
        notification: {
          ...getState().salary.notification,
          enabled: false,
          endpoint: "",
          permission: typeof Notification === "undefined" ? "default" : Notification.permission,
          lastError: "",
          lastSyncedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      updateSalary({
        notification: {
          ...getState().salary.notification,
          lastError: error.message
        }
      });
    }

    renderAll(refs);
  });

  refs.pushTestButton.addEventListener("click", async () => {
    try {
      const result = await sendLocalTestNotification();
      updateSalary({
        notification: {
          ...getState().salary.notification,
          permission: result.permission,
          lastTestedAt: new Date().toISOString(),
          lastError: ""
        }
      });
    } catch (error) {
      updateSalary({
        notification: {
          ...getState().salary.notification,
          permission: typeof Notification === "undefined" ? "default" : Notification.permission,
          lastError: error.message
        }
      });
    }

    renderAll(refs);
  });

  refs.filters.forEach((button) => {
    button.addEventListener("click", () => {
      setReminderFilter(button.dataset.filter || REMINDER_FILTERS.all);
      renderReminderBoard(getState(), refs);
    });
  });

  refs.reminderList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const action = target.dataset.action;
    const id = target.dataset.id;
    if (!action || !id) {
      return;
    }

    const reminder = getState().reminders.find((entry) => entry.id === id);
    if (!reminder) {
      return;
    }

    if (action === "delete") {
      deleteReminder(id);
      renderAll(refs);
      return;
    }

    if (action === "export") {
      exportSingleReminder(reminder);
    }
  });
}

function renderAll(refs) {
  const state = getState();
  renderDashboard(state, refs);
  renderSalaryPanel(state, refs);
  renderPushPanel(state, refs, getPushCapabilities());
  renderOverviewWeather(state, refs);
  renderReminderBoard(state, refs);
  syncViewState(refs);
}

async function hydrateDefaultWeather(refs, state) {
  if (!shouldAutoRefreshWeather(state)) {
    return;
  }

  try {
    await refreshWeather(refs);
  } catch (error) {
    console.warn("Default weather hydration failed", error);
  }
}

async function refreshWeather(refs) {
  const label = "当前位置";
  setWeatherPending(label);
  renderAll(refs);

  try {
    const payload = await fetchWeatherFromCurrentPosition();
    setWeatherSuccess(payload.city || label, payload);
  } catch (error) {
    setWeatherFailure(label, error.message);
  }

  renderAll(refs);
}

function setActiveView(refs, nextView, { scroll = true } = {}) {
  activeView = nextView;
  syncViewState(refs);

  if (scroll) {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }
}

function syncViewState(refs) {
  refs.views.forEach((view) => {
    const isActive = view.dataset.view === activeView;
    view.hidden = !isActive;
    view.classList.toggle("is-active", isActive);
  });

  refs.tabButtons.forEach((button) => {
    const isActive = button.dataset.switchView === activeView;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("Service worker registration failed", error);
    });
  });
}

async function hydratePushSubscription(refs) {
  if (!supportsPushNotifications()) {
    renderAll(refs);
    return;
  }

  try {
    const subscription = await getCurrentPushSubscription();
    const permission = typeof Notification === "undefined" ? "default" : Notification.permission;
    updateSalary({
      notification: {
        ...getState().salary.notification,
        permission,
        endpoint: subscription?.endpoint || "",
        enabled: Boolean(subscription?.endpoint) && permission === "granted",
        lastError: ""
      }
    });
  } catch (error) {
    updateSalary({
      notification: {
        ...getState().salary.notification,
        permission: typeof Notification === "undefined" ? "default" : Notification.permission,
        lastError: error.message
      }
    });
  }

  renderAll(refs);
}

async function syncExistingPushSubscription(refs) {
  if (!supportsPushNotifications()) {
    return;
  }

  const notification = getState().salary.notification;
  if (!notification.enabled || Notification.permission !== "granted") {
    return;
  }

  try {
    const result = await syncSalaryPushRule({
      day: getState().salary.day,
      leadDays: notification.leadDays
    });

    if (result?.endpoint) {
      updateSalary({
        notification: {
          ...getState().salary.notification,
          endpoint: result.endpoint,
          lastSyncedAt: new Date().toISOString(),
          lastError: ""
        }
      });
      renderAll(refs);
    }
  } catch (error) {
    updateSalary({
      notification: {
        ...getState().salary.notification,
        lastError: error.message
      }
    });
    renderAll(refs);
  }
}

function getNotificationFormState(refs) {
  return {
    leadDays: Number(refs.pushLeadDaysInput.value) || 0,
    hour: 9,
    timezone: "Asia/Shanghai",
    permission: typeof Notification === "undefined" ? "default" : Notification.permission
  };
}

function getPushCapabilities() {
  return {
    supported: supportsPushNotifications(),
    standalone: typeof window !== "undefined" ? isStandaloneExperience() : false
  };
}

function shouldAutoRefreshWeather(state) {
  if (state.weather?.status !== "ready" || state.weather?.payload?.country !== "自动定位") {
    return true;
  }

  const updatedAt = new Date(state.weather?.updatedAt || 0).getTime();
  return Date.now() - updatedAt > 30 * 60 * 1000;
}

async function fetchWeatherFromCurrentPosition() {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error("当前设备不支持定位");
  }

  const position = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 10 * 60 * 1000
    });
  }).catch((error) => {
    if (error?.code === 1) {
      throw new Error("请允许位置权限");
    }

    throw new Error("暂时无法定位");
  });

  return fetchWeatherReportByCoordinates(position.coords.latitude, position.coords.longitude);
}
