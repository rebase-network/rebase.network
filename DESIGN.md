# DESIGN.md

这个仓库采用拆分后的设计文档结构。

根目录的 `DESIGN.md` 是索引，不是完整的设计系统。

在构建或评审 UI 时，请使用下面按应用拆分的文件。

## 结构

### 公共网站

- `apps/web/design_principles.md`
  - 公共站点的设计意图
  - 社区媒体语气
  - 内容层级
  - 交互与文案原则
- `apps/web/DESIGN.md`
  - 公共网站的硬性视觉规范
  - 颜色、排版、间距、组件、响应式规则与 agent prompts

### 管理工作台

- `apps/admin/design_principles.md`
  - 管理后台 UX 意图
  - 运营人员工作流优先级
  - 密度、安全性与信息层级规则
- `apps/admin/DESIGN.md`
  - 管理工作台的硬性视觉规范
  - 颜色、排版、间距、组件、响应式规则与 agent prompts

## 如何使用这些文件

- 先阅读对应的 `design_principles.md`，理解产品目标和交互意图
- 然后使用对应应用的 `DESIGN.md`，做出精确的视觉和组件决策
- 如果新的设计方向成为默认标准，需要同时更新该应用的 principles 文件和 hard-spec 文件

## 更新规则

- 不要把公共网站规则混入 admin 文件，也不要把 admin 规则混入公共网站文件
- 优先更新应用本地文档，而不是继续扩展这个索引
- 如果某条规则只适用于一个界面，就把它留在该界面的文档里
- 如果组件实现发生变化，而且该变化成为新的默认标准，请更新对应应用的 `DESIGN.md`

## 相关文件

- `README.md`：项目级文档索引
- `AGENTS.md`：仓库工作流规则
