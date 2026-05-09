---
name: 05-deliver
phase: 5
description: "交付与归档。验证完整性→生成变更报告→用户选择交付方式→清理。"
---

# 05-deliver：交付与归档

## 职责

让用户在"离开你之后"也能复跑、回滚、继续迭代。确保交付物完整、可追溯、可回滚。

---

## Step 1：最终验证

**目标**：交付前做最后一次全量验证，确保没有遗漏。

### 1.1 运行全量测试

```bash
npm test / cargo test / pytest / go test ./...
```

**测试失败 → 回到 `components/03-execute/SKILL.md` 修复，不许交付**

### 1.2 运行代码检查

```bash
npm run lint / ruff check / cargo clippy / go vet ./...
```

**有错误 → 修复后再交付**

### 1.3 对照任务卡最终核查

逐条读取任务卡中的 DoD，确认每条都有验收证据：

```text
DoD 1: [描述] → 证据: [acceptance_evidence.json 中的引用] ✅
DoD 2: [描述] → 证据: [acceptance_evidence.json 中的引用] ✅
DoD 3: [描述] → 证据: [acceptance_evidence.json 中的引用] ✅
```

**任一 DoD 无证据 → 回到 `components/04-accept/SKILL.md` 补充验收**

---

## Step 2：生成变更报告

**目标**：让用户（和未来的自己）清楚知道做了什么、为什么、影响面、如何回滚。

使用 `templates/change_report.md` 模板生成变更报告。

### 2.1 变更报告结构

```markdown
# 变更报告

## 概要
- 目标: [一句话目标]
- 状态: [完成/部分完成]
- 变更文件数: [N 个文件]

## 变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| src/auth/oauth.py | 新增 | OAuth 登录实现 |
| src/auth/routes.py | 修改 | 添加 OAuth 回调路由 |
| db/migrations/001_oauth.sql | 新增 | 用户表添加 OAuth 字段 |

## 新增依赖
- [依赖名] [版本] — [用途] — [✅已验证/⚠️待验证/❌验证失败]

## 影响面分析
- 受影响模块: [列出模块]
- 受影响接口: [列出 API 变更]
- 数据库变更: [列出 schema 变更]
- 配置变更: [列出新增/修改的配置项]

## 回滚方案
1. 回滚代码: `git revert <commit-range>`
2. 回滚数据库: `db/migrations/001_oauth_rollback.sql`
3. 回滚依赖: 移除 [依赖名] 并运行 `npm install`

## 复跑指令
1. 安装依赖: `npm install`
2. 运行迁移: `npm run db:migrate`
3. 运行测试: `npm test`
4. 启动服务: `npm start`
5. 验证: 访问 http://localhost:3000/auth/oauth

## 已知遗留
- [已知但未修复的问题]

## 文档同步状态
- [已同步更新的文档列表]
- [未同步的文档+原因]

## 架构决策记录
- ADR-XXX: [决策标题] — [选择]因为[原因]

## 隐性知识捕获
- @business-rule: [业务规则]
- @known-limitation: [已知限制]
- @security-assumption: [安全假设]
```

### 2.2 回滚方案要求

每个变更必须有对应的回滚方式：

| 变更类型 | 回滚方式 |
|----------|----------|
| 代码变更 | `git revert <commit-range>` |
| 数据库迁移 | 回滚迁移脚本（必须提前准备） |
| 依赖新增 | 从 package.json/Cargo.toml 移除并重新安装 |
| 配置变更 | 恢复原始配置值 |
| 文件新增 | `git rm <file>` |
| 文件删除 | `git checkout <commit> -- <file>` |

**没有回滚方案的变更不许交付**

---

## Step 2.5：黑箱消除门禁

> 解决P-067"有效直到无效"：交付的代码不能是黑箱，任何开发者都能理解和维护。

**触发条件**：变更报告生成后自动触发

**执行动作**：

1. 读取 `safeguards/sustainability.md`，执行黑箱消除检查（如04-accept已加载过可持续性评估部分，则只需执行黑箱消除部分）
2. 按黑箱诊断清单逐项检查（决策记录/错误地图/数据流向/修改指南/依赖说明/测试覆盖）
3. 为每个核心模块生成黑箱消除产物：
   - 决策记录（ADR模板）
   - 错误地图（失败点+处理方式+恢复策略）
   - 数据流向图（输入→处理→输出+异常分支）
   - 修改指南（常见修改场景的操作指引）
4. 评估黑箱评分：
   - 🟢 透明（5个产物齐全）→ 可以交付
   - 🟡 半透明（3-4个产物）→ 补充缺失产物后交付
   - 🔴 黑箱（<3个产物）→ 不许交付，必须补充

