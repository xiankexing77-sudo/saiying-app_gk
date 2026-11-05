# BGX111 项目开发规范

本文件描述 **当前仓库实际遵守的规范**，并标明与产品文档目标架构的差别。它不把尚未运行的 PostgreSQL、Celery 或视觉模型写成已经接入。

## 1. 定位

Photo Jury Intelligence 是 SWPA 2025 与 2026 的研究 POC。运行时是一个 Next.js 应用，数据来自已核对种子和夹具。官方事实、文本证据推断和像素测量必须分开。

不在本 POC 中做的事：实时抓取官网、保存获奖原图、调用 `VISION_MODEL` / `TEXT_MODEL`、把 Shortlist 写入核心数据集、把 2027 当作完整获奖集、推断匿名评审中的个人投票。

## 2. 技术栈

| 层级 | 当前实现 | 目标（未运行） |
| --- | --- | --- |
| 界面与 API | Next.js App Router，`npm run dev` 端口 41731 | 同左，可再拆出独立 API |
| 数据 | `src/lib/data/seed.ts`，导出文件 `database/seed/swpa.json` | PostgreSQL，结构见 `database/schema.sql` |
| 任务 | 进程内 `src/lib/tasks.ts` + `agents/settle-task.ts` | Redis + Celery，长任务仍不得堵在 HTTP 响应里 |
| 研究编排 | `agents/graph.ts` 描述阶段并在进程内结算 | LangGraph |
| 视觉 | 不读获奖像素。`agents/text-evidence.ts` 只引用说明原句。用户照片只在浏览器里测量 | 可配置视觉模型，且仅在授权图片上运行 |
| 评委风格 | `agents/style-tags.ts`，满 3 组本人作品才生成标签 | 同规则，不改为凭简介猜测 |

环境变量见 `.env.example`。模型名留空时不得编造像素结论。

## 3. 目录职责

- `src/app`：页面与 `/api/v1` Route Handler。`params` 是 Promise，先 `await`。
- `src/lib/data`：类型、来源、种子。应用读种子，不在请求里改写种子文件。
- `src/lib/catalog.ts`：只读查询、同赛制对照、完整性检查。
- `collectors/`：官方入口允许列表、去重、多来源交叉验证、评委作品夹具。不发 HTTP。
- `agents/`：风格标签、说明词表、阶段图、任务结算。State 不保存图片二进制。
- `database/schema.sql`：目标表。含 `analysis_evidence`。不是本环境的启动依赖。
- `tests/`：`npm test` 使用 `node:test`。
- `.cursor/skills/bgx-development-workflow/SKILL.md`：项目级 BGX 技能。`.gitignore` 不忽略 `.cursor/skills/`。

## 4. 数据与诚实性

- 赛事事实必须带 provenance：URL、页面标题、记录时间、解析版本、抽取版本。未保存原文时 `contentHash` 为空，并在界面写明。
- 官方赛制原文（Professional / Open）与规范化名称（Series / Single Image）同时保留。不同赛制不得直接比较。
- 单张分析与系列分析使用不同 schema。系列的叙事连贯、节奏、完整度没有对应原句时保持空。
- 非空分析字段必须能在来源说明中找到 `evidence.quote`。词表未命中则 `insufficient_text`，置信度为空。
- 文本证据模型名是 `pji-text-evidence`，置信度上限 0.55。它不是视觉模型。
- 评委风格模型名是 `pji-style-tags`。样本组少于 3 时偏好字段和标签都为空。
- 评委研究图可以连接届次、本人作品、风格标签和公开引语。不得连接「某评委选择了某件获奖作品」。
- 图片资源 `rightsStatus` 为 `rights_blocked`，`hostedBinary` 为 false，`officialImageUrl` 为空。
- 用户上传不接收图像二进制。`POST /api/v1/uploads/analyze` 若带 `image`、`dataUrl`、`binary` 或 `file` 字段，返回 400。
- 语义维度只对照用户写下的说明。浏览器内的亮度、饱和度和色相是测量，不是主体识别，也不是赛事匹配。

## 5. API

- 长任务：`POST /api/v1/competitions/swpa/research` 返回 202 和任务 ID。进程内随后结算。查询 `GET /api/v1/tasks/{id}`，重试 `POST /api/v1/tasks/{id}/retry`。
- 只有失败或阻塞的任务可以重试。像素分析任务重试后仍然阻塞。
- Shortlist 范围会使采集阶段阻塞，不抓取、不补写。
- 2027 或 2025/2026 以外的年份返回 400。
- `POST /api/v1/competitions` 不新建未核验赛事。未知 id 返回 400。SWPA 已存在时 `created: false`。
- 作品与系列的分析 POST 返回已生成的说明证据，`pixelsRead` 为 false。

## 6. 错误与安全

- 采集器只接受允许列表上的 https URL。拒绝其他主机、内网地址和带用户信息的 URL。
- 冲突字段保留各方原文，不用一条「更干净」的值盖掉。
- 缺失字段显示「未采集」或「未分析」，不用模型补写教育背景、张数或标题。
- 日志和任务 `errorLog` 写原因，不写密钥。`.env*` 除 `.env.example` 外不提交。

## 7. 测试与质量门禁

提交前运行：

```bash
npm test
npm run lint
npx tsc --noEmit
```

构建入口是 `npm run build`。开发入口是 `npm run dev`。种子导出是 `npm run export-seed`。改了种子生成逻辑后要重新导出，避免 `database/seed/swpa.json` 漂移。

`qualityReport()` 必须保持通过。其中包含：来源 URL、不托管原图、评委样本门槛、分析 schema 分离、说明引文必须出现在原文中。

## 8. Git

功能分支使用 `cursor/<描述>-446a`。提交说明写清行为，不写「更新若干文件」。BGX000 只做本地提交。未经明确要求不执行 BGX888，不强制推送，不改写历史。

## 9. 部署

本 POC 不包含生产部署、Docker 启动或数据库迁移执行。`database/schema.sql` 供以后的 PostgreSQL 使用。回滚方式是回到上一个 Git 修订，因为没有在线迁移。

## 10. AI 协作

修改本仓库时先读本规范和 `README.md`。项目级技能路径：

`.cursor/skills/bgx-development-workflow/SKILL.md`

BGX222、BGX333 不改业务代码。BGX666 只实现已选定的计划项。

## 11. 待确认

- 视觉模型供应商仍由环境变量决定，名称未选定。
- 是否在授权之后保存缩略图，尚未决定。当前决定是不保存。
- 独立 FastAPI 进程是否仍要拆出。当前决定是 POC 继续用 Next.js Route Handler。
