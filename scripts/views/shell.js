export function createShell() {
  return `
    <div class="page-noise"></div>

    <div class="app-shell">
      <main class="workspace">
        <section class="view view--overview is-active" data-view="overview">
          <header class="home-head">
            <div>
              <p id="todayLabel" class="home-head__date">--</p>
              <h1 class="home-head__title">我的薪期</h1>
            </div>
            <div class="weather-peek" id="overviewWeather">
              <div class="weather-widget__loading">读取天气中…</div>
            </div>
          </header>

          <article class="payday-card">
            <div class="payday-card__top">
              <span>下次发薪</span>
              <span id="salaryStatus">--</span>
            </div>
            <div class="payday-card__main">
              <div class="payday-card__count">
                <strong id="salaryCountdown">--</strong>
                <span id="salaryCountdownUnit">天</span>
              </div>
              <div class="payday-card__date">
                <span>到账日</span>
                <strong id="salaryDate">--</strong>
              </div>
            </div>
            <div class="payday-card__details">
              <span class="payday-detail">
                <span aria-hidden="true">${iconWallet()}</span>
                <span>
                  <small>收入</small>
                  <strong id="salaryAmountDisplay">--</strong>
                </span>
              </span>
              <span class="payday-detail">
                <span aria-hidden="true">${iconCard()}</span>
                <span>
                  <small>账户</small>
                  <strong id="salaryAccountDisplay">--</strong>
                </span>
              </span>
            </div>
          </article>

          <section class="content-area">
            <article class="reminders-card" id="board">
              <div class="section-head">
                <h2 class="section-title">最近</h2>
                <div class="section-head__side">
                  <span id="reminderCount" class="pill">0 条</span>
                </div>
              </div>

              <div class="filters" role="tablist" aria-label="提醒筛选">
                <button class="filter is-active" data-filter="all" type="button">全部</button>
                <button class="filter" data-filter="upcoming" type="button">7 天内</button>
                <button class="filter" data-filter="overdue" type="button">已逾期</button>
              </div>

              <div id="reminderList" class="reminder-list"></div>
            </article>
          </section>
        </section>

        <section class="view view--compose" data-view="compose" hidden>
          <article class="panel compose-stage">
            <div class="compose-stage__intro">
              <h1 class="compose-stage__title">记一件事</h1>
            </div>

            <form id="reminderForm" class="compose-stage__form stack-form">
              <label class="field">
                <span class="field__label">事情</span>
                <input id="reminderTitleInput" name="title" class="input" type="text" placeholder="手机套餐续费" required />
              </label>

              <div class="split-grid">
                <label class="field">
                  <span class="field__label">日期</span>
                  <input id="reminderDateInput" name="date" class="input" type="date" required />
                </label>
                <label class="field">
                  <span class="field__label">分类</span>
                  <select id="reminderCategoryInput" name="category" class="select">
                    <option value="账单">账单</option>
                    <option value="会员">会员</option>
                    <option value="证件">证件</option>
                    <option value="合同">合同</option>
                    <option value="家庭">家庭</option>
                    <option value="其他">其他</option>
                  </select>
                </label>
              </div>

              <div class="split-grid">
                <label class="field">
                  <span class="field__label">提前提醒</span>
                  <input id="reminderLeadDaysInput" name="leadDays" class="input" type="number" min="0" max="30" value="3" />
                </label>
              </div>

              <label class="field">
                <span class="field__label">备注</span>
                <textarea id="reminderNotesInput" name="notes" class="textarea" placeholder="金额、联系人、续费规则..."></textarea>
              </label>

              <button class="button button--primary button--block" type="submit">保存</button>
            </form>
          </article>
        </section>

        <section class="view view--settings" data-view="settings" hidden>
          <section class="settings-intro">
            <h1 class="settings-intro__title">我的</h1>
          </section>

          <section class="settings-section">
            <div class="settings-section__head">
              <h2 class="settings-section__title">发薪</h2>
            </div>

            <form id="salaryForm" class="settings-group settings-group--form">
              <label class="field">
                <span class="field__label">发薪日</span>
                <select id="salaryDaySelect" name="salaryDay" class="select"></select>
              </label>

              <div class="split-grid">
                <label class="field">
                  <span class="field__label">收入</span>
                  <input
                    id="salaryAmountInput"
                    name="salaryAmount"
                    class="input"
                    type="text"
                    placeholder="15,000 元"
                    autocomplete="off"
                  />
                </label>

                <label class="field">
                  <span class="field__label">账户</span>
                  <input
                    id="salaryAccountInput"
                    name="salaryAccount"
                    class="input"
                    type="text"
                    placeholder="工资卡"
                    autocomplete="off"
                  />
                </label>
              </div>

              <button class="button button--primary button--block" type="submit">保存</button>
            </form>
          </section>

          <section class="settings-section">
            <div class="settings-section__head">
              <h2 class="settings-section__title">通知</h2>
            </div>

            <article class="settings-group">
              <div class="settings-banner">
                <span id="pushStatusBadge" class="pill">未开启</span>
                <p id="pushSupportNote" class="form-note">把站点加到 iPhone 主屏幕后可开启每月推送。</p>
              </div>

              <div class="settings-list">
                <div class="settings-list__row">
                  <span class="settings-list__label">提前天数</span>
                  <input id="pushLeadDaysInput" name="pushLeadDays" class="input settings-list__input" type="number" min="0" max="7" value="0" />
                </div>

                <div class="settings-list__row">
                  <span class="settings-list__label">发送时间</span>
                  <span class="pill">09:00</span>
                </div>

                <div class="settings-list__row settings-list__row--compact">
                  <span class="settings-list__label">权限</span>
                  <span id="pushPermissionLabel" class="pill">未请求</span>
                </div>
              </div>

              <div class="notification-panel__actions">
                <button id="pushEnableButton" class="button button--primary" type="button">开启发薪提醒</button>
                <button id="pushTestButton" class="button button--secondary" type="button">测试通知</button>
                <button id="pushDisableButton" class="button button--secondary" type="button">关闭提醒</button>
              </div>
              <p id="pushSyncState" class="form-note">--</p>
            </article>
          </section>

          <section class="settings-section">
            <div class="settings-section__head">
              <h2 class="settings-section__title">工具</h2>
            </div>

            <article class="settings-group utility-row">
              <button id="installButton" class="utility-action utility-action--primary" type="button">
                <span class="utility-action__title">安装到主屏幕</span>
              </button>
              <button id="calendarExportButton" class="utility-action" type="button">
                <span class="utility-action__title">导出日历</span>
              </button>
              <button id="backupExportButton" class="utility-action" type="button">
                <span class="utility-action__title">导出备份</span>
              </button>
            </article>
          </section>
        </section>
      </main>

      <nav class="bottom-tabs" aria-label="主导航">
        <button class="bottom-tabs__item is-active" data-switch-view="overview" data-tab-button type="button" aria-selected="true">
          <span aria-hidden="true">${iconToday()}</span>
          今天
        </button>
        <button class="bottom-tabs__item" data-switch-view="compose" data-tab-button type="button" aria-selected="false">
          <span aria-hidden="true">${iconPlus()}</span>
          记一笔
        </button>
        <button class="bottom-tabs__item" data-switch-view="settings" data-tab-button type="button" aria-selected="false">
          <span aria-hidden="true">${iconPerson()}</span>
          我的
        </button>
      </nav>
    </div>
  `;
}

function iconWallet() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/><circle cx="17" cy="14" r="1.5" fill="currentColor" stroke="none"/></svg>`;
}

function iconCard() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>`;
}

function iconBell() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
}

function iconToday() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;
}

function iconPlus() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`;
}

function iconPerson() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>`;
}
