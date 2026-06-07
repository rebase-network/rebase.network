# 实施路线图

> 归档说明：这是一份阶段性路线图，仅供历史参考；当前活跃文档应优先描述事实、流程和约束，而不是计划。

## 目的

这个文件用于跟踪仓库当前的实施路线图。

由于代码库中已经存在 V1 基础设施，它替代了最初按阶段构建的计划。

## 当前基线

仓库已经包含：

- `apps/web`：对外的 Astro 网站
- `apps/admin`：内部 Vue 工作台
- `apps/api`：公共与 admin API，以及 auth / bootstrap 流程
- `packages/db`、`packages/shared` 和 `packages/types`：共享基础设施
- 本地初始化脚本、smoke tests 与生产 rollout 辅助脚本

这意味着当前的主任务不再是“从零开始搭建整套技术栈”，而是持续加固、维护并演进现有实现，同时避免文档与现实脱节。

## 当前工作流

### 1. 公共网站稳定性与内容质量

重点：

- 保持归档页、列表页和详情页在桌面端与移动端上稳定
- 保持路由、RSS、sitemap 与健康检查行为稳定
- 将长期有效的 UX 与视觉规则收敛到 `apps/web/design_principles.md` 与 `apps/web/DESIGN.md`
- 防止围绕误导性 CTA、失效搜索或分页、metadata 重复、占位内容质量的回归

完成定义：

- 受影响的公共 routes 仍通过 smoke 覆盖
- 被修改的页面类型已在桌面端和移动端浏览器中检查
- 当默认行为变化时，source-of-truth 文档已同步更新

### 2. Admin 工作流加固

重点：

- 改进 site settings、articles、jobs、events、contributors、GeekDaily、assets、staff 和 audit 视图的校验、发布 / 归档流与编辑器易用性
- 让角色与权限行为始终与 `docs/architecture/admin-architecture.md` 和 `docs/architecture/admin-information-architecture.md` 对齐
- 减少运营人员对手工清理或直接数据库干预的依赖

完成定义：

- 目标编辑工作流可以从 admin UI 端到端完成
- 空状态、校验失败和权限失败都明确可见
- admin 行为变化已反映在相关文档中

### 3. 后端与数据可靠性

重点：

- 保持公共与 admin API 契约与 `docs/product/content-model.md` 和 `docs/architecture/admin-data-model.md` 一致
- 保持 migrations、seed 数据、GeekDaily 导入行为、运行时内容新鲜度与资源处理的可重复性
- 在 API 和数据库变更周围维持健康与就绪可见性

完成定义：

- 在干净的本地环境中，migrations 和 seeds 仍可重复执行
- 内容更新会沿着预期运行时路径出现
- 后端变更不会悄悄破坏公共 routes、feeds 或 admin flows

### 4. 发布与运维加固

重点：

- 保持 `ops/manage.sh`、`infra/production/*`、`docs/operations/deployment.md`、`docs/operations/production-config.md` 和 `docs/operations/launch-checklist.md` 同步
- 优先通过 `dev` -> `main` 的 Pull Request 流程做小而可审查的发布
- 在会影响生产的改动前，验证 dry-run 部署路径

完成定义：

- 本地与生产流程和文档命令一致
- 关键发布检查始终保持最新
- rollback、backup 与 readiness 预期对运营人员始终清晰

### 5. 文档治理

重点：

- 保持 `docs/` 根目录只包含活跃的基线文档和运维 source-of-truth 文件
- 将过期流程说明、重设计计划和一次性评审产物归档，而不是混入在线文档集
- 当实现变化时，及时移除陈旧的规划语言、命令和路径

完成定义：

- 活跃文档反映当前仓库结构和脚本
- 低价值历史材料被移除或移出在线文档路径
- 未来重设计工作会更新持久设计文档，而不是另起一套影子 source of truth

## 近期优先事项

- 扩大对 admin 登录和关键发布流的验证覆盖；它们目前的自动化覆盖低于公共网站
- 保持部署和上线文档与实际发布工作流及辅助脚本一致
- 在不重新打开广义 V1 范围的前提下，继续收紧公共内容质量和内容状态处理

## 工作规则

- 除非需求被明确重新定义，否则保持 V1 范围收敛
- 每完成一批连贯工作就提交一次 commit
- 当实现变化成为新的默认标准时，更新对应的 source-of-truth 文档
- 与其把过期流程材料留在在线文档根目录，不如优先归档它们

## 更新规则

当仓库优先级发生实质变化时，修订这个文件。

不要把它当作一次性功能计划或重设计草稿板。
