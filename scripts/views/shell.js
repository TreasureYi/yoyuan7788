export function createShell() {
  return `
    <div class="page-noise"></div>

    <div class="app-shell">
      <header class="app-header">
        <button class="brand" data-switch-view="overview" type="button" aria-label="返回薪资概览">
          <span class="brand__mark" aria-hidden="true">${iconLeaf()}</span>
          <span>我的薪期</span>
        </button>
        <button class="icon-button" data-switch-view="compose" type="button" aria-label="新增事项">
          ${iconPlusCircle()}
        </button>
      </header>

      <main class="workspace">
        <section class="view view--overview is-active" data-view="overview">
          <header class="overview-intro">
            <div class="section-kicker">
              <span id="overviewMonth">--</span>
              <span class="section-kicker__line"></span>
            </div>
            <h1>薪资概览</h1>
            <p id="todayLabel">把发薪、待办与天气放在一个安静清楚的地方。</p>
          </header>

          <div class="dashboard-grid">
            <article class="journal-card graph-paper salary-overview-card">
              <div class="card-heading">
                <div>
                  <h2>距离下次发薪</h2>
                  <p id="salaryStatus">--</p>
                </div>
                <span class="soft-chip">净收入</span>
              </div>

              <div class="salary-curve" aria-hidden="true">
                <svg viewBox="0 0 420 130" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="salaryArea" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stop-color="#6f2c4f" stop-opacity=".18"/>
                      <stop offset="100%" stop-color="#6f2c4f" stop-opacity="0"/>
                    </linearGradient>
                  </defs>
                  <path class="salary-curve__area" d="M0 102 C72 72 126 103 186 91 C250 79 285 30 352 40 C385 44 403 63 420 75 L420 130 L0 130 Z"/>
                  <path class="salary-curve__line" d="M0 102 C72 72 126 103 186 91 C250 79 285 30 352 40 C385 44 403 63 420 75"/>
                </svg>
              </div>

              <div class="countdown-lockup">
                <strong id="salaryCountdown">--</strong>
                <span id="salaryCountdownUnit">天</span>
                <small>预计到账 <b id="salaryDate">--</b></small>
              </div>
            </article>

            <article class="journal-card graph-paper process-card">
              <div class="card-heading">
                <div>
                  <h2>发薪路径</h2>
                  <p>按你的设置自动计算</p>
                </div>
              </div>
              <div class="process-path">
                <div class="process-step is-done">
                  <span class="process-step__dot"></span>
                  <div><strong>发薪规则已设置</strong><small id="salaryReminderState">--</small></div>
                </div>
                <div class="process-step is-done">
                  <span class="process-step__dot"></span>
                  <div><strong>提醒日期</strong><small id="salaryReminderDate">--</small></div>
                </div>
                <div class="process-step">
                  <span class="process-step__dot"></span>
                  <div><strong>预计到账</strong><small id="salaryDatePath">见概览卡片</small></div>
                </div>
              </div>
            </article>

            <div class="metric-grid">
              <article class="journal-card graph-paper metric-card">
                <span class="metric-card__icon metric-card__icon--pink">${iconWallet()}</span>
                <small>每月收入</small>
                <strong id="salaryAmountDisplay">--</strong>
                <p>按当前工资设置显示</p>
              </article>
              <article class="journal-card graph-paper metric-card">
                <span class="metric-card__icon metric-card__icon--mauve">${iconCard()}</span>
                <small>到账账户</small>
                <strong id="salaryAccountDisplay">--</strong>
                <p>工资到账所用账户</p>
              </article>
              <article class="journal-card graph-paper metric-card">
                <span class="metric-card__icon metric-card__icon--lavender">${iconCalendar()}</span>
                <small>待办事项</small>
                <strong id="reminderSummaryValue">0</strong>
                <p id="reminderSummaryMeta">暂时没有待办</p>
              </article>
            </div>

            <article class="insight-card">
              <div>
                <h2>每月提醒</h2>
                <p>提前设置好后，应用会按照你的发薪日安排通知。</p>
              </div>
              <div class="insight-card__status">
                <strong id="pushSummaryValue">未开启</strong>
                <span id="pushSummaryMeta">中国区固定 09:00</span>
              </div>
              <button class="button button--light" data-switch-view="settings" type="button">
                检查设置 ${iconArrow()}
              </button>
            </article>

            <article class="journal-card reminders-card" id="board">
              <div class="section-head">
                <h2 class="section-title">最近事项</h2>
                <span id="reminderCount" class="soft-chip">0 条</span>
              </div>
              <div class="filters" role="tablist" aria-label="提醒筛选">
                <button class="filter is-active" data-filter="all" type="button">全部</button>
                <button class="filter" data-filter="upcoming" type="button">7 天内</button>
                <button class="filter" data-filter="overdue" type="button">已逾期</button>
              </div>
              <div id="reminderList" class="reminder-list"></div>
            </article>
          </div>
        </section>

        <section class="view view--compose" data-view="compose" hidden>
          <header class="page-intro">
            <div class="section-kicker"><span>新事项</span><span class="section-kicker__line"></span></div>
            <h1>记一件事</h1>
            <p>日期、分类和备注都可以慢慢补充。</p>
          </header>
          <article class="journal-card graph-paper form-card">
            <form id="reminderForm" class="stack-form">
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
                    <option value="账单">账单</option><option value="会员">会员</option>
                    <option value="证件">证件</option><option value="合同">合同</option>
                    <option value="家庭">家庭</option><option value="其他">其他</option>
                  </select>
                </label>
              </div>
              <label class="field field--short">
                <span class="field__label">提前提醒（天）</span>
                <input id="reminderLeadDaysInput" name="leadDays" class="input" type="number" min="0" max="30" value="3" />
              </label>
              <label class="field">
                <span class="field__label">备注</span>
                <textarea id="reminderNotesInput" name="notes" class="textarea" placeholder="金额、联系人、续费规则..."></textarea>
              </label>
              <button class="button button--primary button--block" type="submit">保存事项</button>
            </form>
          </article>
        </section>

        <section class="view view--weather" data-view="weather" hidden>
          <header class="page-intro">
            <div class="section-kicker"><span>当前位置</span><span class="section-kicker__line"></span></div>
            <h1>天气速览</h1>
            <p>轻点卡片即可重新定位并刷新天气。</p>
          </header>
          <article class="journal-card graph-paper weather-page-card">
            <div class="weather-page-card__orb">${iconWeather()}</div>
            <div class="weather-page-card__slot" data-weather-slot></div>
            <p>天气信息仅用于当天速览，不会上传你的精确位置。</p>
          </article>
        </section>

        <section class="view view--settings" data-view="settings" hidden>
          <header class="page-intro">
            <div class="section-kicker"><span>个人设置</span><span class="section-kicker__line"></span></div>
            <h1>我的设置</h1>
            <p>管理发薪规则、通知，以及数据保存方式。</p>
          </header>

          <section class="settings-grid">
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
              <div class="card-heading"><div><h2>通知设置</h2><p id="pushSupportNote">把站点加到 iPhone 主屏幕后可开启每月推送。</p></div><span id="pushStatusBadge" class="soft-chip">未开启</span></div>
              <div class="settings-list">
                <label class="settings-list__row"><span class="settings-list__label">提前天数</span><input id="pushLeadDaysInput" name="pushLeadDays" class="input settings-list__input" type="number" min="0" max="7" value="0" /></label>
                <div class="settings-list__row"><span class="settings-list__label">发送时间</span><span>09:00</span></div>
                <div class="settings-list__row"><span class="settings-list__label">权限</span><span id="pushPermissionLabel">未请求</span></div>
              </div>
              <div class="notification-panel__actions">
                <button id="pushEnableButton" class="button button--primary" type="button">开启发薪提醒</button>
                <button id="pushTestButton" class="button button--secondary" type="button">测试通知</button>
                <button id="pushDisableButton" class="button button--secondary" type="button">关闭提醒</button>
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
                <h2>更新应用不需要删除主屏幕图标</h2>
                <p>联网打开应用时会检查新版本，新代码接管后自动刷新一次。本机数据不会因为代码更新而清空。</p>
              </div>
            </article>
          </section>
        </section>
      </main>

      <nav class="bottom-tabs" aria-label="主导航">
        <button class="bottom-tabs__item is-active" data-switch-view="overview" data-tab-button type="button" aria-selected="true">${iconDashboard()}<span>概览</span></button>
        <button class="bottom-tabs__item" data-switch-view="compose" data-tab-button type="button" aria-selected="false">${iconPlus()}<span>记事</span></button>
        <button class="bottom-tabs__item" data-switch-view="weather" data-tab-button type="button" aria-selected="false">${iconWeather()}<span>天气</span></button>
        <button class="bottom-tabs__item" data-switch-view="settings" data-tab-button type="button" aria-selected="false">${iconSettings()}<span>设置</span></button>
      </nav>
    </div>
  `;
}

function iconLeaf() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21c-4-2.2-6.5-5.4-6.5-9.2 3.8 0 6.5 2.3 6.5 5.8 0-5.2 2.3-9.1 6.5-11.6.6 6.7-1.6 11.9-6.5 15Z"/><path d="M12 11.5C10.1 8.4 7.9 6.3 5.2 5c-.7 3.3.1 5.7 2.1 7.4"/></svg>`;
}
function iconPlusCircle() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/></svg>`;
}
function iconWallet() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 9.5h18"/><circle cx="17" cy="14" r="1.2" fill="currentColor"/></svg>`;
}
function iconCard() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/></svg>`;
}
function iconCalendar() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 14h3M8 17h6"/></svg>`;
}
function iconArrow() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 12h14M14 7l5 5-5 5"/></svg>`;
}
function iconWeather() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 17.5a4 4 0 1 1 .4-8A5.5 5.5 0 0 1 18 11a3.3 3.3 0 1 1-.5 6.5H7Z"/><path d="M9 21l1-1.5M14 21l1-1.5"/></svg>`;
}
function iconDatabase() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>`;
}
function iconDashboard() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>`;
}
function iconPlus() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`;
}
function iconSettings() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>`;
}
