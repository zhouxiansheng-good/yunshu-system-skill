# acceptance_runbook.md（模板）— 可执行验收剧本

> 目的：把"怎么用/怎么验收/怎么复跑/失败怎么定位"写成 SOP，确保每条 DoD 都有证据可追溯。

## 1. 元信息（必填）
- task_id：
- run_id：
- 验收类型（必填，选择其一）：编译验证 / 单元测试 / 代码检查 / 运行验证 / UI验证 / 混合
- 入口（必填）：（例如 `npm run dev` / `docker compose up` / `python app.py`）
- 访问地址 / 接口地址（可选但建议）：
- 账号与权限准备（如需）：
- 数据准备（测试数据/种子数据）（如需）：

## 2. DoD→用例→证据映射表（强制）
> 规则：每条 DoD 至少 1 个证据（截图/trace/日志/报告等）。若 DoD 失败，除失败证据外，还必须记录“失败采集”（见第 5 节）。

| DoD ID | DoD 描述 | 操作步骤 / 自动化用例 | 预期结果（断言） | 证据类型与路径/链接 | 失败时追加采集 |
|---|---|---|---|---|---|
| DoD-1 | （填写） | （填写） | （填写） | screenshot: … / trace: … / log: … | console/network/trace/服务端日志… |

## 3. 自动化验收（优先）
### 3.1 Web/UI（默认推荐：Playwright）
**默认策略（建议作为验收基线）**
- 失败保留 trace：`trace: retain-on-failure`
- 失败截图：`screenshot: only-on-failure`（如需更强证据可改为 on）
- 产物要求（至少）：
  - `trace.zip`（用于定位每一步的页面状态/网络/控制台）
  - 关键截图（登录后/关键操作后/完成态）

**运行命令（按项目实际填写其一）**
- `npx playwright test`
- `pytest --tracing retain-on-failure`（若使用 Playwright Python + Pytest）

**产物归档约定（必填）**
- 验收产物目录（建议）：`artifacts/acceptance/<run_id>/`
- 需要归档的文件列表（至少）：`trace.zip`、关键截图、console 日志（如有）、服务端日志（如有）

### 3.2 API / CLI（按项目实际填写）
- API：`curl`/Postman collection/集成测试脚本
- CLI：命令 + stdout/stderr + exit code
- 证据要求：至少包含命令、输出片段、日志/报告文件路径

## 4. 人工验收（兜底）
> 当环境限制无法跑自动化时必须提供；仍需产出截图/录屏/日志并落到 `acceptance_evidence.json`。

- 打开预览 / 访问入口：
- 逐步操作（写清楚点击/输入/跳转）：
- 每一步截图点：

## 5. 失败采集清单（强制）
当任一 DoD 失败，必须补齐以下采集项（能采多少采多少，并在 `failure_capture.artifacts` 中引用）：
- 失败截图（必填）
- Web 控制台错误（console log，强烈建议）
- 网络证据（失败请求、状态码、响应体片段；可用 HAR/日志替代）
- trace.zip（Web/UI 默认必填）
- 服务端日志（如有）
- 复现步骤（必须写清楚）

## 6. 复跑说明（必填）
- 如何启动：
- 如何执行验收（自动化/人工）：
- 如何查看证据（截图/trace/日志路径）：

