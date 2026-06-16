# 薪期台账

一个适合个人长期使用的 `PWA`，用于管理：

- 每月发薪日
- 到期提醒
- 30 天时间线
- 天气速览
- 本地日历导出与数据备份

## 项目结构

正式源码文件现已整理至根目录：

- `styles/`: 设计系统与页面样式
- `scripts/`: 模块化业务逻辑
- `assets/icons/`: 图标资源

根目录部署入口：

- [index.html](index.html)
- [manifest.webmanifest](manifest.webmanifest)
- [sw.js](sw.js)

## 更新方式

如果你的 Cloudflare Pages 已连接 Git 仓库，后续更新就是：

```bash
git status
git add .
git commit -m "refine payroll desk"
git push origin main
```

推送后，Cloudflare 会自动重新部署。
