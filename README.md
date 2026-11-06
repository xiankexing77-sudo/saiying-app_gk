# Photo Jury Intelligence

摄影赛事评委研究与 AI 视觉分析平台。首期试点只做 **Sony World Photography Awards（SWPA）2025 与 2026**。

这是一个可运行的研究界面和数据模型证明，不是完整的采集集群。页面能按赛事、届次、组别、奖项浏览获奖作品和评委；事实与推断分开；来源、记录时间和解析版本写在事实记录上。获奖原图不读取。官方说明里写到的维度会引用原句，没写到的留空。

## 怎么运行

需要 Node.js 22+。

```bash
npm install
npm run dev
```

开发服务器在 [http://127.0.0.1:41731](http://127.0.0.1:41731)。

界面使用 8px 间距网格、紫黑渐变和梅紫 / 钴蓝 / 余烬辉光玻璃卡。标题是 Geist 30/500，数据行是 Geist 36/300，核心数字是 Departure Mono。两套字体都是 SIL OFL 1.1，许可文件在 `src/fonts/OFL-Geist.txt` 与 `src/fonts/OFL-DepartureMono.txt`。默认夜间、默认中文。日夜、语言和辉光写在 `localStorage`（`pji-theme`、`pji-locale`、`pji-palette-night`、`pji-palette-day`），刷新后保留。玻璃透明度限制在 7%–10%，默认 8%。导航和主要动作使用 1.6px 线框图标。

```bash
npm test
npm run lint
npm run build
npm run export-seed
```

本人作品样本组：一组是这位评委自己发表的一套作品。同一套作品在个人网站、出版社和展览页重复出现，只算 1 组。评委评论过的获奖作品不算。满 3 组才生成风格标签；不够就标「样本不足」，偏好字段留空。

- [Bindi Vora](http://127.0.0.1:41731/juries/bindi-vora)：4 组本人作品，跨组标签带陈述原文、链接、置信度和模型版本。色彩只在单组里出现，不写进色彩偏好。
- [Paul Ninson](http://127.0.0.1:41731/juries/paul-ninson)：2 组，页面写明样本不足，没有风格标签。
- [Monica Allende](http://127.0.0.1:41731/juries/monica-allende)：0 组。她对 Zed Nelson 作品的评委会引语被标成「不是本人作品」。

```bash
curl -s http://127.0.0.1:41731/api/v1/juries/bindi-vora/profile
curl -s -X POST http://127.0.0.1:41731/api/v1/juries/paul-ninson/analyze
```

`export-seed` 把内存里的种子写成 `database/seed/swpa.json`。应用运行时直接读取 `src/lib/data/seed.ts`，不需要 PostgreSQL、Redis 或模型密钥。

交叉验证是本地夹具，不抓官网。打开 [2025 届](http://127.0.0.1:41731/editions/swpa-2025) 或 [2026 届](http://127.0.0.1:41731/editions/swpa-2026)，页面列出一致和冲突。2026 年 Open Creative 的摄影师拼写是冲突示例；2025 年 Wildlife & Nature 的 Zed Nelson 是多来源一致示例。完整 JSON：

```bash
curl -s http://127.0.0.1:41731/api/v1/editions/swpa-2026/validation
curl -s http://127.0.0.1:41731/api/v1/competitions/swpa/validation
```

可选环境变量见 `.env.example`。`VISION_MODEL` 和 `TEXT_MODEL` 留空。本试点不调用它们。

## 首期范围

- 赛事：SWPA。2027 不进入完整获奖集。
- 届次：2025（第 18 届）、2026（第 19 届）。
- 四个比赛体系：
  - Professional competition → 规范化 **Series**（系列）
  - Open competition → 规范化 **Single Image**（单张）
  - Student competition（系列，按当年命题）
  - Youth competition（单张）
- 收录各类别冠军和四项总冠军。Shortlist、第 2 名和第 3 名没有同时公开的作品标题，所以不入库。
- 官方入口清单与产品文档 §2.2 一致，写在 `collectors/sony/allowlist.ts`。2025 与 2026 获奖页上的赛制原文仍是 Professional / Open，规范化名称另存，不覆盖原文。

## 诚实性规则

- 赛事事实必须能回到公开来源。来源含 URL、页面标题、记录时间、解析版本、抽取版本。没有保存原文 HTML，因此 `contentHash` 为空。
- 来源里没有的标题、张数、教育背景、作品集链接保持空白，显示「未采集」或「来源页暂无」。不用模型补写。
- 同一公开文本里互相冲突的姓名、国别或年龄会写成备注，不合并成一条更“干净”的事实。
- 推断使用单独的区块和「推断」标记。单张分析与系列分析的字段不同。
- 评委本人作品不足 3 组时，画像标记「样本不足」，风格、色彩、构图全部为空。达到 3 组时，风格标签只引用这些作品页面上的陈述，不读像素，也不用职务简介。
- SWPA 是匿名评审。公开引语如果称「评委会」，只作为引语保存，不解释成某位评委选了某件作品。
- 跨届对照只发生在同一规范化赛制、同一组别。Open 的 Architecture 不与 Professional 的 Architecture & Design 混比。
- 没有像素分析结果时，报告不把题材、色彩或叙事写成视觉趋势。同赛制页面可以并列官方说明里的原句；说明没写到的维度保持未生成。
- 用户上传的照片只在浏览器里读取文件名、类型、大小、尺寸，并在本地计算亮度与颜色样本。二进制不上传，也不做相似图检索。语义维度只对照用户自己写下的说明。
- 平台给出的是历史记录和研究参照，不是下一届比赛的结果预测。

## 什么是真的，什么是桩

| 部分 | 状态 |
| --- | --- |
| SWPA 2025/2026 冠军姓名、作品名、组别、评委职务 | 据 World Photography Organisation 页面和 Sony 新闻稿核对后写入种子。不是这次请求实时抓取的 |
| 系列 / 单张数据结构、来源字段、权限状态 | 应用内真实使用 |
| Bilha 的 8 个画幅标题与说明 | 来自该系列官方作品页 |
| 其他系列的逐帧照片 | 未采集，张数为空 |
| 获奖原图 | 不抓取、不托管、不在页面里外链显示。权限状态为 `rights_blocked` |
| SonyAdapter、去重、域名校验 | 可运行。作品库仍读种子。另有多来源夹具和交叉验证，不发 HTTP |
| LangGraph、Celery、Redis、PostgreSQL、pgvector | 未部署。`database/schema.sql` 是目标表结构；`agents/graph.ts` 在进程内列出阶段，不调用 LangGraph |
| 获奖作品视觉分析、跨届审美趋势 | 不读像素。`pji-text-evidence` 只在官方说明原句命中词表时填写维度，并附原句。像素趋势保持未生成 |
| 评委本人作品与风格标签 | 夹具采集，不发 HTTP。满 3 组才由 `pji-style-tags` 根据作品陈述归并标签。评委页另有研究关系，不连到个人投票 |
| 任务队列 | 进程内执行可跑的阶段（夹具验证、说明证据、评委样本、报告）。创建请求先返回。像素分析与 Shortlist 保持阻塞。没有 Celery |

## 目录

- `src/app`：总览、赛事、届次、作品、系列、评委、报告、任务、上传分析、来源，以及 `/api/v1` 接口
- `src/lib/data`：类型、来源和种子
- `collectors/sony`：入口清单、名称规范化、去重、SonyAdapter、多来源摘录
- `collectors/portfolio`：本人作品样本组。允许的主机、夹具、同一作品并组
- `agents/style-tags.ts`：只读已采集的样本组，生成风格标签
- `agents/text-evidence.ts`：只读官方说明或用户说明里的原句，填写命中的视觉维度
- `collectors/cross-validate.ts`：一致 / 冲突 / 单一来源。官方主入口优先，冲突原文都保留
- `agents`：研究流程在进程内按阶段结算，不是 LangGraph 运行时
- `.cursor/skills/bgx-development-workflow/SKILL.md`：项目级 BGX 开发流程技能
- `docs/bgx`：按 BGX111、BGX222、BGX333 留下的规范、架构审查和开发计划
- `database/schema.sql`：目标 PostgreSQL 结构
- `tests/honesty.test.ts`：入口清单、事实与推断分离、跨赛制比较防护

## 接口

长任务对应 `POST /api/v1/competitions/swpa/research`，返回任务 ID，状态码 202。查询和重试：

- `GET /api/v1/tasks`
- `GET /api/v1/tasks/{id}`
- `POST /api/v1/tasks/{id}/retry`

作品和系列分析的 POST 返回已经生成的说明证据，不读取像素。用户说明走 `POST /api/v1/uploads/analyze`，只接受文字，拒绝图像字段。评委画像的 POST 用已采集的样本组重跑风格标签规则，不调用外部模型；不足 3 组时返回「样本不足」。研究关系：`GET /api/v1/juries/{id}/graph`。

可以打开这些页面看结果：

- [广角与俯视有原句](http://127.0.0.1:41731/photographs/single-2025-architecture)
- [没有系列说明，组图维度留空](http://127.0.0.1:41731/series/series-2025-creative)
- [系列说明原句，不采用评委引语](http://127.0.0.1:41731/series/series-2026-creative)
- [同赛制说明对照，像素趋势未生成](http://127.0.0.1:41731/reports/single_image)
- [本地测量与说明对照](http://127.0.0.1:41731/analyze)
- [任务会在进程内往下走](http://127.0.0.1:41731/tasks)
- [评委研究关系](http://127.0.0.1:41731/juries/bindi-vora)

```bash
curl -s -X POST http://127.0.0.1:41731/api/v1/uploads/analyze \
  -H 'content-type: application/json' \
  -d '{"caption":"a black-and-white portrait in a bedroom"}'
curl -s http://127.0.0.1:41731/api/v1/juries/bindi-vora/graph
curl -s -X POST http://127.0.0.1:41731/api/v1/competitions/swpa/research \
  -H 'content-type: application/json' \
  -d '{"years":[2025,2026],"scope":{"winners":true,"shortlists":false,"juries":true,"juryPortfolios":true,"imageAnalysis":true,"reportGeneration":true}}'
```
