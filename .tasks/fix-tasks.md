# pomo 修复和补全任务

## 并行任务组（4 个独立任务）

### 任务 1: TUI 体验修复 + 计时器结束 bell

**目标文件：** src/ui/App.tsx
**任务内容：**

- 修复 App.tsx 的计时器逻辑，使用 useEffect + setInterval 实现真实倒计时
- 计时器结束时播放终端 bell: process.stdout.write('\x07')
- 确保 TUI 正确渲染倒计时

### 任务 2: IPC 问题修复（session lock 文件方案）

**目标文件：** src/cli.ts, src/store/sessions.ts, src/core/timer.ts
**任务内容：**

- pomo start 启动时写入 ~/.pomo/current.json（sessionId, startTime, pid）
- pomo distract <reason> 检查 current.json 存在则追加到 ~/.pomo/distractions.json
- pomo start 结束时清除 current.json 并导入 distractions.json 到 SQLite
- 更新相关测试

### 任务 3: macOS 系统通知

**目标文件：** package.json, src/core/timer.ts 或 src/cli.ts
**任务内容：**

- 安装 node-notifier 包
- 计时器结束时发送系统通知："🍅 专注完成！" 或 "☕ 休息结束"
- package.json 加入依赖

### 任务 4: 完善补全（README.md + 全局安装验证）

**目标文件：** README.md
**任务内容：**

- 验证 package.json 的 bin 字段（已有 "pomo": "dist/cli.js"）
- 验证 dist/cli.js 的 shebang（已有 #!/usr/bin/env node）
- 写完整的 README.md（项目简介、安装方式、命令列表、示例、License）

## 串行任务组

### 任务 5: 最终验证

**任务内容：**

- npm install
- npm run build
- npm test
- 确认全部通过
