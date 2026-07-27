import { APP_THEMES } from "../config.js";

export function createShell() {
  return `
    <div class="page-noise"></div>

    <div class="app-shell">
      <header class="app-header">
        <div class="brand-lockup">
          <button class="brand" data-switch-view="overview" type="button" aria-label="返回星期首页">
            <span class="brand__mark" aria-hidden="true"><img src="./assets/icons/app-icon-star-192.png?v=20260727.1" alt="" width="38" height="38" /></span>
            <span>星期</span>
          </button>
          <p id="todayLabel">--</p>
        </div>
        <button class="icon-button" data-switch-view="compose" type="button" aria-label="新增事项">
          ${iconPlus()}
        </button>
      </header>

      <main class="workspace">
        <section class="view view--overview is-active" data-view="overview">
          <header class="overview-intro sr-only">
            <p id="overviewMonth">--</p>
            <h1>今日生活概览</h1>
          </header>

          <div class="overview-stack">
            <article class="salary-snapshot">
              <div class="salary-snapshot__header">
                <div>
                  <p class="salary-snapshot__eyebrow">距离下次发薪</p>
                  <p id="salaryStatus">--</p>
                </div>
              </div>
              <div class="salary-snapshot__main">
                <div class="salary-snapshot__countdown">
                  <strong id="salaryCountdown">--</strong><span id="salaryCountdownUnit">天</span>
                </div>
                <div class="salary-snapshot__calendar" aria-hidden="true">${iconCalendar()}</div>
                <span class="salary-snapshot__date" id="salaryDate">--</span>
              </div>
              <div class="salary-snapshot__details">
                <div><span>收入</span><strong id="salaryAmountDisplay">--</strong></div>
                <div><span>到账账户</span><strong id="salaryAccountDisplay">--</strong></div>
              </div>
            </article>

            <article class="notification-nudge" id="pushNudge" hidden>
              <span class="notification-nudge__icon" aria-hidden="true">${iconBell()}</span>
              <div>
                <strong id="pushNudgeTitle">通知尚未准备好</strong>
                <p id="pushNudgeText">开启后，带有通知的事项才会准时推送。</p>
              </div>
              <button class="button button--secondary button--compact" data-switch-view="settings" type="button">去开启</button>
            </article>

            <article class="journal-card reminders-card" id="board">
              <div class="section-head">
                <div>
                  <h2 class="section-title">临近事项</h2>
                  <p id="reminderSummaryMeta" class="section-head__meta">暂时没有待办</p>
                </div>
                <div class="section-head__actions">
                  <span id="reminderCount" class="soft-chip">0 条</span>
                  <button class="section-arrow" data-switch-view="compose" type="button" aria-label="新建事项">${iconChevron()}</button>
                </div>
              </div>
              <span id="reminderSummaryValue" class="sr-only">0</span>
              <div class="filters" role="tablist" aria-label="提醒筛选">
                <button class="filter is-active" data-filter="all" type="button">待处理</button>
                <button class="filter" data-filter="overdue" type="button">已逾期</button>
                <button class="filter" data-filter="completed" type="button">已完成</button>
              </div>
              <p id="reminderBoardState" class="form-note reminder-board-state" aria-live="polite"></p>
              <div id="reminderList" class="reminder-list"></div>
            </article>

            <article class="xm-weather-card" aria-labelledby="overviewWeatherTitle">
              <div class="xm-weather-card__head">
                <h2 id="overviewWeatherTitle">天气</h2>
                <button class="xm-weather-card__location" data-switch-view="weather" type="button">查看详情 ${iconLocation()}</button>
              </div>
              <div class="xm-weather-card__slot" data-weather-slot></div>
            </article>
          </div>
        </section>

        <section class="view view--compose" data-view="compose" hidden>
          <header class="page-intro">
            <div class="section-kicker"><span>事项</span><span class="section-kicker__line"></span></div>
            <h1>安排一件事</h1>
            <p>记下日期和提醒时刻，到点让小星轻轻提醒你。</p>
          </header>
          <article class="journal-card graph-paper form-card">
            <form id="reminderForm" class="stack-form">
              <label class="field">
                <span class="field__label">事情</span>
                <input id="reminderTitleInput" name="title" class="input" type="text" placeholder="手机套餐续费" required />
              </label>
              <div class="split-grid">
                <label class="field">
                  <span class="field__label">事项日期</span>
                  <span class="date-input-shell">
                    <span id="reminderDateDisplay" class="date-input-shell__value" data-empty="true">选择日期</span>
                    <span class="date-input-shell__icon" aria-hidden="true">${iconCalendar()}</span>
                    <input id="reminderDateInput" name="date" class="date-input-shell__native" type="date" aria-label="事项日期" required />
                  </span>
                </label>
                <label class="field">
                  <span class="field__label">分类</span>
                  <select id="reminderCategoryInput" name="category" class="select">
                    <option value="账单">账单</option><option value="会员">会员</option>
                    <option value="证件">证件</option><option value="合同">合同</option>
                    <option value="家庭">家庭</option><option value="其他">其他</option>
                  </select>
                </label>
              </div>
              <fieldset class="reminder-timing">
                <legend>提醒安排</legend>
                <label class="reminder-switch">
                  <input id="reminderNotificationInput" type="checkbox" checked />
                  <span class="reminder-switch__control" aria-hidden="true"></span>
                  <span><strong>推送提醒</strong><small>需要先在设置中允许通知</small></span>
                </label>
                <div class="split-grid">
                  <label class="field">
                    <span class="field__label">提前几天</span>
                    <input id="reminderLeadDaysInput" name="leadDays" class="input" type="number" min="0" max="30" value="0" />
                  </label>
                  <label class="field">
                    <span class="field__label">推送时刻</span>
                    <select id="reminderHourSelect" name="reminderHour" class="select">${hourOptions()}</select>
                  </label>
                </div>
                <p class="timing-hint">计划在所选时刻发送；若定时任务延迟，会在该小时内自动补发一次。</p>
              </fieldset>
              <label class="field">
                <span class="field__label">备注</span>
                <textarea id="reminderNotesInput" name="notes" class="textarea" placeholder="金额、联系人、续费规则..."></textarea>
              </label>
              <button class="button button--primary button--block" type="submit">保存事项</button>
              <p id="reminderSaveState" class="form-note" aria-live="polite"></p>
            </form>
          </article>
        </section>

        <section class="view view--weather" data-view="weather" hidden>
          <header class="page-intro">
            <div class="section-kicker"><span>当前位置</span><span class="section-kicker__line"></span></div>
            <h1>天气</h1>
            <p>查看实况、降雨概率和生活建议，轻点即可更新。</p>
          </header>
          <article class="journal-card graph-paper weather-page-card">
            <div class="weather-page-card__slot" data-weather-slot></div>
            <p class="weather-privacy">位置仅用于查询天气和城市名，不会保存在应用内。</p>
          </article>
        </section>

        <section class="view view--settings" data-view="settings" hidden>
          <header class="page-intro">
            <div class="section-kicker"><span>个人设置</span><span class="section-kicker__line"></span></div>
            <h1>我的</h1>
            <p>管理发薪规则、通知，以及数据保存方式。</p>
          </header>

          <section class="settings-grid">
            <article class="journal-card appearance-card" aria-labelledby="appearanceTitle">
              <div class="card-heading">
                <div>
                  <h2 id="appearanceTitle">外观与主题</h2>
                  <p>一键换肤，选择会自动保存在这台设备。</p>
                </div>
                <span id="themeStatusBadge" class="soft-chip">默认绿</span>
              </div>
              <div class="theme-picker" role="group" aria-label="选择应用主题">
                ${Object.entries(APP_THEMES).map(([id, theme]) => themeOption(id, theme)).join("")}
              </div>
              <input id="customThemeImageInput" class="sr-only" type="file" accept="image/*" aria-label="从相册选择主题照片" />
              <div id="customThemeActions" class="appearance-card__actions" hidden>
                <button id="customThemeReplaceButton" class="button button--secondary button--compact" type="button">更换照片</button>
                <button id="customThemeClearButton" class="button button--secondary button--compact" type="button">恢复默认外观</button>
              </div>
              <p id="customThemeState" class="appearance-card__note" aria-live="polite">照片仅保存在当前设备，不会上传或同步到云端。</p>
            </article>

            <article class="journal-card graph-paper form-card">
              <div class="card-heading"><div><h2>发薪设置</h2><p>修改后会立即保存在本机</p></div></div>
              <form id="salaryForm" class="stack-form">
                <label class="field"><span class="field__label">发薪日</span><select id="salaryDaySelect" name="salaryDay" class="select"></select></label>
                <div class="split-grid">
                  <label class="field"><span class="field__label">收入</span><input id="salaryAmountInput" name="salaryAmount" class="input" type="text" placeholder="15,000 元" autocomplete="off" /></label>
                  <label class="field"><span class="field__label">账户</span><input id="salaryAccountInput" name="salaryAccount" class="input" type="text" placeholder="工资卡" autocomplete="off" /></label>
                </div>
                <button class="button button--primary button--block" type="submit">保存发薪设置</button>
              </form>
            </article>

            <article class="journal-card graph-paper form-card">
              <div class="card-heading"><div><h2>通知设置</h2><p id="pushSupportNote">开启一次后，工资和自定义事项都会使用此通知权限。</p></div><span id="pushStatusBadge" class="soft-chip">未开启</span></div>
              <div class="settings-list">
                <label class="settings-list__row"><span class="settings-list__label">提前天数</span><input id="pushLeadDaysInput" name="pushLeadDays" class="input settings-list__input" type="number" min="0" max="7" value="0" /></label>
                <label class="settings-list__row"><span class="settings-list__label">工资推送时刻</span><select id="pushHourSelect" name="pushHour" class="select settings-list__input">${hourOptions()}</select></label>
                <div class="settings-list__row"><span class="settings-list__label">权限</span><span id="pushPermissionLabel">未请求</span></div>
              </div>
              <div class="notification-panel__actions">
                <button id="pushEnableButton" class="button button--primary" type="button">开启通知并同步</button>
                <button id="pushTestButton" class="button button--secondary" type="button">测试通知</button>
                <button id="pushDisableButton" class="button button--secondary" type="button">关闭所有提醒</button>
              </div>
              <p id="pushSyncState" class="form-note">--</p>
            </article>

            <article class="journal-card graph-paper form-card cloud-backup-card">
              <div class="card-heading">
                <div>
                  <h2>云端备份与恢复</h2>
                  <p>工资设置和事项会先在本机加密，再保存到 D1。</p>
                </div>
                <span id="cloudStatusBadge" class="soft-chip">未开启</span>
              </div>

              <div id="recoveryCodeDisplay" class="recovery-code" hidden></div>
              <p class="cloud-warning">恢复码是唯一钥匙。请保存到密码管理器，不要发给其他人；丢失后无法找回。</p>

              <div class="cloud-actions">
                <button id="cloudCreateButton" class="button button--primary" type="button">开启云端备份</button>
                <button id="cloudCopyButton" class="button button--secondary" type="button" hidden>复制恢复码</button>
                <button id="cloudForgetButton" class="button button--secondary" type="button" hidden>停止此设备同步</button>
              </div>

              <div class="restore-row">
                <label class="field">
                  <span class="field__label">在新设备恢复</span>
                  <input id="recoveryCodeInput" class="input recovery-code-input" type="text" placeholder="输入已有恢复码" autocomplete="off" autocapitalize="characters" spellcheck="false" />
                </label>
                <button id="cloudRestoreButton" class="button button--primary" type="button">恢复数据</button>
              </div>
              <p id="cloudSyncState" class="form-note">开启后会生成唯一恢复码。</p>
            </article>

            <article class="data-note">
              <span class="data-note__icon">${iconDatabase()}</span>
              <div>
                <h2>安全刷新不会影响通知</h2>
                <p>联网打开应用时会检查新版本，新代码接管后自动刷新一次。本机数据和通知订阅都不会因更新而清空。</p>
                <div class="maintenance-actions">
                  <button id="clearAppCacheButton" class="button button--secondary" type="button">刷新应用资源</button>
                  <span id="appMaintenanceState" class="form-note">遇到页面异常时使用；不会关闭提醒。</span>
                </div>
              </div>
            </article>
          </section>
        </section>
      </main>

      <nav class="bottom-tabs" aria-label="主导航">
        <button class="bottom-tabs__item is-active" data-switch-view="overview" data-tab-button type="button" aria-current="page">${iconHome()}<span>首页</span></button>
        <button class="bottom-tabs__item" data-switch-view="compose" data-tab-button type="button">${iconChecklist()}<span>事项</span></button>
        <button class="bottom-tabs__item" data-switch-view="weather" data-tab-button type="button">${iconWeather()}<span>天气</span></button>
        <button class="bottom-tabs__item" data-switch-view="settings" data-tab-button type="button">${iconUser()}<span>我的</span></button>
      </nav>
    </div>
  `;
}

