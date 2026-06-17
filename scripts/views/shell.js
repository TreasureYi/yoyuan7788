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
            <p class="brand-copy__subtitle">长期自用的工资、账单与到期事项工作台</p>
          </div>
        </div>

        <div class="topbar__actions">
          <button class="button button--primary" data-open-compose type="button">新增事项</button>
          <a class="button button--secondary" href="#board">查看看板</a>
        </div>
      </header>

      <main class="workspace">
        <section class="overview panel">
          <div class="overview__main">
            <div class="overview__copy-block">
              <p class="eyebrow">Dashboard Overview</p>
              <h1 class="overview__headline">先看状态，再处理事项，最后进入配置和辅助工具。</h1>
              <p class="overview__copy">
                首页不再把所有功能堆在一起。它现在只负责三件事：告诉你下一次发薪和最近到期，给你进入主看板的路径，以及把配置与工具收纳到稳定位置。
              </p>
            </div>

            <div class="overview__actions">
              <button class="button button--primary" data-open-compose type="button">新增事项</button>
              <a class="button button--secondary" href="#agenda">查看 30 天时间线</a>
            </div>

            <div class="overview__rule-grid">
              <article class="rule-card">
                <span class="rule-card__label">核心对象</span>
                <strong class="rule-card__value">工资、提醒、时间线、风险事项</strong>
              </article>
              <article class="rule-card">
                <span class="rule-card__label">辅助工具</span>
                <strong class="rule-card__value">天气、安装、导出、备份与后续同步</strong>
              </article>
            </div>
          </div>

          <aside class="overview__side">
            <article class="overview-card overview-card--emphasis">
              <span class="overview-card__label">今日摘要</span>
              <strong id="todayLabel" class="overview-card__value">--</strong>
              <p id="storageState" class="overview-card__support">正在读取本地状态...</p>
            </article>

            <article class="overview-card">
              <span class="overview-card__label">首页规则</span>
              <div class="stack-points">
                <div class="stack-point">
                  <strong>总览优先</strong>
                  <span>先看发薪、到期和风险，不在首屏展示所有配置细节。</span>
                </div>
                <div class="stack-point">
                  <strong>主任务固定</strong>
                  <span>看板和时间线始终是核心工作层，新增模块不能挤占它们的位置。</span>
                </div>
                <div class="stack-point">
                  <strong>工具降级</strong>
                  <span>天气和导出类能力进入辅助工具区，不和薪资配置并列。</span>
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

        <section class="main-grid">
          <article class="panel card board-panel" id="board">
            <div class="board-head">
              <div class="section-head__copy">
                <p class="eyebrow">Due Board</p>
                <h2 class="section-title">事项看板</h2>
                <p class="section-copy">主视区只保留真正高频的任务列表，适合每天快速扫一眼优先级、到期日和处理动作。</p>
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
                <p class="section-copy">把发薪节点和到期事项放在同一条时间线里，方便快速理解接下来一个月的节奏。</p>
              </div>
            </div>

            <div id="agendaList" class="agenda-list"></div>
          </article>
        </section>

        <section class="support-grid">
          <div class="support-grid__config">
            <article class="panel card salary-panel">
              <div class="section-head">
                <div class="section-head__copy">
                  <p class="eyebrow">Core Configuration</p>
                  <h2 class="section-title">发薪节奏</h2>
                  <p class="section-copy">薪资是系统主轴，放在核心配置区，影响你的时间线和发薪节点理解。</p>
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
                <p class="form-note">这里只会保存发薪日和备注。想收到 iPhone 系统提醒，还需要在下方单独点击“开启发薪提醒”。</p>
              </form>
            </article>

            <article class="panel card notification-panel">
              <div class="section-head">
                <div class="section-head__copy">
                  <p class="eyebrow">System Ability</p>
                  <h2 class="section-title">发薪提醒</h2>
                  <p class="section-copy">当你把站点加到 iPhone 主屏幕后，可以把发薪规则同步到云端，由定时任务每月推送到你的手机。</p>
                </div>
                <span id="pushStatusBadge" class="pill">未开启</span>
              </div>

              <div class="notification-panel__body">
                <p id="pushSupportNote" class="form-note">
                  当前会优先检测浏览器是否支持 Web Push，并提示你是否已经用主屏幕模式安装。
                </p>

                <div class="split-grid">
                  <label class="field">
                    <span class="field__label">提前提醒天数</span>
                    <input
                      id="pushLeadDaysInput"
                      name="pushLeadDays"
                      class="input"
                      type="number"
                      min="0"
                      max="7"
                      value="0"
                    />
                  </label>

                  <label class="field">
                    <span class="field__label">提醒时间</span>
                    <input
                      id="pushHourInput"
                      name="pushHour"
                      class="input"
                      type="number"
                      min="0"
                      max="23"
                      value="9"
                    />
                  </label>
                </div>

                <div class="pill-row">
                  <span id="pushTimezoneLabel" class="pill">Asia/Shanghai</span>
                  <span id="pushPermissionLabel" class="pill">权限未请求</span>
                </div>

                <div class="notification-panel__actions">
                  <button id="pushEnableButton" class="button button--primary" type="button">开启发薪提醒</button>
                  <button id="pushTestButton" class="button button--secondary" type="button">发送测试通知</button>
                  <button id="pushDisableButton" class="button button--secondary" type="button">关闭提醒</button>
                </div>

                <p id="pushSyncState" class="form-note">开启后会把发薪日、提醒时间和当前设备订阅一起同步到推送服务。测试通知只验证当前设备权限与通知显示，不代表云端定时任务已经成功触发。</p>
              </div>
            </article>

            <article class="panel card quick-add-panel" id="quickAdd">
              <div class="section-head">
                <div class="section-head__copy">
                  <p class="eyebrow">Quick Entry</p>
                  <h2 class="section-title">新增到期事项</h2>
                  <p class="section-copy">首屏只保留入口，完整录入表单收在这里，避免把首页变成一张从头到尾的长表单。</p>
                </div>
              </div>

              <details id="composeDisclosure" class="composer-disclosure">
                <summary class="composer-disclosure__summary">
                  <span class="composer-disclosure__title">展开录入表单</span>
                  <span class="composer-disclosure__hint">填写标题、日期、分类和备注</span>
                </summary>

                <form id="reminderForm" class="stack-form composer-disclosure__body">
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
                    <p class="form-note">录入结构会继续保留，后续接账号或云端同步也不用重做表单。</p>
                    <button class="button button--primary" type="submit">保存事项</button>
                  </div>
                </form>
              </details>
            </article>
          </div>

          <aside class="support-grid__tools">
            <article class="panel card utility-panel">
              <div class="section-head">
                <div class="section-head__copy">
                  <p class="eyebrow">Auxiliary Tools</p>
                  <h2 class="section-title">辅助工具区</h2>
                  <p class="section-copy">安装、导出和备份都放在同一个工具区，避免它们在首页首屏和主任务并列。</p>
                </div>
              </div>

              <div class="utility-actions">
                <button id="installButton" class="utility-action utility-action--primary" type="button">
                  <span class="utility-action__title">安装到主屏幕</span>
                  <span class="utility-action__meta">保留离线能力和更像原生的访问入口</span>
                </button>
                <button id="calendarExportButton" class="utility-action" type="button">
                  <span class="utility-action__title">导出日历</span>
                  <span class="utility-action__meta">把事项节点同步到你的日历系统</span>
                </button>
                <button id="backupExportButton" class="utility-action" type="button">
                  <span class="utility-action__title">导出备份</span>
                  <span class="utility-action__meta">导出本地 JSON，方便迁移与恢复</span>
                </button>
              </div>
            </article>

            <article class="panel card weather-panel">
              <div class="section-head">
                <div class="section-head__copy">
                  <p class="eyebrow">Weather Snapshot</p>
                  <h2 class="section-title">天气速览</h2>
                  <p class="section-copy">作为辅助信息保留在工具区，只在需要时补充当天体感，不干扰工资和事项主流程。</p>
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

            <article class="panel card planning-card">
              <div class="section-head">
                <div class="section-head__copy">
                  <p class="eyebrow">Expansion Rules</p>
                  <h2 class="section-title">后续新增模块怎么放</h2>
                  <p class="section-copy">以后要加同步状态、通知设置或其他工具时，先按层级归类，不再直接把卡片往首页下方堆。</p>
                </div>
              </div>

              <div class="panel-note">
                <div class="panel-note__list">
                  <div class="panel-note__item">
                    <span class="panel-note__dot"></span>
                    <span>会影响工资、提醒、时间线语义的功能，进入核心配置区或主任务区。</span>
                  </div>
                  <div class="panel-note__item">
                    <span class="panel-note__dot"></span>
                    <span>安装、导出、天气、同步状态这类能力，默认进入辅助工具区。</span>
                  </div>
                  <div class="panel-note__item">
                    <span class="panel-note__dot"></span>
                    <span>如果以后需要更多工具，优先扩展工具区，不破坏首页的总览和主任务顺序。</span>
                  </div>
                </div>
              </div>
            </article>
          </aside>
        </section>
      </main>
    </div>
  `;
}
