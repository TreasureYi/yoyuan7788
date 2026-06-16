export function createShell() {
  return `
    <div class="page-orb"></div>
    <div class="page-noise"></div>

    <div class="app-shell">
      <header class="topbar">
        <div class="topbar__brand">
          <div class="brand-mark">薪</div>
          <div class="brand-copy">
            <p class="brand-copy__title">薪期台账</p>
            <p class="brand-copy__subtitle">为工资日、账单日和到期节点准备的个人工作台</p>
          </div>
        </div>

        <div class="topbar__actions">
          <button id="installButton" class="button button--secondary" type="button">添加到主屏幕</button>
          <button id="calendarExportButton" class="button button--ghost" type="button">导出日历</button>
          <button id="backupExportButton" class="button button--primary" type="button">导出备份</button>
        </div>
      </header>

      <main class="workspace">
        <section class="hero panel">
          <div class="hero__main">
            <p class="eyebrow">Personal Command Desk</p>
            <h1 class="hero__headline">把工资周期和到期事项，收进同一个稳定的日常界面。</h1>
            <p class="hero__copy">
              这不是演示页，而是一套面向真实长期使用的个人桌面。它优先保证清晰、移动端体验和可维护性，同时保留 PWA 的安装、导出和离线能力。
            </p>

            <div class="hero__chips">
              <span class="chip">本地优先</span>
              <span class="chip">可加到主屏幕</span>
              <span class="chip">支持 ICS 导出</span>
            </div>

            <div class="hero__actions">
              <a class="button button--primary" href="#compose">新增提醒</a>
              <a class="button button--secondary" href="#agenda">查看 30 天时间线</a>
            </div>

            <div class="summary-bar">
              <article class="metric">
                <span class="metric__label">下一个发薪节点</span>
                <strong id="metricNextSalary" class="metric__value">--</strong>
              </article>
              <article class="metric">
                <span class="metric__label">最接近的到期项</span>
                <strong id="metricNextReminder" class="metric__value">--</strong>
              </article>
              <article class="metric">
                <span class="metric__label">当前逾期项目</span>
                <strong id="metricOverdue" class="metric__value">--</strong>
              </article>
            </div>
          </div>

          <aside class="hero__aside">
            <article class="hero-card hero-card--dark">
              <span class="hero-card__label">Today</span>
              <strong id="todayLabel" class="hero-card__value">--</strong>
              <p id="storageState" class="hero-card__support">正在读取本地状态...</p>
            </article>

            <article class="hero-card">
              <span class="hero-card__label">使用方式</span>
              <strong class="hero-card__value">适合长期自用，后续也可继续接云端同步</strong>
            </article>
          </aside>
        </section>

        <section class="primary-grid">
          <article class="panel card salary-panel">
            <div class="section-head">
              <div class="section-head__copy">
                <p class="eyebrow">Salary Cycle</p>
                <h2 class="section-title">发薪日设定</h2>
                <p class="section-copy">先把月度节奏固定下来，其他提醒会围绕你的实际生活周期展开。</p>
              </div>
              <span id="salaryStatus" class="pill pill--dark">已启用</span>
            </div>

            <div class="salary-lead">
              <strong id="salaryCountdown" class="salary-lead__countdown">--</strong>
              <div class="salary-kpis">
                <article class="kpi">
                  <span class="kpi__label">下个日期</span>
                  <strong id="salaryDate" class="kpi__value">--</strong>
                </article>
                <article class="kpi">
                  <span class="kpi__label">月收入备注</span>
                  <strong id="salaryAmountDisplay" class="kpi__value">--</strong>
                </article>
                <article class="kpi">
                  <span class="kpi__label">发薪账户</span>
                  <strong id="salaryAccountDisplay" class="kpi__value">--</strong>
                </article>
              </div>
            </div>

            <form id="salaryForm" class="stack-form">
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
                    placeholder="例如 15,000 元"
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
                    placeholder="例如 工资卡 / 支付宝"
                    autocomplete="off"
                  />
                </label>
              </div>

              <button class="button button--secondary" type="submit">保存薪资节奏</button>
            </form>
          </article>

          <article class="panel card" id="compose">
            <div class="section-head">
              <div class="section-head__copy">
                <p class="eyebrow">Reminder Composer</p>
                <h2 class="section-title">新增到期事项</h2>
                <p class="section-copy">把真正会影响生活节奏的项目放进来，比如账单、会员、证件、家庭事项。</p>
              </div>
            </div>

            <form id="reminderForm" class="stack-form">
              <label class="field">
                <span class="field__label">提醒标题</span>
                <input
                  id="reminderTitleInput"
                  name="title"
                  class="input"
                  type="text"
                  placeholder="例如 手机套餐续费"
                  required
                />
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
                  <input
                    id="reminderLeadDaysInput"
                    name="leadDays"
                    class="input"
                    type="number"
                    min="0"
                    max="30"
                    value="3"
                  />
                </label>

                <div class="field">
                  <span class="field__label">记录方式</span>
                  <div class="pill">默认保存在当前浏览器</div>
                </div>
              </div>

              <label class="field">
                <span class="field__label">备注</span>
                <textarea
                  id="reminderNotesInput"
                  name="notes"
                  class="textarea"
                  placeholder="记录金额、联系人、续费规则，或者你想提前准备的内容"
                ></textarea>
              </label>

              <div class="form-foot">
                <p class="form-note">如果你以后要接后端，这个结构可以很自然地扩展到同步、账号和共享数据。</p>
                <button class="button button--primary" type="submit">保存事项</button>
              </div>
            </form>
          </article>
        </section>

        <section class="secondary-grid">
          <article class="panel card">
            <div class="section-head">
              <div class="section-head__copy">
                <p class="eyebrow">Weather Snapshot</p>
                <h2 class="section-title">天气速览</h2>
                <p class="section-copy">保持一个轻量天气面板，适合在同一页里看今天的体感和出门条件。</p>
              </div>
              <span id="weatherState" class="pill">未查询</span>
            </div>

            <form id="weatherForm" class="weather-form">
              <label class="field">
                <span class="field__label">城市</span>
                <input id="cityInput" name="city" class="input" type="text" placeholder="例如 Shanghai / Beijing" />
              </label>
              <button class="button button--secondary" type="submit">刷新天气</button>
            </form>

            <div id="weatherCard" class="weather-card"></div>
          </article>

          <article class="panel card">
            <div class="section-head">
              <div class="section-head__copy">
                <p class="eyebrow">Project Notes</p>
                <h2 class="section-title">当前交付方式</h2>
                <p class="section-copy">这一版已经按正式项目结构整理，可直接继续接 Git、Pages 和后续轻量后端。</p>
              </div>
            </div>

            <div class="panel-note">
              <div class="panel-note__list">
                <div class="panel-note__item">
                  <span class="panel-note__dot"></span>
                  <span>界面、样式、脚本都已经整理到 <code>project/</code> 下，根目录只保留部署入口。</span>
                </div>
                <div class="panel-note__item">
                  <span class="panel-note__dot"></span>
                  <span>当前模式仍然是本地优先，适合快速上线；后续接 D1、KV 或其他存储时不需要推翻结构。</span>
                </div>
                <div class="panel-note__item">
                  <span class="panel-note__dot"></span>
                  <span>如果你要继续用 Cloudflare Pages + Git，后续更新只需要改代码并推送到主分支。</span>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section class="board-grid">
          <article class="panel card">
            <div class="board-head">
              <div class="section-head__copy">
                <p class="eyebrow">Due Board</p>
                <h2 class="section-title">事项看板</h2>
              </div>
              <div class="board-actions">
                <span id="reminderCount" class="pill">0 条</span>
                <span id="reminderSummary" class="summary-inline">还没有任何记录</span>
              </div>
            </div>

            <div class="filters" role="tablist" aria-label="提醒筛选">
              <button class="filter is-active" data-filter="all" type="button">全部</button>
              <button class="filter" data-filter="upcoming" type="button">7 天内</button>
              <button class="filter" data-filter="overdue" type="button">已逾期</button>
            </div>

            <div id="reminderList" class="reminder-list"></div>
          </article>

          <article class="panel card" id="agenda">
            <div class="section-head">
              <div class="section-head__copy">
                <p class="eyebrow">Next 30 Days</p>
                <h2 class="section-title">时间线</h2>
                <p class="section-copy">把发薪节点和到期事项放进同一条时间线里，更适合日常扫一眼。</p>
              </div>
            </div>

            <div id="agendaList" class="agenda-list"></div>
          </article>
        </section>
      </main>
    </div>
  `;
}
