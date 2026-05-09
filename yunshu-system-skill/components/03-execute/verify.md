# 证据化验证

## 门禁函数

```
BEFORE 声称任何状态或表达满意：

1. 识别：什么命令能证明这个声明？
2. 运行：执行完整命令（新鲜的、完整的）
3. 读取：完整输出，检查退出码，统计失败数
4. 验证：输出是否确认声明？
   - 否 → 用证据说明实际状态
   - 是 → 用证据说明声明
5. 只有这时：才能做出声明

跳过任何步骤 = 撒谎，不是验证
```

## 验证流程

1. **提取验证声明**：验证什么 + 命令 + 通过条件
2. **检查时效性**：源文件变更后，之前结果作废，必须重新验证
3. **执行命令**：捕获 stdout、stderr、exit code、耗时（超时 120s = FAIL）
4. **读取完整输出**：不过滤，检查错误行/警告行/堆栈跟踪
5. **判定结果**：通过或失败，没有"部分通过"（99/100 = 失败）
6. **生成证据报告**：声明/命令/期望/实际/判决/证据/耗时
7. **记录日志**：追加到 `.yunshu/verify-log.tsv`

## 验证类型

| 类型 | 适用场景 | 验证命令示例 |
|------|----------|-------------|
| 编译验证 | 项目编译检查 | `npm run build` / `cargo build` |
| 单元测试 | 自动化测试执行 | `npm test` / `pytest` |
| 代码检查 | 代码风格/质量检查 | `npm run lint` / `ruff check` |
| 运行验证 | 服务可启动、端口响应 | `curl localhost:3000/health` |
| UI 验证 | 界面渲染验证 | 截图 + 视觉确认 |
| 编译错误汇总 | 批量定位编译/类型错误 | `npm run build 2>&1 | head -100`，按文件和类型分组 |
| 端到端冒烟 | Playwright/E2E 测试验证 | `npm run smoketest` |
| CLI 交互验证 | 交互式 CLI/TUI 行为验证 | tmux / PTY 测试工具（见验证工具箱） |
| UI 交互验证 | Web/IDE/Electron UI 验证 | Playwright / CDP 测试工具（见验证工具箱） |
| CI 检查验证 | PR 附加检查状态验证 | `gh pr checks --json name,bucket,state` |

## 硬规则

- **不在脑中验证** — 必须运行命令
- **不信任缓存结果** — 文件变更后必须重新验证
- **部分通过 = 失败** — 99/100 = 失败
- **每个声明单独验证** — 一声明一命令一判决
- **不用"应该"/"大概"/"看起来"** — 只有"通过"/"未通过"

## 常见失败模式

| 声明 | 需要 | 不充分 |
|------|------|--------|
| 测试通过 | 测试命令输出：0 失败 | 之前的运行、"应该通过" |
| 代码检查通过 | 代码检查输出：0 错误 | 部分检查、推断 |
| 构建成功 | 构建命令：退出码 0 | 代码检查通过、日志看起来不错 |
| Bug 已修复 | 测试原始症状：通过 | 代码改了，假设修好了 |
| 回归测试有效 | 红-绿循环验证 | 测试通过一次 |
| 代理完成 | VCS diff 显示变更 | 代理报告"成功" |
| 需求满足 | 逐行检查清单 | 测试通过 |

---

## 声明级科学验证

用于验证具体声明（如"Bug 已修复""性能提升 50%""API 返回 200"），区别于任务级验证。

**流程**：

1. 以可证伪形式重述声明：条件 + 指标 + 阈值
2. 选择可反驳声明的最小本地表面
3. 捕获基线（变更前状态）
4. 捕获处理（变更后状态，同命令/数据/环境）
5. 比较原始产物（数字/截图/日志/HTTP 响应/堆快照）
6. 返回三态判决：`VERIFIED` / `NOT VERIFIED` / `INCONCLUSIVE`

**判决规则**：

| 判决 | 条件 |
|------|------|
| `VERIFIED` | 基线和处理在预测方向上不同，达到声明阈值，无明显混淆因素 |
| `NOT VERIFIED` | 行为未改变、方向错误或未达阈值 |
| `INCONCLUSIVE` | 无有效基线、信号嘈杂或环境差异使比较无效 |

**产物布局**（可写磁盘时）：

```
/tmp/verify-this/<claim-slug>/
├── claim.md        # 可证伪声明
├── baseline/       # 基线产物
├── treatment/      # 处理产物
├── diff/           # 对比产物
└── verdict.md      # 判决
```

**输出格式**：

```
VERIFIED | NOT VERIFIED | INCONCLUSIVE
声明: <可证伪的声明>
证据: <指标>: 基线=<...>, 处理=<...>, 差异=<...>, 阈值=<...>
推理: <一段紧凑段落>
```

---

## 验证工具箱

### CLI 交互验证

| 工具 | 适用场景 | 关键操作 |
|------|----------|----------|
| 仓库原生脚本 | 已有测试/演示工具 | 优先复用 |
| tmux | 托管 CLI 会话 | `capture-pane` + `send-keys` |
| PTY 脚本 | 无 tmux 时的确定性等待 | Python `pty.openpty()` |
| 运行时检查器 | CPU 配置文件/堆快照 | Node `--inspect` |

tmux 最小示例：
```bash
SESSION="cli-harness-$(date +%s)"
tmux new-session -d -s "$SESSION" -- <command>
tmux capture-pane -pt "$SESSION"
tmux send-keys -t "$SESSION" "help" Enter
tmux kill-session -t "$SESSION"
```

### UI 交互验证

| 工具 | 适用场景 | 关键操作 |
|------|----------|----------|
| 仓库 Playwright | 已有浏览器测试 | 优先复用 |
| Playwright 探针 | Web 应用一次性验证 | `chromium.launch()` + 截图 |
| CDP 连接 | Electron/Chromium 应用 | `connectOverCDP()` + 页面选择 |

Playwright 最小示例：
```javascript
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto("http://127.0.0.1:<port>");
await page.screenshot({ path: "/tmp/ui-harness.png", fullPage: true });
await browser.close();
```

### 交互循环（CLI/UI 通用）

1. 行动前捕获当前状态（截图/快照/屏幕）
2. 执行恰好一个结构化动作
3. 捕获新状态
4. 验证预期状态变化
5. 保存前后对比产物
