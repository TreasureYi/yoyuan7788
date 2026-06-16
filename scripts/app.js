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
import { fetchWeatherReport } from "./services/weather.js";
import { createRefs, populateSalaryOptions, renderAgenda, renderDashboard, renderReminderBoard, renderSalaryPanel, renderWeatherPanel } from "./views/render.js";
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

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    refs.installButton.textContent = "立即安装";
  });
}

function bindEvents(refs) {
  refs.salaryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    updateSalary({
      day: Number(refs.salaryDaySelect.value),
      amount: refs.salaryAmountInput.value.trim(),
      account: refs.salaryAccountInput.value.trim()
    });
    renderAll(refs);
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
