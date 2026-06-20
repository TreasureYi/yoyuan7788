import { REMINDER_FILTERS } from "../config.js";
import {
  formatCountdown,
  formatDateLong,
  formatDateWithWeekday,
  formatTime,
  getDaysUntil,
  getNextSalaryDate,
  getReminderTone
} from "../utils/date.js";
import { escapeHtml, formatAccount, formatAmount, formatTemperature } from "../utils/format.js";

export function createRefs(root) {
  return {
    views: Array.from(root.querySelectorAll("[data-view]")),
    tabButtons: Array.from(root.querySelectorAll("[data-tab-button]")),
    pushSummaryValue: root.querySelector("#pushSummaryValue"),
    pushSummaryMeta: root.querySelector("#pushSummaryMeta"),
    todayLabel: root.querySelector("#todayLabel"),
    installButton: root.querySelector("#installButton"),
    calendarExportButton: root.querySelector("#calendarExportButton"),
    backupExportButton: root.querySelector("#backupExportButton"),
    salaryStatus: root.querySelector("#salaryStatus"),
    salaryCountdown: root.querySelector("#salaryCountdown"),
    salaryCountdownUnit: root.querySelector("#salaryCountdownUnit"),
    salaryDate: root.querySelector("#salaryDate"),
    salaryAmountDisplay: root.querySelector("#salaryAmountDisplay"),
    salaryAccountDisplay: root.querySelector("#salaryAccountDisplay"),
    salaryForm: root.querySelector("#salaryForm"),
    salaryDaySelect: root.querySelector("#salaryDaySelect"),
    salaryAmountInput: root.querySelector("#salaryAmountInput"),
    salaryAccountInput: root.querySelector("#salaryAccountInput"),
    pushStatusBadge: root.querySelector("#pushStatusBadge"),
    pushSupportNote: root.querySelector("#pushSupportNote"),
    pushLeadDaysInput: root.querySelector("#pushLeadDaysInput"),
    pushPermissionLabel: root.querySelector("#pushPermissionLabel"),
    pushEnableButton: root.querySelector("#pushEnableButton"),
    pushTestButton: root.querySelector("#pushTestButton"),
    pushDisableButton: root.querySelector("#pushDisableButton"),
    pushSyncState: root.querySelector("#pushSyncState"),
    reminderForm: root.querySelector("#reminderForm"),
    reminderTitleInput: root.querySelector("#reminderTitleInput"),
    reminderDateInput: root.querySelector("#reminderDateInput"),
    reminderCategoryInput: root.querySelector("#reminderCategoryInput"),
    reminderLeadDaysInput: root.querySelector("#reminderLeadDaysInput"),
    reminderNotesInput: root.querySelector("#reminderNotesInput"),
    reminderCount: root.querySelector("#reminderCount"),
    reminderList: root.querySelector("#reminderList"),
    boardPanel: root.querySelector("#board"),
    reminderFilters: root.querySelector(".filters"),
    filters: Array.from(root.querySelectorAll("[data-filter]")),
    overviewWeather: root.querySelector("#overviewWeather")
  };
}

export function populateSalaryOptions(select, currentDay) {
  if (select.childElementCount > 0) {
    select.value = String(currentDay);
    return;
  }

  for (let day = 1; day <= 28; day += 1) {
    const option = document.createElement("option");
    option.value = String(day);
    option.textContent = `${day} 日`;
    if (day === currentDay) {
      option.selected = true;
    }
    select.append(option);
  }
}

export function renderDashboard(state, refs) {
  refs.todayLabel.textContent = formatDateWithWeekday(new Date());
}

export function renderSalaryPanel(state, refs) {
  const nextSalaryDate = getNextSalaryDate(state.salary.day);
  const daysUntil = getDaysUntil(nextSalaryDate);

  refs.salaryStatus.textContent = `每月 ${state.salary.day} 日`;
  refs.salaryDate.textContent = formatDateWithWeekday(nextSalaryDate);
  refs.salaryAmountDisplay.textContent = formatAmount(state.salary.amount);
  refs.salaryAccountDisplay.textContent = formatAccount(state.salary.account);

  if (refs.salaryCountdown && refs.salaryCountdownUnit) {
    if (daysUntil === 0) {
      refs.salaryCountdown.textContent = "0";
      refs.salaryCountdownUnit.textContent = "今天";
    } else if (daysUntil < 0) {
      refs.salaryCountdown.textContent = String(Math.abs(daysUntil));
      refs.salaryCountdownUnit.textContent = "天前";
    } else {
      refs.salaryCountdown.textContent = String(daysUntil);
      refs.salaryCountdownUnit.textContent = "天";
    }
  }

  refs.salaryDaySelect.value = String(state.salary.day);
  refs.salaryAmountInput.value = state.salary.amount;
  refs.salaryAccountInput.value = state.salary.account;
}

