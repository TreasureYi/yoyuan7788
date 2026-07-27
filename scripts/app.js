import { APP_META, APP_THEMES, DEFAULT_THEME, REMINDER_FILTERS } from "./config.js";
import {
  addReminder,
  addCustomTheme,
  deleteReminder,
  deleteCustomTheme,
  getSyncSnapshot,
  getState,
  replaceSyncedData,
  setReminderFilter,
  setReminderCompletion,
  selectCustomTheme,
  setTheme,
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
  syncReminderPushRules,
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
import { prepareThemeImage } from "./services/theme.js";
import { fetchWeatherReportByCoordinates } from "./services/weather.js";
import { formatDateLong } from "./utils/date.js";
import {
  createRefs,
  populateSalaryOptions,
  renderDashboard,
  renderAppearancePanel,
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
const CUSTOM_THEME_VARIABLES = [
  "--bg", "--surface", "--surface-strong", "--surface-muted", "--text", "--text-muted", "--text-soft",
  "--text-inverse", "--accent", "--accent-strong", "--accent-soft", "--accent-warm", "--accent-warm-soft",
  "--line", "--line-strong"
];

boot();

function boot() {
  document.title = APP_META.productName;
  applyTheme(getState().preferences.theme);
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

  syncReminderDateDisplay(refs);
  refs.reminderDateInput.addEventListener("input", () => syncReminderDateDisplay(refs));
  refs.reminderDateInput.addEventListener("change", () => syncReminderDateDisplay(refs));

  root?.addEventListener("click", (event) => {
    const themeButton = event.target instanceof Element ? event.target.closest("[data-theme-option]") : null;
    if (themeButton) {
      const theme = themeButton.dataset.themeOption;
      if (theme === "custom") {
        const activeCustomTheme = getActiveCustomTheme();
        if (activeCustomTheme) {
          selectCustomTheme(activeCustomTheme.id);
          renderAll(refs);
        } else {
          refs.customThemeImageInput.click();
        }
        return;
      }
      setTheme(theme);
      applyTheme(theme);
      renderAll(refs);
      return;
    }

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

  refs.customThemeImageInput.addEventListener("change", async () => {
    const [file] = refs.customThemeImageInput.files || [];
    refs.customThemeImageInput.value = "";
    if (!file) {
      return;
    }

    refs.customThemeState.textContent = "正在处理照片…";
    try {
      const customTheme = await prepareThemeImage(file);
      addCustomTheme(customTheme);
      renderAll(refs);
      refs.customThemeState.textContent = `智能推荐：${customTheme.recommendation}，已新增到照片主题库。`;
    } catch (error) {
      refs.customThemeState.textContent = error.message || "照片处理失败，请换一张再试";
    }
  });

  refs.customThemeCreateButton.addEventListener("click", () => refs.customThemeImageInput.click());
  refs.customThemeGallery.addEventListener("click", (event) => {
    const actionButton = event.target instanceof Element ? event.target.closest("[data-custom-theme-action]") : null;
    if (!actionButton) return;
    const id = actionButton.dataset.customThemeId;
    if (!id) return;

    if (actionButton.dataset.customThemeAction === "delete") {
      if (!window.confirm("删除这张照片主题吗？此操作无法恢复。")) return;
      deleteCustomTheme(id);
      renderAll(refs);
      refs.customThemeState.textContent = "照片主题已删除。";
      return;
    }

    selectCustomTheme(id);
    renderAll(refs);
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
      await syncExistingPushSubscription(refs);
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

  refs.clearAppCacheButton?.addEventListener("click", async () => {
    await refreshAppAssetsAndReload(refs);
  });

  refs.reminderForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const wantsNotification = refs.reminderNotificationInput.checked;

    addReminder({
      title: refs.reminderTitleInput.value.trim(),
      date: refs.reminderDateInput.value,
      category: refs.reminderCategoryInput.value,
      leadDays: Number(refs.reminderLeadDaysInput.value) || 0,
      hour: Number(refs.reminderHourSelect.value) || 0,
      notificationEnabled: wantsNotification,
      notes: refs.reminderNotesInput.value.trim()
    });

    refs.reminderForm.reset();
    syncReminderDateDisplay(refs);
    refs.reminderCategoryInput.value = "账单";
    refs.reminderLeadDaysInput.value = "0";
    refs.reminderHourSelect.value = "9";
    refs.reminderNotificationInput.checked = true;
    refs.reminderSaveState.textContent = "事项已保存。";
    renderAll(refs);

    if (wantsNotification && !getState().salary.notification.enabled) {
      const enabled = await enablePushAndSync(refs);
      refs.reminderSaveState.textContent = enabled
        ? "事项已保存，通知已同步。"
        : "事项已保存，但通知尚未同步。请在设置中检查状态。";
      setActiveView(refs, enabled ? "overview" : "settings");
      return;
    }

    await syncExistingPushSubscription(refs);
    setActiveView(refs, "overview");
  });

  refs.pushEnableButton.addEventListener("click", async () => {
    await enablePushAndSync(refs);
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

  refs.reminderList.addEventListener("click", async (event) => {
    const actionButton = event.target instanceof Element ? event.target.closest("[data-action]") : null;
    if (!actionButton) {
      return;
    }

    const action = actionButton.dataset.action;
    const id = actionButton.dataset.id;
    if (!action || !id) {
      return;
    }

    const reminder = getState().reminders.find((entry) => entry.id === id);
    if (!reminder) {
      return;
    }

    if (action === "delete") {
      if (!window.confirm(`确定删除“${reminder.title}”吗？此操作无法恢复。`)) {
        return;
      }
      deleteReminder(id);
      renderAll(refs);
      await syncExistingPushSubscription(refs);
      refs.reminderBoardState.textContent = "事项已删除。";
      return;
    }

    if (action === "complete" || action === "restore") {
      const completed = action === "complete";
      setReminderCompletion(id, completed);
      renderAll(refs);
      await syncExistingPushSubscription(refs);
      refs.reminderBoardState.textContent = completed
        ? "事项已归档到“已完成”，不会再计为逾期或继续推送。"
        : "事项已恢复到待处理列表。";
      return;
    }

    if (action === "export") {
      exportSingleReminder(reminder);
    }
  });
}

function syncReminderDateDisplay(refs) {
  const value = refs.reminderDateInput.value;
  refs.reminderDateDisplay.textContent = value ? formatDateLong(value) : "选择日期";
  refs.reminderDateDisplay.dataset.empty = String(!value);
}

function renderAll(refs) {
  const state = getState();
  applyTheme(state.preferences.theme);
  renderAppearancePanel(state, refs);
  renderDashboard(state, refs);
  renderSalaryPanel(state, refs);
  renderPushPanel(state, refs, getPushCapabilities());
  renderOverviewWeather(state, refs);
  renderReminderBoard(state, refs);
  renderCloudPanel(refs);
  syncViewState(refs);
}

function applyTheme(theme) {
  const nextTheme = Object.hasOwn(APP_THEMES, theme) ? theme : DEFAULT_THEME;
  const root = document.documentElement;
  const customTheme = getActiveCustomTheme();
  const canUseCustomTheme = nextTheme === "custom" && customTheme?.imageDataUrl;
  const appliedTheme = canUseCustomTheme ? "custom" : nextTheme === "custom" ? DEFAULT_THEME : nextTheme;
  root.dataset.theme = appliedTheme;
  root.dataset.customTone = canUseCustomTheme ? customTheme.tone : "";
  if (canUseCustomTheme) {
    root.style.setProperty("--custom-theme-artwork", `url("${customTheme.imageDataUrl}")`);
    CUSTOM_THEME_VARIABLES.forEach((name) => {
      const value = customTheme.palette?.[name];
      if (value) {
        root.style.setProperty(name, value);
      }
    });
  } else {
    root.style.removeProperty("--custom-theme-artwork");
    CUSTOM_THEME_VARIABLES.forEach((name) => root.style.removeProperty(name));
  }
  const themeColor = canUseCustomTheme
    ? customTheme.tone === "light"
      ? "#f8f3ec"
      : "#17130f"
    : APP_THEMES[appliedTheme].themeColor;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor);
}

function getActiveCustomTheme() {
  const preferences = getState().preferences;
  return preferences.customThemes.find((entry) => entry.id === preferences.activeCustomThemeId) || null;
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

  const activeHeading = refs.views
    .find((view) => view.dataset.view === activeView)
    ?.querySelector("h1");
  if (activeHeading instanceof HTMLElement) {
    activeHeading.tabIndex = -1;
    window.requestAnimationFrame(() => activeHeading.focus({ preventScroll: true }));
  }

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
    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
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

async function refreshAppAssetsAndReload(refs) {
  const button = refs.clearAppCacheButton;
  const stateLabel = refs.appMaintenanceState;
  if (button) {
    button.disabled = true;
  }
  if (stateLabel) {
    stateLabel.textContent = "正在刷新应用资源...";
  }

  try {
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith("yoyuan-ledger-"))
          .map((cacheName) => caches.delete(cacheName))
      );
    }

    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.update().catch(() => {})));
    }

    if (stateLabel) {
      stateLabel.textContent = "应用资源已刷新，通知订阅会保留。正在重新加载。";
    }

    const url = new URL(window.location.href);
    url.searchParams.set("refresh", String(Date.now()));
    window.location.replace(url.toString());
  } catch (error) {
    if (button) {
      button.disabled = false;
    }
    if (stateLabel) {
      stateLabel.textContent = `清理失败：${error.message}`;
    }
  }
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
    await syncExistingPushSubscription(refs);
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
      leadDays: notification.leadDays,
      hour: notification.hour
    });

    await syncReminderPushRules({ reminders: getState().reminders });

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

async function enablePushAndSync(refs) {
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
      hour: nextNotification.hour
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
    await syncExistingPushSubscription(refs);
    return true;
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
    return false;
  } finally {
    renderAll(refs);
  }
}

function getNotificationFormState(refs) {
  return {
    leadDays: Number(refs.pushLeadDaysInput.value) || 0,
    hour: Number(refs.pushHourSelect.value) || 0,
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
  const city = state.weather?.payload?.city || "";
  if (
    state.weather?.status !== "ready" ||
    state.weather?.payload?.country !== "自动定位" ||
    city === "当前位置" ||
    city.startsWith("北纬")
  ) {
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
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60 * 1000
    });
  }).catch((error) => {
    if (error?.code === 1) {
      throw new Error("请允许位置权限");
    }

    throw new Error("暂时无法定位");
  });

  return fetchWeatherReportByCoordinates(position.coords.latitude, position.coords.longitude);
}