**关键原则**：黑箱评分🔴 = 不许交付，代码必须是可理解的

---

## Step 3：用户选择交付方式

**目标**：让用户决定如何处理变更，而不是自动合并或推送。

### 快速交付模式

任务简单（单文件变更、无数据库迁移、低风险）时，可走精简流程：

```
1. 收集上下文：与基础分支的差异、变更的文件、用户意图
2. 运行针对性测试（不存在则记录差距）
3. 审查正确性、回归、安全性和意图匹配
4. 修复关键问题并重新运行受影响测试
5. 聚焦提交 → 推送 → 创建或更新 PR
```

**审查优先级**：正确性 > 安全性 > 回归 > 风格。

调用 AskUserQuestion：
- 问题："实现已完成。你想怎么处理？"
- 选项："本地合并到主分支" / "推送并创建 Pull Request" / "保留当前分支（稍后自己处理）" / "放弃这次工作"

### 选项 1：本地合并

```bash
git checkout <base-branch>
git pull
git merge <feature-branch>
# 合并后验证测试
npm test
# 测试通过后删除特性分支
git branch -d <feature-branch>
```

**合并冲突处理**（`git merge` 遇到冲突时）：

1. 从 `git status` 和冲突标记检测所有冲突文件
2. 用最小化、正确性优先的编辑解决每个冲突
3. 安全时优先保留双方；否则选择能编译且保持行为稳定的变体
4. 用包管理器工具重新生成锁文件，不手工编辑
5. 运行编译、lint 和相关测试
6. 暂存已解决的文件并总结关键决策

**冲突解决原则**：
- 不在任何文件中留下冲突标记
- 解决冲突时避免广泛重构
- 冲突解决期间不推送或打标签

### 选项 2：推送并创建 PR

**前置步骤**（如需新建分支）：

1. 确保工作区干净或已明确处理
2. 从最新的 main 创建描述性分支：`git checkout -b <descriptive-name> origin/main`
3. 完成实现和测试
4. 聚焦提交：每个提交只包含一个变更集

**推送与创建 PR**：

```bash
git push -u origin <feature-branch>
# 创建 PR
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
- [2-3 条变更摘要]

## Test Plan
- [ ] [验证步骤]
EOF
)"
```

**提交原则**：
- 保持分支范围聚焦于一个变更集
- 请求审查前包含验证说明

### 选项 3：保留分支

报告：`保留分支 <name>。工作区保留在 <path>。`

不清理工作区。

### 选项 4：放弃工作

**必须确认**：
```text
这将永久删除：
- 分支 <name>
- 所有提交: <commit-list>
- 工作区 <path>

输入 'discard' 确认。
```

等待用户输入确切确认后执行删除。

---

## Step 4：GSD 状态同步与归档

### 4.1 同步 GSD 状态

更新 `.plans/STATE.md`：
- 当前阶段标记为"已完成"
- 更新完成时间和摘要

更新 `.plans/active/PLAN-*.md`：
- 所有任务标记为 completed
- 添加完成摘要

### 4.2 归档里程碑（可选）

如果项目有 `.plans/` 目录，手动归档：

1. 将 `.plans/active/PLAN-*.md` 移动到 `.plans/completed/`
2. 更新 `.plans/STATE.md`：标记里程碑为已完成
3. 使用 `templates/gsd_roadmap.md` 更新路线图

### 4.3 清理临时文件

| 文件/目录 | 处理方式 |
|-----------|----------|
| `.yunshu/verify-log.tsv` | 保留（审计日志） |
| `.acceptance/` | 保留（验收证据） |
| `acceptance_runbook.md` | 保留（验收剧本） |
| `acceptance_evidence.json` | 保留（结构化证据） |
| `phase_memory.json` | 保留（恢复用） |
| `checkpoint.json` | 保留（恢复用） |
| 临时测试文件 | 删除 |

---

## Step 5：交付确认

向用户报告最终状态：

```text
交付完成 ✅

变更: N 个文件（新增 M / 修改 K / 删除 L）
测试: 全部通过
代码检查: 无错误
DoD: N/N 条完成
回滚方案: 已准备
交付方式: [用户选择的方式]

变更报告: [路径]
验收证据: [路径]
```

---

## 路由

- 交付完成 → 任务结束
- 发现新需求 → 回到 `components/01-init/SKILL.md` 开启新轮次
- 最终验证失败 → 回到 `components/03-execute/SKILL.md` 修复
- DoD 证据缺失 → 回到 `components/04-accept/SKILL.md` 补充