function hourOptions() {
  return Array.from({ length: 24 }, (_, hour) => {
    const value = String(hour).padStart(2, "0");
    const selected = hour === 9 ? " selected" : "";
    return `<option value="${hour}"${selected}>${value}:00</option>`;
  }).join("");
}

function themeOption(id, theme) {
  const artworkStyle = theme.artwork ? ` style="--theme-preview-image: url('${theme.artwork}')"` : "";
  return `
    <button class="theme-option theme-option--${id}${theme.artwork ? " theme-option--artwork" : ""}" data-theme-option="${id}" type="button" aria-pressed="false">
      <span class="theme-option__preview"${artworkStyle} aria-hidden="true"></span>
      <span class="theme-option__copy"><strong>${theme.label}</strong><small>${theme.description}</small></span>
      <span class="theme-option__tag">${theme.tag}</span>
    </button>
  `;
}

function iconCalendar() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 14h3M8 17h6"/></svg>`;
}
function iconChevron() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`;
}
function iconLocation() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>`;
}
function iconBell() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 22h4"/></svg>`;
}
function iconWeather() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 17.5a4 4 0 1 1 .4-8A5.5 5.5 0 0 1 18 11a3.3 3.3 0 1 1-.5 6.5H7Z"/><path d="M9 21l1-1.5M14 21l1-1.5"/></svg>`;
}
function iconDatabase() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>`;
}
function iconHome() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z"/></svg>`;
}
function iconPlus() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`;
}
function iconChecklist() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9zM9 11l1.5 1.5L14 9M9 16h6"/></svg>`;
}
function iconUser() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4.1 3.5-6 8-6s7.2 1.9 8 6"/></svg>`;
}