export function renderPushPanel(state, refs, capabilities) {
  const notification = state.salary.notification;
  const permissionText =
    notification.permission === "granted"
      ? "权限已允许"
      : notification.permission === "denied"
        ? "权限已拒绝"
        : "权限未请求";

  refs.pushLeadDaysInput.value = String(notification.leadDays);
  refs.pushPermissionLabel.textContent = permissionText;
  refs.pushEnableButton.textContent = notification.enabled ? "重新同步提醒" : "开启发薪提醒";
  refs.pushEnableButton.disabled = !capabilities.supported;
  refs.pushTestButton.disabled = !capabilities.supported;
  refs.pushDisableButton.disabled = !notification.enabled && !notification.endpoint;

  if (refs.pushSummaryValue && refs.pushSummaryMeta) {
    refs.pushSummaryValue.textContent = !capabilities.supported
      ? "不支持"
      : notification.enabled
        ? "已开启"
        : notification.lastError
          ? "失败"
          : "未开启";
    refs.pushSummaryMeta.textContent = notification.enabled
      ? `${notification.leadDays} 天前 · 每天 09:00`
      : "中国区固定 09:00";
  }

  if (!capabilities.supported) {
    refs.pushStatusBadge.textContent = "当前不支持";
    refs.pushSupportNote.textContent = "当前环境不支持推送。";
    refs.pushSyncState.textContent = "不影响本地记录和看板使用。";
    return;
  }

  refs.pushSupportNote.textContent = capabilities.standalone
    ? "可直接申请通知权限。"
    : "iPhone 需先添加到主屏幕后再申请通知。";

  if (notification.enabled) {
    refs.pushStatusBadge.textContent = "每月自动提醒";
    const syncText = notification.lastSyncedAt
      ? `已同步到推送服务，最近一次同步时间：${formatTime(notification.lastSyncedAt)}`
      : "已开启发薪提醒。";
    refs.pushSyncState.textContent = notification.lastTestedAt
      ? `${syncText} 最近一次本机测试通知：${formatTime(notification.lastTestedAt)}`
      : syncText;
    return;
  }

  refs.pushStatusBadge.textContent = notification.lastError ? "同步失败" : "未开启";
  refs.pushSyncState.textContent = notification.lastError
    ? notification.lastTestedAt
      ? `${notification.lastError} 最近一次本机测试通知：${formatTime(notification.lastTestedAt)}`
      : notification.lastError
    : "开启后会同步当前设备的发薪提醒。";
}

export function renderOverviewWeather(state, refs) {
  if (!refs.overviewWeather) {
    return;
  }

  if (state.weather.status === "loading") {
    refs.overviewWeather.innerHTML = `
      <div class="weather-peek__content">
        <span class="weather-peek__icon weather-widget__icon--loading" aria-hidden="true">${getWeatherIconSvg(null)}</span>
        <span>定位中</span>
      </div>
    `;
    return;
  }

  if (state.weather.status === "error") {
    refs.overviewWeather.innerHTML = `
      <button class="weather-peek__content" data-refresh-weather type="button">
        <span class="weather-peek__icon" aria-hidden="true">${getWeatherIconSvg(null)}</span>
        <span>重试</span>
      </button>
    `;
    return;
  }

  if (!state.weather.payload) {
    refs.overviewWeather.innerHTML = `
      <button class="weather-peek__content" data-refresh-weather type="button">
        <span class="weather-peek__icon" aria-hidden="true">${getWeatherIconSvg(null)}</span>
        <span>定位</span>
      </button>
    `;
    return;
  }

  const payload = state.weather.payload;
  refs.overviewWeather.innerHTML = `
    <button class="weather-peek__content" data-refresh-weather type="button" aria-label="刷新当前位置天气">
      <span class="weather-peek__icon" aria-hidden="true">${getWeatherIconSvg(payload.weatherCode)}</span>
      <strong>${formatTemperature(payload.temperature)}</strong>
      <span>${escapeHtml(payload.city)}</span>
    </button>
  `;
}

