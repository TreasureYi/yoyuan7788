# 薪期台账

一个适合个人长期使用的 `PWA`，用于管理：

- 每月发薪日
- 到期提醒
- 30 天时间线
- 天气速览
- 本地日历导出与数据备份
- iPhone / PWA 发薪通知（Web Push）
- 恢复码云端备份（浏览器端 AES-GCM 加密）

## 项目结构

项目现在就是单层正式结构，没有多包一层源码目录：

- [assets](assets): 图标与静态资源
- [scripts](scripts): 模块化业务逻辑
- [styles](styles): 设计系统与页面样式
- [index.html](index.html): 应用入口
- [manifest.webmanifest](manifest.webmanifest): PWA 配置
- [sw.js](sw.js): 离线缓存
- [functions](functions): Cloudflare Pages Functions 接口
- [cloudflare/d1-schema.sql](cloudflare/d1-schema.sql): 推送订阅表结构
- [workers/salary-notifier](workers/salary-notifier): 定时发送发薪提醒的独立 Worker

## 发薪通知架构

这个仓库现在支持 `方案 A` 的实现方式：

- 前端 PWA 负责：
  - 申请通知权限
  - 注册 push subscription
  - 同步发薪日、提前提醒天数
- Cloudflare Pages Functions 负责：
  - 提供 VAPID 公钥
  - 保存 / 关闭设备订阅
- Cloudflare D1 负责：
  - 存储每台设备的发薪提醒规则
  - 存储无法由服务器解密的工资与事项备份
- 独立 Cloudflare Worker + Cron 负责：
  - 每天北京时间早上 9 点检查一次哪些设备到了提醒日
  - 按月循环发送 Web Push

## Cloudflare 配置

### 1. Pages 项目

在 `Pages -> Settings -> Functions` 或对应项目配置里添加：

- D1 绑定名：`DB`
- 环境变量：`VAPID_PUBLIC_KEY`

### 2. D1 建表

把 [`cloudflare/d1-schema.sql`](cloudflare/d1-schema.sql) 导入同一个 D1 数据库。

更新已有数据库时也需要再次执行该文件，以创建 `encrypted_user_backups` 表。

### 3. 定时 Worker

进入 [`workers/salary-notifier`](workers/salary-notifier)：

```bash
cd workers/salary-notifier
npm install
cp wrangler.example.toml wrangler.toml
```

然后在 `wrangler.toml` 里填：

- `database_name`
- `database_id`
- `APP_URL`
- `VAPID_SUBJECT`

再配置 secrets：

```bash
wrangler secret put VAPID_PUBLIC_KEY
wrangler secret put VAPID_PRIVATE_KEY
```

最后部署：

```bash
npm run deploy
```

## VAPID 密钥

需要一对 Web Push VAPID 密钥：

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

可以在 [`workers/salary-notifier`](workers/salary-notifier) 目录里执行：

```bash
npx web-push generate-vapid-keys
```

这对密钥必须同时给：

- Pages Functions
- salary notifier Worker

## iPhone 使用前提

想在 iPhone 上真正收到发薪提醒，用户必须：

- 用 Safari 打开站点
- 选择“添加到主屏幕”
- 从主屏幕图标再次打开
- 在应用内点击“开启发薪提醒”
- 允许通知权限

另外注意：

- 开启“云端备份”后，请把恢复码保存到密码管理器；恢复码丢失后无法解密云端数据
- 新设备或本机数据被清除后，可在“设置 -> 云端备份与恢复”输入恢复码
- “保存发薪设置”不会自动开启系统通知
- 可以先点一次“发送测试通知”，确认当前 iPhone 的 PWA 通知权限本身正常
- 定时 Worker 现在会在提醒日当天、到达提醒小时之后补发一次；如果你在当天稍晚时间才开启，也不必再等到下个月

## PWA 更新

应用会在联网打开和重新回到前台时检查新版 Service Worker。新版本接管后页面会自动刷新一次，不需要删除主屏幕图标；`localStorage` 数据不会因为代码更新而被清空。

## 更新方式

如果你的 Cloudflare Pages 已连接 Git 仓库，后续更新就是：

```bash
git status
git add .
git commit -m "refine payroll desk"
git push origin main
```

推送后，Cloudflare 会自动重新部署。
