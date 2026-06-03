# pomo — Terminal Pomodoro + Distraction Tracker

## Stack

- Runtime: Node.js 20+, TypeScript 5.x (strict mode)

- TUI: ink@5 + react@18（React for terminal）

- Storage: better-sqlite3，数据库路径 ~/.pomo/sessions.db

- CLI: commander@12

- Tests: vitest

## Architecture（模块边界，必须遵守）

```
src/
├── types/index.ts          # 所有共享类型，唯一来源
├── core/
│   ├── timer.ts            # 纯函数状态机（支持 pause/resume），零副作用
│   ├── stats.ts            # 纯函数统计计算，零副作用
│   └── formatter.ts        # 数据格式化器（JSON/CSV）
├── store/
│   ├── db.ts               # SQLite 连接单例
│   ├── sessions.ts         # Session CRUD，只依赖 db.ts 和 types
│   └── config.ts           # 配置文件管理（~/.pomo/config.json）
├── commands/
│   ├── export.ts           # pomo export 命令
│   ├── config.ts           # pomo config 命令
│   └── history.ts          # pomo history 命令
├── ui/
│   ├── App.tsx             # 主 Ink 组件
│   ├── HistoryView.tsx     # 历史视图组件
│   └── components/         # TimerDisplay、StatsView、DistractionLog
└── cli.ts                  # commander 入口，组装一切
```

## Types（子代理必须先读 src/types/index.ts 再写代码）

所有接口定义在 src/types/index.ts，子代理不得在自己文件里重新定义已有接口。

## Coding Rules

- 只用具名导出（named exports），禁止 default export

- 函数用 JSDoc 注释参数和返回值

- 每个 public 函数必须有对应的 vitest 测试

## Workflow Behavior

收到复杂构建任务时：

1. 先写 src/types/index.ts（定义全部接口）

2. 用并行子代理分别实现 core/timer、core/stats、store、ui

3. 最后串行完成 cli.ts 集成

4. 每个子代理完成后在 .tasks/progress.md 记录摘要

## 项目状态

✅ **功能扩展完成** - 2026-06-03

- 所有模块已实现并测试通过
- npm run build 成功
- 107/107 测试全部通过（从 63 增加到 107）
- 核心功能：start, break, distract, stats
- 扩展功能：export, config, history, pause/resume
