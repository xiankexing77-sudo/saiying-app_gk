# BGX333 开发计划

审核对象：PRD 中尚未在本 POC 运行的部分，以及 BGX222 列出的问题。本阶段只定计划，不改业务代码。

## 已完成、不再列入实施

这些能力已经在当前工作区里，有页面和测试，不重复开发：

| 编号 | 能力 | 证据 |
| --- | --- | --- |
| D1 | 说明原句上的单张 / 系列分析，schema 分离，未读像素 | `agents/text-evidence.ts`，`tests/honesty.test.ts` |
| D2 | 同赛制报告列出原句，像素趋势保持未生成 | `compareEditions`，`/reports/single_image` |
| D3 | 用户照片本地测量；语义只对照用户说明；拒绝图像字段 | `/analyze`，`POST /api/v1/uploads/analyze` |
| D4 | 研究任务进程内跑阶段；像素与 Shortlist 阻塞；可重试 | `agents/settle-task.ts`，`/tasks` |
| D5 | 评委研究关系，样本不足不写偏好，无投票边 | `src/lib/jury-graph.ts` |
| D6 | 赛事、届次、奖项来源在页面上可见 | provenance 组件 |
| D7 | 项目级 BGX 技能 | `.cursor/skills/bgx-development-workflow/SKILL.md` |

## 选定由 BGX666 执行的项

只选定验收，不选定新的业务功能。

| 编号 | 任务 | 交付 | 依赖 | 验收 |
| --- | --- | --- | --- | --- |
| A1 | 对照 D1–D7 重新跑测试、lint 和类型检查 | `docs/bgx/BGX666-acceptance.md` | 现有代码 | `npm test`、`npm run lint`、`npx tsc --noEmit` 通过，验收表逐项写结果 |

不改 Collector、分析词表、任务状态机或页面结构。页脚已在进入 BGX 阶段前改成「不读取原图、没写到的留空」，避免再写成「视觉分析是模板」。BGX666 不再改这句话，除非验收发现它又和代码矛盾。

## 明确不选入本轮

| 编号 | 内容 | 原因 |
| --- | --- | --- |
| N1 | PostgreSQL、Alembic、pgvector | 本环境不跑数据库。`schema.sql` 保持为目标结构 |
| N2 | Redis、Celery、LangGraph 运行时 | 进程内结算已经表达阶段。不安装无法在这里验证的队列 |
| N3 | 视觉模型与获奖像素分析 | 图片 `rights_blocked`，且没有模型配置。不能用说明改写成看图结果 |
| N4 | 实时抓取 SWPA | 违反当前采集夹具边界 |
| N5 | Shortlist、2027 完整获奖集 | 产品范围明确排除 |
| N6 | 任务停止轮询、研究关系折叠 | BGX222 的 P3 与 P2-4。可用，但不是这轮选定项 |

## 顺序

A1 没有前置代码改动。BGX999 在 A1 之后执行 `npm run build`。若构建失败，只修构建错误，不借机做 N1–N6。

## 风险与回滚

A1 只新增验收记录。若测试失败，先停止 BGX999，在 BGX666 里修失败项并重新验收。回滚是不提交该验收记录；业务代码保持进入本阶段前的状态。
