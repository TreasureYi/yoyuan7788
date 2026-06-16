import { REMINDER_FILTERS, WEATHER_CODES } from "../config.js";
import {
  buildAgendaItems,
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
    todayLabel: root.querySelector("#todayLabel"),
    storageState: root.querySelector("#storageState"),
    metricNextSalary: root.querySelector("#metricNextSalary"),
    metricNextReminder: root.querySelector("#metricNextReminder"),
    metricOverdue: root.querySelector("#metricOverdue"),
    installButton: root.querySelector("#installButton"),
    calendarExportButton: root.querySelector("#calendarExportButton"),
    backupExportButton: root.querySelector("#backupExportButton"),
    salaryStatus: root.querySelector("#salaryStatus"),
    salaryCountdown: root.querySelector("#salaryCountdown"),
    salaryDate: root.querySelector("#salaryDate"),
    salaryAmountDisplay: root.querySelector("#salaryAmountDisplay"),
    salaryAccountDisplay: root.querySelector("#salaryAccountDisplay"),
    salaryForm: root.querySelector("#salaryForm"),
    salaryDaySelect: root.querySelector("#salaryDaySelect"),
    salaryAmountInput: root.querySelector("#salaryAmountInput"),
    salaryAccountInput: root.querySelector("#salaryAccountInput"),
    reminderForm: root.querySelector("#reminderForm"),
    reminderTitleInput: root.querySelector("#reminderTitleInput"),
    reminderDateInput: root.querySelector("#reminderDateInput"),
    reminderCategoryInput: root.querySelector("#reminderCategoryInput"),
    reminderLeadDaysInput: root.querySelector("#reminderLeadDaysInput"),
    reminderNotesInput: root.querySelector("#reminderNotesInput"),
    reminderCount: root.querySelector("#reminderCount"),
    reminderSummary: root.querySelector("#reminderSummary"),
    reminderList: root.querySelector("#reminderList"),
    filters: Array.from(root.querySelectorAll("[data-filter]")),
    weatherForm: root.querySelector("#weatherForm"),
    cityInput: root.querySelector("#cityInput"),
    weatherState: root.querySelector("#weatherState"),
    weatherCard: root.querySelector("#weatherCard"),
    agendaList: root.querySelector("#agendaList")
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
  const nextSalaryDate = getNextSalaryDate(state.salary.day);
  const sorted = getSortedReminders(state.reminders);
  const overdueCount = state.reminders.filter((entry) => getDaysUntil(entry.date) < 0).length;
  const soonCount = state.reminders.filter((entry) => {
    const days = getDaysUntil(entry.date);
    return days >= 0 && days <= 7;
  }).length;
  const nextReminder = sorted.find((entry) => getDaysUntil(entry.date) >= 0) || sorted[0];

  refs.todayLabel.textContent = formatDateWithWeekday(new Date());
  refs.storageState.textContent = state.reminders.length
    ? `已保存 ${state.reminders.length} 条事项${state.preferences.city ? `，天气城市：${state.preferences.city}` : ""}，支持本地备份和日历导出。`
    : "当前还没有记录，建议先补齐常用账单、证件和会员节点。";
  refs.metricNextSalary.textContent = formatDateWithWeekday(nextSalaryDate);
  refs.metricNextReminder.textContent = nextReminder
    ? `${nextReminder.title} · ${formatCountdown(getDaysUntil(nextReminder.date))}`
    : "暂无项目";
  refs.metricOverdue.textContent = overdueCount ? `逾期 ${overdueCount} 条` : soonCount ? `7 天内 ${soonCount} 条` : "状态正常";
}

export function renderSalaryPanel(state, refs) {
  const nextSalaryDate = getNextSalaryDate(state.salary.day);
  const daysUntil = getDaysUntil(nextSalaryDate);

  refs.salaryStatus.textContent = daysUntil === 0 ? "今天发薪" : `每月 ${state.salary.day} 日`;
  refs.salaryCountdown.textContent = formatCountdown(daysUntil);
  refs.salaryDate.textContent = formatDateLong(nextSalaryDate);
  refs.salaryAmountDisplay.textContent = formatAmount(state.salary.amount);
  refs.salaryAccountDisplay.textContent = formatAccount(state.salary.account);

  refs.salaryDaySelect.value = String(state.salary.day);
  refs.salaryAmountInput.value = state.salary.amount;
  refs.salaryAccountInput.value = state.salary.account;
}

