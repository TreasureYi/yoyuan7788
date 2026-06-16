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
            <p class="brand-copy__subtitle">工资、账单与到期事项的一体化个人工作台</p>
          </div>
        </div>

        <div class="topbar__actions">
          <button id="installButton" class="button button--secondary" type="button">添加到主屏幕</button>
          <button id="calendarExportButton" class="button button--ghost" type="button">导出日历</button>
          <button id="backupExportButton" class="button button--primary" type="button">导出备份</button>
        </div>
      </header>

      <main class="workspace">
        <section class="overview panel">
          <div class="overview__main">
            <p class="eyebrow">Overview</p>
            <h1 class="overview__headline">把工资周期、到期事项和接下来 30 天的节奏，放进一个更像正式工作台的界面。</h1>
            <p class="overview__copy">
              这个首页现在先按企业级产品的思路重新分区：上面放概览和风险，中间放执行任务，右侧放配置与辅助信息。这样你一进来先看状态，再做录入，不会把所有内容堆成一块。
            </p>

            <div class="overview__actions">
              <a class="button button--primary" href="#compose">新增事项</a>
              <a class="button button--secondary" href="#board">查看事项看板</a>
            </div>
          </div>

          <aside class="overview__side">
            <article class="overview-card overview-card--emphasis">
              <span class="overview-card__label">今日状态</span>
              <strong id="todayLabel" class="overview-card__value">--</strong>
              <p id="storageState" class="overview-card__support">正在读取本地状态...</p>
            </article>

            <article class="overview-card">
              <span class="overview-card__label">界面分区</span>
              <div class="stack-points">
                <div class="stack-point">
                  <strong>概览区</strong>
                  <span>先看发薪节点、最近到期和风险数量。</span>
                </div>
                <div class="stack-point">
                  <strong>执行区</strong>
                  <span>看板和时间线负责日常查看与处理。</span>
                </div>
                <div class="stack-point">
                  <strong>配置区</strong>
                  <span>发薪设置、事项录入和天气放在侧边，避免干扰主任务。</span>
                </div>
              </div>
            </article>
          </aside>
        </section>

        <section class="overview-metrics">
          <article class="metric metric--focus">
            <span class="metric__label">下一个发薪节点</span>
            <strong id="metricNextSalary" class="metric__value">--</strong>
          </article>

          <article class="metric">
            <span class="metric__label">最接近的到期项</span>
            <strong id="metricNextReminder" class="metric__value">--</strong>
          </article>

          <article class="metric">
            <span class="metric__label">风险事项</span>
            <strong id="metricOverdue" class="metric__value">--</strong>
          </article>

          <article class="metric">
            <span class="metric__label">运行模式</span>
            <strong class="metric__value">本地优先</strong>
            <span class="metric__meta">支持安装、导出与后续同步扩展</span>
          </article>
        </section>

        <section class="workspace-frame">
          <div class="workspace-main">
            <article class="panel card board-panel" id="board">
              <div class="board-head">
                <div class="section-head__copy">
                  <p class="eyebrow">Due Board</p>
                  <h2 class="section-title">事项看板</h2>
                  <p class="section-copy">核心任务放在主视区，适合每天快速扫一眼优先级、到期日和处理动作。</p>
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

            <div class="workspace-row">
              <article class="panel card" id="agenda">
                <div class="section-head">
                  <div class="section-head__copy">
                    <p class="eyebrow">Next 30 Days</p>
                    <h2 class="section-title">时间线</h2>
                    <p class="section-copy">把发薪节点和到期事项放在同一条时间线里，方便观察接下来一个月的节奏。</p>
                  </div>
                </div>

                <div id="agendaList" class="agenda-list"></div>
              </article>

              <article class="panel card planning-card">
                <div class="section-head">
                  <div class="section-head__copy">
                    <p class="eyebrow">Operating Model</p>
                    <h2 class="section-title">同步与备份规划</h2>
                    <p class="section-copy">先满足稳定自用，再逐步扩展到团队里常见的同步和恢复能力。</p>
                  </div>
                </div>

                <div class="panel-note">
                  <div class="panel-note__list">
                    <div class="panel-note__item">
                      <span class="panel-note__dot"></span>
                      <span>当前数据保存在本地浏览器，适合先快速投入使用，不依赖账号系统。</span>
                    </div>
                    <div class="panel-note__item">
                      <span class="panel-note__dot"></span>
                      <span>通过 ICS 日历导出和 JSON 备份先解决迁移与恢复，不把同步复杂度提前压进首页。</span>
                    </div>
                    <div class="panel-note__item">
                      <span class="panel-note__dot"></span>
                      <span>如果后续接云端，同样可以保持“概览、执行、配置”这套分区，不需要重做页面骨架。</span>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <aside class="workspace-side">
            <article class="panel card salary-panel">
              <div class="section-head">
                <div class="section-head__copy">
                  <p class="eyebrow">Salary Cycle</p>
                  <h2 class="section-title">发薪节奏</h2>
                  <p class="section-copy">先固定你的月度薪资节奏，后面的提醒和时间线才会更贴近真实生活。</p>
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
                  <p class="section-copy">录入区收在侧边，方便随时新增，但不会抢走主看板的注意力。</p>
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
                    <span class="field__label">保存方式</span>
                    <div class="pill">当前浏览器本地保存</div>
                  </div>
                </div>

                <label class="field">
                  <span class="field__label">备注</span>
                  <textarea
                    id="reminderNotesInput"
                    name="notes"
                    class="textarea"
                    placeholder="记录金额、联系人、续费规则或需要提前准备的内容"
                  ></textarea>
                </label>

                <div class="form-foot">
                  <p class="form-note">后续如果接账号或云端同步，这个录入结构也可以继续复用。</p>
                  <button class="button button--primary" type="submit">保存事项</button>
                </div>
              </form>
            </article>

            <article class="panel card">
              <div class="section-head">
                <div class="section-head__copy">
                  <p class="eyebrow">Weather Snapshot</p>
                  <h2 class="section-title">天气速览</h2>
                  <p class="section-copy">作为辅助信息放在侧边，只在需要时补充今天的体感和出门条件。</p>
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
          </aside>
        </section>
      </main>
    </div>
  `;
}