export function renderReminderBoard(state, refs) {
  const sorted = getSortedReminders(state.reminders);
  const filtered = applyFilter(sorted, state.preferences.reminderFilter);

  refs.reminderCount.textContent = `${filtered.length} 条`;
  refs.reminderCount.hidden = sorted.length === 0;
  if (refs.boardPanel) {
    refs.boardPanel.hidden = false;
  }
  if (refs.reminderFilters) {
    refs.reminderFilters.hidden = sorted.length < 4;
  }

  refs.filters.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === state.preferences.reminderFilter);
  });

  if (!filtered.length) {
    refs.reminderList.innerHTML = `
      <div class="empty-state empty-state--quiet">
        <p class="empty-state__title">${sorted.length ? "这里没有事项" : "还没有提醒"}</p>
      </div>
    `;
    return;
  }

  refs.reminderList.innerHTML = filtered
    .map((entry) => {
      const days = getDaysUntil(entry.date);
      const tone = getReminderTone(days);
      const notes = entry.notes || "没有备注";
      const schedule =
        days < 0
          ? `${formatDateLong(entry.date)} · 逾期 ${Math.abs(days)} 天`
          : days === 0
            ? `${formatDateLong(entry.date)} · 今天`
            : `${formatDateLong(entry.date)} · ${days} 天后`;

      return `
        <article class="reminder-item reminder-item--${tone}">
          <div class="reminder-item__icon" aria-hidden="true">${getCategoryIcon(entry.category)}</div>
          <div class="reminder-item__body">
            <div class="reminder-item__title-row">
              <span class="badge">${escapeHtml(entry.category)}</span>
              <h3 class="reminder-item__title">${escapeHtml(entry.title)}</h3>
            </div>
            <p class="reminder-item__meta">${escapeHtml(schedule)}</p>
            ${entry.notes ? `<p class="reminder-item__notes">${escapeHtml(notes)}</p>` : ""}
          </div>

          <div class="reminder-item__side">
            <strong class="countdown">${escapeHtml(formatCountdown(days))}</strong>
            <div class="reminder-item__actions">
              <button class="button button--link" data-action="export" data-id="${escapeHtml(entry.id)}" type="button">导出</button>
              <button class="button button--link button--danger" data-action="delete" data-id="${escapeHtml(entry.id)}" type="button">删除</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function getSortedReminders(reminders) {
  return [...reminders].sort((left, right) => left.date.localeCompare(right.date));
}

function applyFilter(reminders, filter) {
  if (filter === REMINDER_FILTERS.upcoming) {
    return reminders.filter((entry) => {
      const days = getDaysUntil(entry.date);
      return days >= 0 && days <= 7;
    });
  }

  if (filter === REMINDER_FILTERS.overdue) {
    return reminders.filter((entry) => getDaysUntil(entry.date) < 0);
  }

  return reminders;
}

function getWeatherIconSvg(code) {
  if (code === null || code === undefined) {
    return `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M14 32a8 8 0 1 1 0-16 7 7 0 0 1 13.5 2.5A6 6 0 1 1 34 32H14z"/></svg>`;
  }

  if (code === 0 || code === 1) {
    return `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="24" cy="24" r="8"/><path d="M24 6v4M24 38v4M6 24h4M38 24h4M10.9 10.9l2.8 2.8M34.3 34.3l2.8 2.8M10.9 37.1l2.8-2.8M34.3 13.7l2.8-2.8"/></svg>`;
  }

  if (code <= 3) {
    return `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M14 34a8 8 0 1 1 0-16 7 7 0 0 1 13.5 2.5A6 6 0 1 1 34 34H14z"/></svg>`;
  }

  if (code <= 48) {
    return `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M14 30a8 8 0 1 1 0-16 7 7 0 0 1 13.5 2.5A6 6 0 1 1 34 30H14z"/><path d="M10 38h28M16 42h16"/></svg>`;
  }

  if (code <= 67 || (code >= 80 && code <= 82)) {
    return `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M14 28a8 8 0 1 1 0-16 7 7 0 0 1 13.5 2.5A6 6 0 1 1 34 28H14z"/><path d="M22 32v10M30 32v10M18 36h16"/></svg>`;
  }

  if (code <= 77) {
    return `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M14 28a8 8 0 1 1 0-16 7 7 0 0 1 13.5 2.5A6 6 0 1 1 34 28H14z"/><circle cx="20" cy="36" r="1.5" fill="currentColor"/><circle cx="28" cy="40" r="1.5" fill="currentColor"/><circle cx="36" cy="36" r="1.5" fill="currentColor"/></svg>`;
  }

  return `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M14 28a8 8 0 1 1 0-16 7 7 0 0 1 13.5 2.5A6 6 0 1 1 34 28H14z"/><path d="M26 32l-4 8M30 32l4 8"/></svg>`;
}

function getCategoryIcon(category) {
  const icons = {
    账单: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>`,
    会员: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    证件: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M15 9h4M15 13h4"/></svg>`,
    合同: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/></svg>`,
    家庭: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>`,
    其他: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>`
  };

  return icons[category] || icons.其他;
}
