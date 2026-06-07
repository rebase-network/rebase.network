# 仓库文档

这个目录用于存放仓库级文档。

并不是仓库里的所有 Markdown 文件都属于这里。有些文档会有意放在它们所约束的代码或工作流旁边：

- `README.md`、`DESIGN.md` 和 `AGENTS.md` 保留在仓库根目录，因为它们是顶层入口文档
- `apps/web/*` 与 `apps/admin/*` 的设计文档保留在各自界面旁边，因为它们直接规定这些界面的规范

## 目录布局

### `docs/product/`

产品范围、内容规则、验收标准与路线图：

- `v1-scope.md`
- `content-model.md`
- `implementation-plan.md`
- `acceptance-criteria.md`

### `docs/architecture/`

系统、admin 与数据模型设计：

- `architecture.md`
- `admin-architecture.md`
- `admin-information-architecture.md`
- `admin-data-model.md`

### `docs/operations/`

开发、QA、部署与发布运维：

- `local-development.md`
- `quality-assurance.md`
- `deployment.md`
- `production-config.md`
- `launch-checklist.md`

## 更新规则

仓库级的产品、架构与运维文档应放在 `docs/` 下。

只有当文档明确属于某个应用或仓库入口点时，才应放在 `docs/` 之外。
