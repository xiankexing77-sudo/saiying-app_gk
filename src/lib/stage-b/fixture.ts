import { readFileSync } from "node:fs";
import path from "node:path";
import { parsePublicHttps } from "../../../collectors/safety";
import { IMAGE_POLICY } from "./policy";

export type OfficialImageExport = {
  fixtureId: string;
  workId: string;
  sourceUrl: string;
  pageUrl: string;
  pageTitle: string;
  exportedAt: string;
  note: string;
};

export type OfficialImageFixture = {
  policy: typeof IMAGE_POLICY;
  exportedAt: string;
  liveCrawl: false;
  stageALiveCrawl: false;
  note: string;
  images: OfficialImageExport[];
};

const WORK_ID = /^[a-z0-9-]+$/;

export function officialImageFixturePath() {
  return path.join(process.cwd(), "fixtures/stage-b/official-image-urls.json");
}

export function assertOfficialImageUrl(input: string) {
  const url = parsePublicHttps(input);
  const host = url.hostname.toLowerCase();
  if (host !== "www.worldphoto.org" && host !== "worldphoto.org") {
    throw new Error(`图像下载拒绝主机：${host}`);
  }
  if (!url.pathname.startsWith("/sites/default/files/")) {
    throw new Error("图像 URL 必须落在官方文件路径 /sites/default/files/");
  }
  return input;
}

export function parseOfficialImageFixture(raw: unknown): OfficialImageFixture {
  if (!raw || typeof raw !== "object") throw new Error("官方图像 fixture 不是对象");
  const body = raw as Partial<OfficialImageFixture>;
  if (body.policy !== IMAGE_POLICY) throw new Error("官方图像 fixture 的策略不是 C");
  if (body.liveCrawl !== false || body.stageALiveCrawl !== false) {
    throw new Error("官方图像 fixture 不能标成 live crawl");
  }
  if (!Array.isArray(body.images) || body.images.length === 0) throw new Error("官方图像 fixture 没有图像 URL");
  const seen = new Set<string>();
  const images = body.images.map((item) => {
    if (!item || typeof item !== "object") throw new Error("官方图像 fixture 有空条目");
    const row = item as OfficialImageExport;
    if (!WORK_ID.test(row.workId) || row.fixtureId !== row.workId) {
      throw new Error(`官方图像 fixture 的作品 id 不合法：${row.workId}`);
    }
    if (seen.has(row.workId)) throw new Error(`官方图像 fixture 重复：${row.workId}`);
    seen.add(row.workId);
    if (!row.sourceUrl?.trim() || !row.pageUrl?.trim() || !row.exportedAt?.trim()) {
      throw new Error(`${row.workId} 缺少来源 URL、页面 URL 或导出时间`);
    }
    assertOfficialImageUrl(row.sourceUrl);
    parsePublicHttps(row.pageUrl);
    return {
      fixtureId: row.workId,
      workId: row.workId,
      sourceUrl: row.sourceUrl,
      pageUrl: row.pageUrl,
      pageTitle: row.pageTitle,
      exportedAt: row.exportedAt,
      note: row.note,
    };
  });
  return {
    policy: IMAGE_POLICY,
    exportedAt: body.exportedAt ?? "",
    liveCrawl: false,
    stageALiveCrawl: false,
    note: body.note ?? "",
    images,
  };
}

export function loadOfficialImageFixture(file = officialImageFixturePath()) {
  return parseOfficialImageFixture(JSON.parse(readFileSync(/*turbopackIgnore: true*/ file, "utf8")));
}