export function renderWeatherPanel(state, refs) {
  refs.cityInput.value = state.preferences.city;

  if (state.weather.status === "loading") {
    refs.weatherState.textContent = "查询中";
    refs.weatherCard.innerHTML = `
      <div class="loading-state">
        <p class="loading-state__copy">正在读取天气服务，请稍等片刻...</p>
      </div>
    `;
    return;
  }

  if (state.weather.status === "error") {
    refs.weatherState.textContent = "失败";
    refs.weatherCard.innerHTML = `
      <div class="error-state">
        <p class="error-state__title">天气读取失败</p>
        <p class="error-state__copy">${escapeHtml(state.weather.error || "服务不可用")}</p>
      </div>
    `;
    return;
  }

  if (!state.weather.payload) {
    refs.weatherState.textContent = "未查询";
    refs.weatherCard.innerHTML = `
      <div class="empty-state">
        <p class="empty-state__title">这里会显示你关注城市的天气</p>
        <p class="empty-state__copy">它被放在侧边辅助区，只在需要时补充当天体感，不干扰主看板的任务扫描。</p>
      </div>
    `;
    return;
  }

  const payload = state.weather.payload;
  refs.weatherState.textContent = `已更新 ${formatTime(state.weather.updatedAt)}`;
  refs.weatherCard.innerHTML = `
    <div class="weather-card__top">
      <div>
        <p class="eyebrow">${escapeHtml(payload.country || "")}</p>
        <h3 class="section-title">${escapeHtml(payload.city)}</h3>
      </div>
      <strong class="weather-card__temp">${formatTemperature(payload.temperature)}</strong>
    </div>
    <p class="weather-card__summary">
      ${escapeHtml(WEATHER_CODES[payload.weatherCode] || "天气稳定")}，体感约 ${escapeHtml(formatTemperature(payload.apparentTemperature))}。
    </p>
    <div class="weather-metrics">
      <article class="weather-metric">
        <span class="weather-metric__label">体感</span>
        <strong class="weather-metric__value">${escapeHtml(formatTemperature(payload.apparentTemperature))}</strong>
      </article>
      <article class="weather-metric">
        <span class="weather-metric__label">风速</span>
        <strong class="weather-metric__value">${escapeHtml(String(Math.round(Number(payload.windSpeed || 0))))} km/h</strong>
      </article>
      <article class="weather-metric">
        <span class="weather-metric__label">状态</span>
        <strong class="weather-metric__value">${escapeHtml(WEATHER_CODES[payload.weatherCode] || "正常")}</strong>
      </article>
    </div>
  `;
}

export function renderReminderBoard(state, refs) {
  const sorted = getSortedReminders(state.reminders);
  const filtered = applyFilter(sorted, state.preferences.reminderFilter);
  const overdueCount = sorted.filter((entry) => getDaysUntil(entry.date) < 0).length;
  const soonCount = sorted.filter((entry) => {
    const days = getDaysUntil(entry.date);
    return days >= 0 && days <= 7;
  }).length;

  refs.reminderCount.textContent = `${filtered.length} 条`;
  refs.reminderSummary.textContent = overdueCount
    ? `当前有 ${overdueCount} 条逾期项目`
    : soonCount
      ? `未来 7 天有 ${soonCount} 条事项需要关注`
      : "目前没有紧急事项";

  refs.filters.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === state.preferences.reminderFilter);
  });

  if (!filtered.length) {
    refs.reminderList.innerHTML = `
      <div class="empty-state">
        <p class="empty-state__title">当前筛选下没有事项</p>
        <p class="empty-state__copy">你可以先新增一条账单、会员或证件提醒，让看板进入真实使用状态。</p>
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
          ? `${formatDateLong(entry.date)} · 已逾期 ${Math.abs(days)} 天`
          : days === 0
            ? `${formatDateLong(entry.date)} · 就是今天`
            : `${formatDateLong(entry.date)} · 还有 ${days} 天`;

      return `
        <article class="reminder-item reminder-item--${tone}">
          <div>
            <div class="reminder-item__title-row">
              <span class="badge">${escapeHtml(entry.category)}</span>
              <h3 class="reminder-item__title">${escapeHtml(entry.title)}</h3>
            </div>
            <p class="reminder-item__meta">${escapeHtml(schedule)} · 提前 ${escapeHtml(String(entry.leadDays))} 天准备</p>
            <p class="reminder-item__notes">${escapeHtml(notes)}</p>
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

export function renderAgenda(state, refs) {
  const items = buildAgendaItems(state.reminders, state.salary.day, 8);

  if (!items.length) {
    refs.agendaList.innerHTML = `
      <div class="empty-state">
        <p class="empty-state__title">时间线会在这里出现</p>
        <p class="empty-state__copy">当你录入事项后，这里会自动把发薪节点和到期节点混排成一条更适合浏览的日历式序列。</p>
      </div>
    `;
    return;
  }

  refs.agendaList.innerHTML = items
    .map((entry) => {
      const typeLabel = entry.type === "salary" ? "薪资" : "到期";
      const note = entry.type === "salary" ? "月度薪资节奏" : entry.notes || "待处理事项";
      return `
        <article class="agenda-item">
          <div class="agenda-item__meta-row">
            <span class="agenda-item__type">${typeLabel}</span>
            <span class="agenda-item__date">${escapeHtml(formatDateWithWeekday(entry.date))}</span>
          </div>
          <div class="agenda-item__title-row">
            ${entry.category ? `<span class="badge">${escapeHtml(entry.category)}</span>` : ""}
            <h3 class="agenda-item__title">${escapeHtml(entry.title)}</h3>
          </div>
          <p class="agenda-item__notes">${escapeHtml(note)}</p>
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
