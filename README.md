# ☁️ 云舒系统（YunShu System）

> **证据驱动的 AI 研发工作流技能** — 为 [Trae IDE](https://trae.ai) 设计的执行型工作流技能

[![Version](https://img.shields.io/badge/version-3.2-blue.svg)](https://github.com/zhouxiansheng-good/yunshu-system-skill)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Trae IDE](https://img.shields.io/badge/Trae-IDE-orange.svg)](https://trae.ai)
[![中文文档](https://img.shields.io/badge/文档-中文-red.svg)](README.md)

---

## 🌟 它是什么？

云舒系统是一个**结构化的研发工作流技能**，把复杂研发任务按 **澄清 → 计划 → 执行 → 验收 → 交付** 的闭环推进。它的核心理念是：

- 🔍 **不信任，只证明** — 缺证据 = 未完成
- 🛡️ **高风险必停** — 危险操作前必须确认
- 🔄 **3 次失败必暂停** — 连续失败 ≥3 次，质疑架构
- 🔧 **改前必分析，修后必回归** — 修改前做影响分析，修复后跑回归测试
- 📚 **调试前查库，修后存库** — 调试前查Bug知识库，修复后存入知识库
- 🤖 **子智能体审查不许跳步** — 规范审查未通过不许做质量审查，审查发现问题必须复审

## 🎯 适用场景

| ✅ 适合 | ❌ 不适合 |
|---------|----------|
| 新项目启动 | 单步问答/概念解释 |
| 复杂功能开发 | 一次性微调 |
| 疑难 Bug 修复 | 任务无法在当前环境执行 |
| 结构性重构 | |
| 交付型任务（带验收标准） | |
| 多任务并行开发 | |

## 🏗️ 架构概览

```
yunshu-system-skill/
├── SKILL.md                    # 技能入口（能力 + 路由 + 纪律 + 安全防护触发表）
├── README.md                   # 本文件
├── LICENSE                     # MIT 许可证
├── components/                 # 按阶段拆分的可执行组件
│   ├── 01-init/SKILL.md        # 需求澄清与任务卡
│   ├── 02-plan/SKILL.md        # 计划与规范
│   ├── 02-plan/gates.md        # 计划阶段门禁清单（按需加载）
│   ├── 03-execute/SKILL.md     # 执行与验证
│   ├── 03-execute/gates.md     # 执行阶段门禁清单（按需加载）
│   ├── 03-execute/debug.md     # 调试会话模板
│   ├── 03-execute/verify.md    # 验证函数模板
│   ├── 04-accept/SKILL.md      # 验收
│   ├── 04-accept/gates.md      # 验收阶段门禁清单（按需加载）
│   ├── 05-deliver/SKILL.md     # 交付与归档
│   ├── 06-recover/SKILL.md     # 恢复与检查点
│   └── 07-subagent/SKILL.md    # 子智能体驱动开发
│   └── 07-subagent/dispatch.md # 子智能体分派模板
├── safeguards/                 # 按需加载的安全防护文件（渐进式披露）
│   ├── dependency.md           # 依赖验证（P-006~009）
│   ├── context.md              # 上下文管理（P-001~005）
│   ├── security.md             # 安全编码（P-011/013/026）
│   ├── code-quality.md         # 代码质量（P-010/012/014）
│   ├── refactor.md             # 跨文件重构（P-018~020）
│   ├── database.md             # 数据库操作（P-021/025）
│   ├── concurrency.md          # 并发安全（P-022）
│   ├── microservice.md         # 微服务架构（P-023）
│   ├── legacy.md               # 遗留代码（P-024）
│   ├── agent-safety.md         # Agent安全（P-043~049）
│   ├── understanding.md        # 业务背景挖掘（P-015）
│   ├── architecture.md         # 架构决策检查（P-016）
│   ├── dependency-analysis.md  # 系统级依赖分析（P-017）
│   ├── cognition.md            # 理解验证门禁（P-053）
│   ├── skill-preserve.md       # 技能保持（P-055/056）
│   ├── bias-calibration.md     # 偏差校准（P-054/061）
│   ├── sustainability.md       # 可持续性评估（P-067/069）
│   ├── vibe-coding.md          # Vibe Coding风险（P-050~052）
│   ├── maintenance.md          # 代码维护（P-062~066/068）
│   ├── chinese-dev.md          # 中文开发者适配（P-037~039）
│   ├── team.md                 # 回归防护（P-070/071）
│   ├── team-norms.md           # 团队AI规范（P-072~074）
│   └── talent-pipeline.md      # 人才梯队（P-075~077）
├── agents/                     # 子智能体（Trae IDE 智能体）
│   ├── yunshu-implementer/AGENT.md
│   ├── yunshu-spec-reviewer/AGENT.md
│   └── yunshu-quality-reviewer/AGENT.md
└── templates/                  # 可直接复用的模板
    ├── plan.md / spec.md / tasks.md
    ├── debug_session.md / bug_knowledge.md
    ├── acceptance_runbook.md / change_report.md
    ├── handoff.md / phase_memory_card.md
    ├── subagent_*.md
    └── gsd_*.md
```

## 🔄 工作流程

| 阶段 | 组件 | 核心能力 | 产物 |
|------|------|----------|------|
| 0. 澄清 | 01-init | 苏格拉底式对话、方案对比、任务卡生成 | 任务卡（目标 + DoD + 约束） |
| 1-2. 计划 | 02-plan | 代码库调研、逆向推导、WBS 分解、风险评估 | plan.md + spec.md + tasks.md |
| 3. 执行 | 03-execute | TDD 红-绿-重构、证据化验证、科学实验式验证、系统化调试、CI调试、变更安全机制 | 代码 + 验证证据 |
| 3+. 子智能体 | 07-subagent | 子智能体分派、两阶段审查、并行执行 | 子智能体执行 + 审查证据 |
| 4. 验收 | 04-accept | 两阶段审查、AI冗余检查、DoD 证据链、失败分类处理 | 验收剧本 + 验收证据 |
| 5. 交付 | 05-deliver | 变更报告、回滚方案、快速交付模式、合并冲突处理、交付方式选择 | 变更报告 + 回滚方案 |
| 恢复 | 06-recover | 交接文档创建/恢复、检查点管理 | 交接文档 + 检查点 |

## ✨ 核心能力详解

### 📋 01-init：需求澄清与任务卡

- **硬门禁**：用户批准设计前，不允许写任何代码
- **苏格拉底式提问**：一次只问一个问题，优先选择题，6 维度覆盖
- **2-3 方案对比**：每个方案必须包含代价/风险
- **分段展示设计**：架构→组件→错误处理→测试，逐步确认
- **任务卡自检**：占位符扫描、一致性检查、范围检查、歧义检查

### 📐 02-plan：计划与规范

- **先调研再规划**：代码库探索 → 外部知识检索 → 调研自检
- **逆向推导**：从目标状态出发，逆向追问前提条件
- **WBS 工作分解**：100% 覆盖原则，每个任务 ≤ 30 分钟
- **风险登记表**：概率 × 影响 × 应对策略 × 触发条件
- **回滚策略**：每个高风险操作都有可执行的回滚方案
- **决策记录**：把规划过程中的关键决策记录下来，避免执行时反复纠结

### ⚡ 03-execute：执行与验证

- **TDD 红-绿-重构**：没有失败测试 → 不写生产代码
- **证据化验证门禁函数**：识别→运行→读取→验证→声明，跳过任何步骤 = 撒谎
- **声明级科学验证**：可证伪声明→基线→处理→对比→三态判决（VERIFIED/NOT VERIFIED/INCONCLUSIVE）
- **10 种验证类型**：编译/单测/代码检查/运行/UI/编译错误汇总/端到端冒烟/CLI交互/UI交互/CI检查
- **验证工具箱**：CLI（tmux/PTY/运行时检查器）、UI（Playwright/CDP）
- **变更前影响分析**：定位变更点→识别调用方→识别依赖方→构建影响矩阵→确认安全
- **增量验证修复法**：每步修改 ≤ 1 个函数/1 个文件，每步修改后立即验证
- **深度防御四层模型**：入口验证→业务逻辑验证→环境守卫→调试工具
- **回归验证**：修复后必须跑回归测试，按修改类型确定回归范围
- **系统化调试四阶段**：根因调查 → 模式分析 → 假设与验证 → 实施修复
- **CI 失败快速入口**：gh pr checks 识别失败 → gh run view 获取日志 → 定位根因 → 最小化修复
- **Bug 知识库**：调试前查询知识库→修复后存入知识库→修复一个必须搜索同类 Bug
- **同类型 Bug 批量修复**：提取代码模式→全局搜索→逐个评估→批量修复→全量回归
- **自纠正循环**：验证失败→调试→影响分析→增量修复→深度防御→回归验证，3 次失败则质疑架构
- **上下文压缩**：遗忘历史决策时自动触发压缩
- **子智能体模式评估**：任务 ≥3 个且独立时建议切换到 07-subagent

### 🤖 07-subagent：子智能体驱动开发

- **角色分工**：控制器（统筹全局）+ 实现者（云舒微流程编码）+ 规范审查者（云舒微流程验证规范）+ 质量审查者（云舒微流程验证质量）
- **两阶段审查**：规范审查（不多不少）→ 质量审查（干净可维护），顺序不可颠倒
- **上下文隔离**：子智能体不继承主会话上下文，由控制器精确构造所需信息
- **云舒微流程**：每个子智能体内置澄清→计划→执行→自验收四阶段，有门禁和红旗
- **并行执行**：独立任务可同时分派多个实现者，审查串行进行
- **状态处理**：DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED 四种状态及对应处理
- **审查铁律**：规范审查未通过不许做质量审查，审查发现问题必须复审

### ✅ 04-accept：验收

- **两阶段审查**：规范符合性（读代码不信任报告）→ 代码质量
- **AI 冗余检查**：多余注释、异常防御性检查、`any` 类型转换、深度嵌套、风格不一致
- **DoD→证据映射**：5 种证据类型 + 4 项质量标准
- **严重度分级**：严重（阻塞交付）/ 重要（修复后交付）/ 次要（后续处理）
- **验收失败处理**：5 类失败 + 失败采集 + 修复后从 Step1 重新验收

### 📦 05-deliver：交付与归档

- **最终验证**：全量测试 + 代码检查 + DoD 核查
- **变更报告**：概要/变更清单/新增依赖/影响面分析/回滚方案/复跑指令/已知遗留
- **回滚方案**：6 种变更类型的回滚方式
- **用户选择交付方式**：本地合并 / 推送 PR / 保留分支 / 放弃工作
- **快速交付模式**：简单任务走精简流程（收集上下文→测试→审查→提交→推送→PR）
- **合并冲突处理**：最小化正确性优先解决→重新生成锁文件→编译/lint/测试验证
- **分支创建与聚焦提交**：从最新main创建分支→聚焦提交→包含验证说明

### 🔄 06-recover：恢复与检查点

- **Part A 创建交接**：5 种触发条件、机械状态收集、主题标识、结构化交接文档
- **Part B 恢复执行**：定位交接文档、按优先级读取、验证现场一致性、确认恢复点
- **交接文档管理**：归档（完成后移入 _archive/）、清理（30 天以上自动清理）

> 详细方法论见各组件 SKILL.md

## 🆕 v3.2 新特性

### 渐进式披露架构

云舒系统采用**渐进式披露**设计，只在遇到对应场景时按需加载详细内容，不占主上下文：

| 层级 | 内容 | 加载时机 |
|------|------|----------|
| L1（主文件） | SKILL.md 只保留能力路由 + 触发表 | 技能激活时 |
| L2（组件） | 各组件 SKILL.md 保留核心流程 + 门禁入口 | 进入对应阶段时 |
| L3（子文件） | gates.md / verify.md / debug.md / safeguards/*.md | 检测到触发条件时 |

### 23个安全防护文件

覆盖 55 个 AI 编程问题（致命/严重/中等），按场景按需加载：

- **依赖安全**：dependency.md（P-006~009）
- **上下文管理**：context.md（P-001~005）
- **代码质量**：code-quality.md（P-010/012/014）
- **安全编码**：security.md（P-011/013/026）
- **重构防护**：refactor.md（P-018~020）
- **专项场景**：database.md / concurrency.md / microservice.md / legacy.md / chinese-dev.md
- **理解深度**：understanding.md / architecture.md / dependency-analysis.md（P-015~017）
- **认知防护**：cognition.md / skill-preserve.md / bias-calibration.md（P-053~056/061）
- **可持续性**：sustainability.md（P-067/069）
- **Vibe Coding**：vibe-coding.md（P-050~052）
- **代码维护**：maintenance.md（P-062~066/068）
- **团队协作**：team.md / team-norms.md / talent-pipeline.md（P-070~077）

### 组件门禁抽离

03-execute / 02-plan / 04-accept 的门禁内容抽离为独立的 `gates.md`，SKILL.md 只保留触发入口表：

```
03-execute/SKILL.md  →  核心执行流程
03-execute/gates.md  →  8个门禁的完整逻辑（按需加载）
```

### 功能聚焦的 Safeguard 拆分

原 understanding.md / cognition.md / team.md 各拆分为 3 个独立文件，每个聚焦单一问题域：

| 原文件 | 拆分后 | 聚焦 |
|--------|--------|------|
| understanding.md (152行) | understanding.md (56行) | 业务背景挖掘 |
| | architecture.md (57行) | 架构决策检查 |
| | dependency-analysis.md (51行) | 系统依赖分析 |
| cognition.md (155行) | cognition.md (55行) | 理解验证 |
| | skill-preserve.md (58行) | 技能保持 |
| | bias-calibration.md (57行) | 偏差校准 |
| team.md (131行) | team.md (60行) | 回归防护 |
| | team-norms.md (49行) | AI使用规范 |
| | talent-pipeline.md (46行) | 人才梯队 |

## 🚀 安装

将整个 `yunshu-system-skill/` 文件夹放到项目目录的：

```
./.trae/skills/yunshu-system-skill/
```

## 💡 使用方式

在 Trae IDE 对话中输入：

```
使用云舒系统，帮我 [你的任务描述]
```

或使用触发词：

- `使用云舒系统`
- `用云舒系统`
- `启动云舒`

### 斜杠命令

| 命令 | 用途 |
|------|------|
| `/plan` | 启动计划模式 |
| `/spec` | 启动规格模式 |
| `/compact` | 上下文压缩 |
| `/resume` | 恢复中断执行 |
| `/debug` | 启动调试会话 |
| `/subagent` | 启动子智能体驱动开发 |
| `/parallel` | 并行分派多个独立任务 |

## 🛡️ 硬规则

1. **不信任，只证明**：缺证据 = 未完成
2. **高风险必停**：危险操作前必须确认
3. **3 次失败必暂停**：连续失败 ≥3 次，质疑架构
4. **改前必分析，修后必回归**：修改前做影响分析，修复后跑回归测试
5. **调试前查库，修后存库**：调试前查Bug知识库，修复后存入知识库
6. **子智能体审查不许跳步**：规范审查未通过不许做质量审查，审查发现问题必须复审

## 🚫 反模式

- 跳过澄清直接执行
- 验收缺证据就宣称完成
- 没有根因调查就提修复方案
- 修改代码前不做影响分析
- 修复后不跑回归测试
- 子智能体审查跳步或跳过复审

## 📖 GSD 可选同步

> GSD（Getting Stuff Done）是可选的项目状态管理约定。如果项目有 `.plans/` 目录，各阶段会自动同步状态；没有则跳过。

| 触发时机 | 同步内容 |
|----------|----------|
| 01-init 结束 | 创建 `.plans/` 目录（使用 `templates/gsd_*.md`） |
| 02-plan 结束 | 更新 `.plans/STATE.md` + 写入 `PLAN-*.md` |
| 03-execute 每任务完成 | 更新 `.plans/STATE.md` 进度 |
| 05-deliver 结束 | 归档里程碑，更新 STATE.md |

## 🙏 致谢

本项目在开发过程中参考了以下 GitHub 开源项目的优秀实践：

- [**obra/superpowers**](https://github.com/obra/superpowers) — 提供了系统化调试、深度防御、证据化验证、TDD、spec-reviewer、code-quality-reviewer、handoff、**子智能体驱动开发（subagent-driven-development）**、**并行代理分发（dispatching-parallel-agents）** 等技能的设计灵感
- [**charlesbrandt/agent-loop**](https://github.com/charlesbrandt/agent-loop) — 提供了自纠正循环机制的设计灵感
- [**Lunar0769/MAESTRO**](https://github.com/Lunar0769/MAESTRO) — 提供了双模型验证思想的设计灵感
- [**optave/ops-codegraph-tool**](https://github.com/optave/ops-codegraph-tool) — 提供了变更影响分析方法论的设计灵感
- [**cursor/plugins**](https://github.com/cursor/plugins) — 提供了科学实验式验证（verify-this）、AI冗余清理（deslop）、快速审查发布（review-and-ship）、合并冲突处理（fix-merge-conflicts）、分支与PR流程（new-branch-and-pr）、编译错误检查（check-compiler-errors）、冒烟测试（run-smoke-tests）、CI修复（fix-ci）、CLI验证工具（control-cli）、UI验证工具（control-ui）等技能的设计灵感

云舒系统在上述项目的基础上，进行了以下创新：

- 🔄 **全流程闭环**：从澄清到交付的完整工作流，而非独立技能的简单组合
- 📋 **证据驱动**：每一步都要求可引用、可复跑、可审计的证据
- 🛡️ **硬门禁机制**：关键节点设置不可跳过的门禁（澄清门禁、验收门禁）
- 🔧 **变更安全机制**：影响分析→增量修复→深度防御→回归验证，防止"改一个冒两个"
- 🔬 **科学实验式验证**：可证伪声明→基线→处理→对比→三态判决，验证不是回顾，用可重复证据证明或反驳
- 🧹 **AI冗余检查**：自动识别AI生成代码中的冗余模式（多余注释、异常防御、any转换、深度嵌套）
- 🚀 **快速交付模式**：简单任务走精简审查→提交→推送→PR流程，复杂任务走完整验收→交付流程
- 🔀 **合并冲突处理**：最小化正确性优先的冲突解决方法论，解决后编译/lint/测试验证
- 🤖 **子智能体驱动开发**：将任务分派给独立子智能体，两阶段审查保质量，支持并行执行
- 🔄 **恢复能力**：完整的检查点和交接文档机制，支持跨会话恢复
- 🌐 **中文化**：全中文文档和术语，降低中文用户的使用门槛

## 📄 许可证

[MIT License](LICENSE)

## 📬 联系方式

- 📧 邮箱：2730783971@qq.com

---

<div align="center">

**☁️ 云舒系统 — 让 AI 研发有据可依、有迹可循**

</div>
