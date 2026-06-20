import { APP_META, REMINDER_FILTERS } from "./config.js";
import {
  addReminder,
  deleteReminder,
  getSyncSnapshot,
  getState,
  replaceSyncedData,
  setReminderFilter,
  setWeatherFailure,
  setWeatherPending,
  setWeatherSuccess,
  updateSalary
} from "./state.js";
import { exportSingleReminder } from "./services/calendar.js";
import {
  disableSalaryPushNotifications,
  enableSalaryPushNotifications,
  getCurrentPushSubscription,
  isStandaloneExperience,
  sendLocalTestNotification,
  supportsPushNotifications,
  syncSalaryPushRule
} from "./services/push.js";
import {
  createCloudBackup,
  forgetCloudBackupOnDevice,
  getRecoveryCode,
  hasCloudBackup,
  restoreCloudBackup,
  syncCloudBackup
} from "./services/sync.js";
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

let activeView = "overview";
let cloudSyncTimer = null;
let cloudSyncPaused = false;
let cloudStatusText = "";

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
  hydrateCloudBackup(refs);
  window.addEventListener("yoyuan:state-changed", () => scheduleCloudSync(refs));
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

  refs.cloudCreateButton.addEventListener("click", async () => {
    setCloudStatus(refs, "正在创建加密备份…");
    refs.cloudCreateButton.disabled = true;
    try {
      const recoveryCode = await createCloudBackup(getSyncSnapshot());
      refs.recoveryCodeInput.value = recoveryCode;
      setCloudStatus(refs, "云端备份已开启，请立即保存恢复码。");
    } catch (error) {
      setCloudStatus(refs, error.message);
    } finally {
      refs.cloudCreateButton.disabled = false;
      renderCloudPanel(refs);
    }
  });

  refs.cloudRestoreButton.addEventListener("click", async () => {
    const recoveryCode = refs.recoveryCodeInput.value.trim();
    if (!recoveryCode) {
      setCloudStatus(refs, "请先输入恢复码");
      return;
    }

    setCloudStatus(refs, "正在从云端恢复…");
    refs.cloudRestoreButton.disabled = true;
    try {
      const result = await restoreCloudBackup(recoveryCode);
      cloudSyncPaused = true;
      replaceSyncedData(result.snapshot);
      cloudSyncPaused = false;
      renderAll(refs);
      setCloudStatus(refs, "云端数据已恢复到这台设备。");
    } catch (error) {
      cloudSyncPaused = false;
      setCloudStatus(refs, error.message);
    } finally {
      refs.cloudRestoreButton.disabled = false;
      renderCloudPanel(refs);
    }
  });

  refs.cloudCopyButton.addEventListener("click", async () => {
    const recoveryCode = getRecoveryCode();
    if (!recoveryCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(recoveryCode);
      setCloudStatus(refs, "恢复码已复制，请保存到密码管理器。");
    } catch (error) {
      refs.recoveryCodeInput.value = recoveryCode;
      refs.recoveryCodeInput.select();
      setCloudStatus(refs, "请长按复制恢复码并妥善保存。");
    }
  });

  refs.cloudForgetButton.addEventListener("click", () => {
    forgetCloudBackupOnDevice();
    refs.recoveryCodeInput.value = "";
    setCloudStatus(refs, "这台设备已停止云同步，云端加密备份仍保留。");
    renderCloudPanel(refs);
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
  renderCloudPanel(refs);
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

  const hadController = Boolean(navigator.serviceWorker.controller);
  let updateReloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || updateReloading) {
      return;
    }

    updateReloading = true;
    window.location.reload();
  });

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js", {
        updateViaCache: "none"
      });
      await registration.update();
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          registration.update().catch(() => {});
        }
      });
    } catch (error) {
      console.warn("Service worker registration failed", error);
    }
  });
}

async function hydrateCloudBackup(refs) {
  renderCloudPanel(refs);
  if (!hasCloudBackup()) {
    return;
  }

  try {
    if (hasMeaningfulLocalData(getState())) {
      await syncCloudBackup(getSyncSnapshot());
      setCloudStatus(refs, "本机数据已同步到云端。");
      return;
    }

    const result = await restoreCloudBackup(getRecoveryCode());
    cloudSyncPaused = true;
    replaceSyncedData(result.snapshot);
    cloudSyncPaused = false;
    renderAll(refs);
    setCloudStatus(refs, "已自动恢复云端数据。");
  } catch (error) {
    cloudSyncPaused = false;
    setCloudStatus(refs, navigator.onLine ? error.message : "当前离线，将继续使用本机数据。");
  }
}

function scheduleCloudSync(refs) {
  if (cloudSyncPaused || !hasCloudBackup()) {
    return;
  }

  window.clearTimeout(cloudSyncTimer);
  cloudSyncTimer = window.setTimeout(async () => {
    try {
      await syncCloudBackup(getSyncSnapshot());
      setCloudStatus(refs, "已自动同步到云端。");
    } catch (error) {
      setCloudStatus(refs, navigator.onLine ? error.message : "当前离线，联网后再次修改即可同步。");
    }
  }, 800);
}

function renderCloudPanel(refs) {
  const recoveryCode = getRecoveryCode();
  const enabled = Boolean(recoveryCode);

  refs.cloudStatusBadge.textContent = enabled ? "已开启" : "未开启";
  refs.cloudCreateButton.hidden = enabled;
  refs.cloudCopyButton.hidden = !enabled;
  refs.cloudForgetButton.hidden = !enabled;
  refs.recoveryCodeDisplay.hidden = !enabled;
  refs.recoveryCodeDisplay.textContent = enabled ? recoveryCode : "";
  refs.recoveryCodeInput.placeholder = enabled ? "输入其他恢复码可切换备份" : "输入已有恢复码";
  refs.cloudSyncState.textContent =
    cloudStatusText || (enabled ? "数据修改后会自动加密同步。" : "开启后会生成唯一恢复码。");
}

function setCloudStatus(refs, message) {
  cloudStatusText = message;
  refs.cloudSyncState.textContent = message;
}

function hasMeaningfulLocalData(state) {
  return Boolean(
    state.reminders.length ||
      state.salary.amount ||
      state.salary.account ||
      state.salary.day !== 15 ||
      state.salary.notification.leadDays
  );
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
