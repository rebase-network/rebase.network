# DESIGN.md

这个仓库采用按应用拆分的设计文档结构。

根目录的 `DESIGN.md` 只是索引，不是完整设计系统。

使用规则很简单：

- `design_principles.md` 负责“为什么这样设计”
- `DESIGN.md` 负责“具体应该怎么做”

## 结构

### 公共网站

- `apps/web/design_principles.md`
  - 公共站点的产品意图
  - 区块分工
  - 交互与文案原则
- `apps/web/DESIGN.md`
  - 公共网站的硬性视觉规范
  - 颜色、排版、间距、组件、响应式规则与提示词

### 管理工作台

- `apps/admin/design_principles.md`
  - 管理后台产品意图
  - 任务流优先级
  - 交互与文案原则
- `apps/admin/DESIGN.md`
  - 管理工作台的硬性视觉规范
  - 颜色、排版、间距、组件、响应式规则与提示词

## 如何使用这些文件

- 先阅读对应的 `design_principles.md`，理解页面目标与交互取向
- 再使用对应应用的 `DESIGN.md`，做出具体视觉和组件决策
- 如果一项变化同时改变了“设计意图”和“默认实现”，需要同时更新两份文件

## 更新规则

- 不要把公共网站规则混入 admin 文件，也不要把 admin 规则混入公共网站文件
- 不要把视觉细节写进 `design_principles.md`
- 不要把产品意图和任务规则重复写进 `DESIGN.md`
- 优先更新应用本地文档，而不是继续扩展这个索引

## 相关文件

- `README.md`：项目级文档索引
- `AGENTS.md`：仓库工作流规则
