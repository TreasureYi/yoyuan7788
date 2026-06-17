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
import { fetchWeatherReport } from "./services/weather.js";
import {
  createRefs,
  populateSalaryOptions,
  renderAgenda,
  renderDashboard,
  renderPushPanel,
  renderReminderBoard,
  renderSalaryPanel,
  renderWeatherPanel
} from "./views/render.js";
import { createShell } from "./views/shell.js";

let deferredInstallPrompt = null;

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

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    refs.installButton.textContent = "立即安装";
  });
}

function bindEvents(refs) {
  refs.composeTriggers.forEach((button) => {
    button.addEventListener("click", () => {
      refs.composeDisclosure?.setAttribute("open", "");
      refs.composeDisclosure?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
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
    refs.composeDisclosure?.setAttribute("open", "");
  });

  refs.weatherForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const city = refs.cityInput.value.trim();
    if (!city) {
      refs.cityInput.focus();
      return;
    }

    setWeatherPending(city);
    renderWeatherPanel(getState(), refs);

    try {
      const payload = await fetchWeatherReport(city);
      setWeatherSuccess(city, payload);
    } catch (error) {
      setWeatherFailure(city, error.message);
    }

    renderWeatherPanel(getState(), refs);
    renderDashboard(getState(), refs);
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
        leadDays: nextNotification.leadDays,
        hour: nextNotification.hour,
        timezone: nextNotification.timezone
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
  renderWeatherPanel(state, refs);
  renderReminderBoard(state, refs);
  renderAgenda(state, refs);
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
      leadDays: notification.leadDays,
      hour: notification.hour,
      timezone: notification.timezone
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
    hour: Number(refs.pushHourInput.value) || 9,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai",
    permission: typeof Notification === "undefined" ? "default" : Notification.permission
  };
}

function getPushCapabilities() {
  return {
    supported: supportsPushNotifications(),
    standalone: typeof window !== "undefined" ? isStandaloneExperience() : false
  };
}
