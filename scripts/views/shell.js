export function createShell() {
  return `
    <div class="page-noise"></div>

    <div class="app-shell">
      <header class="topbar">
        <div class="topbar__brand">
          <div class="brand-mark">薪</div>
          <div class="brand-copy">
            <p class="brand-copy__title">薪期台账</p>
          </div>
        </div>

        <div class="topbar__actions">
          <button class="button button--primary" data-open-compose type="button">新增事项</button>
          <a class="button button--secondary" href="#board">看板</a>
        </div>
      </header>

      <main class="workspace">
        <section class="hero-row">
          <article class="panel hero-salary">
            <span id="salaryStatus" class="pill pill--dark">--</span>
            <strong id="salaryCountdown" class="hero-salary__countdown">--</strong>
            <div class="hero-salary__info">
              <span class="hero-salary__meta">下次 <strong id="salaryDate">--</strong></span>
              <span class="hero-salary__meta">月收入 <strong id="salaryAmountDisplay">--</strong></span>
              <span class="hero-salary__meta">账户 <strong id="salaryAccountDisplay">--</strong></span>
            </div>

            <details class="hero-disclosure">
              <summary class="hero-disclosure__summary">编辑</summary>
              <form id="salaryForm" class="stack-form hero-disclosure__body">
                <label class="field">
                  <span class="field__label">每月发薪日</span>
                  <select id="salaryDaySelect" name="salaryDay" class="select"></select>
                </label>

                <div class="split-grid">
                  <label class="field">
                    <span class="field__label">月收入备注</span>
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
                    <span class="field__label">发薪账户</span>
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

                <button class="button button--secondary" type="submit">保存</button>
              </form>
            </details>
          </article>

          <article class="panel hero-weather">
            <div class="hero-weather__header">
              <span id="weatherState" class="pill">未查询</span>
            </div>
            <div id="weatherCard" class="weather-card"></div>
            <form id="weatherForm" class="weather-inline">
              <input id="cityInput" name="city" class="input" type="text" placeholder="输入城市名" />
              <button class="button button--secondary" type="submit">刷新</button>
            </form>
          </article>
        </section>

        <section class="stat-row">
          <article class="stat">
            <span class="stat__label">发薪节点</span>
            <strong id="metricNextSalary" class="stat__value">--</strong>
          </article>
          <article class="stat">
            <span class="stat__label">到期项</span>
            <strong id="metricNextReminder" class="stat__value">--</strong>
          </article>
          <article class="stat">
            <span class="stat__label">风险</span>
            <strong id="metricOverdue" class="stat__value">--</strong>
          </article>
          <article class="stat stat--today">
            <span class="stat__label">今天</span>
            <strong id="todayLabel" class="stat__value">--</strong>
            <span id="storageState" class="stat__meta">--</span>
          </article>
        </section>

        <section class="content-area">
          <article class="panel" id="board">
            <div class="section-head">
              <div>
                <h2 class="section-title">事项看板</h2>
                <span id="reminderSummary" class="section-hint">--</span>
              </div>
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

          <article class="panel" id="agenda">
            <div class="section-head">
              <div>
                <h2 class="section-title">时间线</h2>
                <span class="section-hint">未来 30 天</span>
              </div>
            </div>
            <div id="agendaList" class="agenda-list"></div>
          </article>
        </section>

        <section class="footer-zone">
          <details class="footer-card" id="composeDisclosure">
            <summary class="footer-card__summary">
              <span class="footer-card__title">新增到期事项</span>
              <span class="footer-card__hint">填写标题、日期、分类和备注</span>
            </summary>

            <form id="reminderForm" class="stack-form footer-card__body">
              <label class="field">
                <span class="field__label">提醒标题</span>
                <input id="reminderTitleInput" name="title" class="input" type="text" placeholder="手机套餐续费" required />
              </label>

              <div class="split-grid">
                <label class="field">
                  <span class="field__label">到期日期</span>
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
                  <span class="field__label">提前准备天数</span>
                  <input id="reminderLeadDaysInput" name="leadDays" class="input" type="number" min="0" max="30" value="3" />
                </label>
                <div class="field">
                  <span class="field__label">保存方式</span>
                  <div class="pill">本地保存</div>
                </div>
              </div>

              <label class="field">
                <span class="field__label">备注</span>
                <textarea id="reminderNotesInput" name="notes" class="textarea" placeholder="金额、联系人、续费规则..."></textarea>
              </label>

              <button class="button button--primary" type="submit">保存事项</button>
            </form>
          </details>

          <details class="footer-card">
            <summary class="footer-card__summary">
              <span class="footer-card__title">发薪提醒</span>
              <span id="pushStatusBadge" class="pill">未开启</span>
            </summary>

            <div class="footer-card__body notification-panel__body">
              <p id="pushSupportNote" class="form-note">把站点加到 iPhone 主屏幕后可开启每月推送。</p>

              <div class="split-grid">
                <label class="field">
                  <span class="field__label">提前提醒天数</span>
                  <input id="pushLeadDaysInput" name="pushLeadDays" class="input" type="number" min="0" max="7" value="0" />
                </label>
                <label class="field">
                  <span class="field__label">提醒时间</span>
                  <input id="pushHourInput" name="pushHour" class="input" type="number" min="0" max="23" value="9" />
                </label>
              </div>

              <div class="pill-row">
                <span id="pushTimezoneLabel" class="pill">Asia/Shanghai</span>
                <span id="pushPermissionLabel" class="pill">权限未请求</span>
              </div>

              <div class="notification-panel__actions">
                <button id="pushEnableButton" class="button button--primary" type="button">开启发薪提醒</button>
                <button id="pushTestButton" class="button button--secondary" type="button">测试通知</button>
                <button id="pushDisableButton" class="button button--secondary" type="button">关闭提醒</button>
              </div>

              <p id="pushSyncState" class="form-note">--</p>
            </div>
          </details>

          <details class="footer-card">
            <summary class="footer-card__summary">
              <span class="footer-card__title">工具</span>
              <span class="footer-card__hint">安装、导出、备份</span>
            </summary>

            <div class="footer-card__body utility-row">
              <button id="installButton" class="utility-action utility-action--primary" type="button">
                <span class="utility-action__title">安装到主屏幕</span>
                <span class="utility-action__meta">保留离线能力和原生入口</span>
              </button>
              <button id="calendarExportButton" class="utility-action" type="button">
                <span class="utility-action__title">导出日历</span>
                <span class="utility-action__meta">同步到日历系统</span>
              </button>
              <button id="backupExportButton" class="utility-action" type="button">
                <span class="utility-action__title">导出备份</span>
                <span class="utility-action__meta">JSON 备份便于迁移</span>
              </button>
            </div>
          </details>
        </section>
      </main>
    </div>
  `;
}
