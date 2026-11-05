# BGX666 验收

选定范围只有 BGX333 的 A1：不新增业务功能，逐项验收已经落地的 D1–D7。

## 命令

在仓库根目录执行：

- `npm test`：26 项通过，0 项失败。
- `npm run lint`：通过，无告警。
- `npx tsc --noEmit`：通过。

浏览器抽查（`npm run dev`，端口 41731）：

- 总览「说明证据已填写」为 27，「说明不足留空」为 25。
- `/analyze` 输入 `a black-and-white portrait in a bedroom` 后，色彩为「黑白」，主体为「卧室」，构图为「未分析」。本地红色样张的占优色相为「红」，尺寸 80×40。二进制未上传。
- `/series/series-2025-creative` 的系列维度为「未分析」，说明写明未读取像素。
- `/reports/single_image` 列出说明原句，并写明像素趋势未生成。对照表是 Open / Architecture，不混入 Professional 的 Architecture & Design。
- `/tasks` 上 2025+2026 研究任务完成，`image_analysis` 为 blocked，采集与质量检查为 passed。勾选 Shortlist 的任务停在阻塞。
- `/juries/bindi-vora` 有研究关系，并写明没有选择边。`/juries/paul-ninson` 为样本不足 2/3，偏好字段为「未分析」。

## 逐项

| 编号 | 状态 | 说明 |
| --- | --- | --- |
| D1 | 已完成 | 单张与系列 schema 分离；广角原句存在；无说明的系列留空；证据不包含评委引语「The jury applauded」 |
| D2 | 已完成 | `pixelTrend` 为 `not_generated`；有原句的维度为 `text_quoted` |
| D3 | 已完成 | 说明接口拒绝带 `image` 的 JSON，HTTP 400。本地测量留在浏览器 |
| D4 | 已完成 | 研究任务进程内结束；像素任务重试后仍阻塞；2027 被拒绝 |
| D5 | 已完成 | 满 3 组才有风格标签；研究图关系里没有「投票」或「选择」 |
| D6 | 已完成 | 赛事、届次和奖项来源显示记录时间与 URL |
| D7 | 已完成 | `.cursor/skills/bgx-development-workflow/SKILL.md` 与提供的技能文件一致 |
| A1 | 已完成 | 本文件 |
| N1–N6 | 未完成 | 计划明确不选。不是本阶段遗漏 |

未改分析规则、采集器或任务状态机。
