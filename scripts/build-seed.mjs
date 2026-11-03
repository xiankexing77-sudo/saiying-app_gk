/**
 * Snapshot VISION+ 2025/2026 award winners into data/seed.json.
 * Inputs are local captures of the public gallery API and the site bundle.
 * Re-run only when those captures exist under /tmp.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const STAMP = "2026-11-03T00:00:00.000Z";
const GALLERY = "https://visionplus.vivo.com/competition.html/worksGalleries";
const PHOTO_AWARDS = "https://visionplus.vivo.com/competition.html/photoawards";
const RULES = "https://visionplus.vivo.com/rules";
const CEREMONY_2026 = "https://www.163.com/dy/article/L6A7IBFS051284V8.html";
const NEWS_2025 = "https://www.vivo.com.cn/brand/news/detail?id=1326&type=1";

const awardMap = {
  年度最佳作品: "年度最佳",
  单元冠军: "类别第一名",
  单元优胜奖: "类别优胜",
  组委会特别推荐奖: "组委会特别推荐奖",
  X系列最佳影像奖: "X 系列最佳",
  "S系列/V系列最佳影像奖": "S/V 系列最佳",
  蔡司专业影像奖: "蔡司专业风格奖",
  学生摄影师奖: "学生摄影师奖",
};

const unitToCategory = {
  LANDSCAPE: "cat-landscape",
  PORTRAIT: "cat-portrait",
  NIGHT2: "cat-night",
  MOTION: "cat-motion",
  TELEPHOTO_MACRO: "cat-tele",
  PHOTO_SERIES: "cat-series",
};

const publicityAuthors = {
  太空战舰: "吴正杰",
  金鱼长满枝头: "何明",
  节日夜: "陈勇",
  密布其上之光: "张樱凡",
  "Dancing Silhouettes": "Pradiptamoy Paul",
  乡村放映员: "刘力",
  皮影戏: "蔡泽宏",
  织网: "晋毅",
  天山下的牧羊人: "余润皓",
  大地的血肉: "贺进一",
  世界的北极: "夏厚龙",
  走过冷暖: "杨军",
  "《祈祷的小女孩》": "付建国",
  "【戴礼帽的男子】": "梁喜兵",
  少年强: "王宇",
  单杠上的教学: "樊丽勇",
  Helicity: "Patrick Pineda",
  逐梦生蓝: "顾勤",
  生命的源泉: "田鼠大婶",
  大地之树: "赵扬",
  "《我要飞得更高》": "冷正刚",
  瑟切达的金色时刻: "陈斌",
  夜树繁花: "丁发鑫",
  独行: "徐行",
  落日调色盘: "裴俊博",
};

const ceremonyAuthors = {
  太空战舰: { name: "歪杰", note: "公开报道中的网名", url: NEWS_2025 },
  地球之巅: { name: "马春林", note: "创作者盛典报道署名", url: CEREMONY_2026 },
  地底繁星: { name: "陈斌", note: "创作者盛典报道署名", url: CEREMONY_2026 },
  看见: { name: "周凯", note: "创作者盛典报道署名", url: CEREMONY_2026 },
  霜花里的笑: { name: "魏巨龙", note: "创作者盛典报道署名", url: CEREMONY_2026 },
  差一点: { name: "蔡泽宏", note: "创作者盛典报道署名", url: CEREMONY_2026 },
  "日常超现实：街头失序切片": {
    name: "陈剑芳",
    note: "创作者盛典报道署名",
    url: CEREMONY_2026,
  },
  雾锁熔光: { name: "吴正杰", note: "创作者盛典报道署名", url: CEREMONY_2026 },
  尾入深蓝: { name: "梁家进", note: "创作者盛典报道署名", url: CEREMONY_2026 },
  星河入梦: { name: "陈馨", note: "创作者盛典报道署名", url: CEREMONY_2026 },
  罕见的精灵舞动现象: {
    name: "董书畅",
    note: "创作者盛典报道署名",
    url: CEREMONY_2026,
  },
  彝魂天影: { name: "万贲", note: "创作者盛典报道署名", url: CEREMONY_2026 },
  "清凉！": { name: "李睿", note: "创作者盛典报道署名", url: CEREMONY_2026 },
  巴斯特的回响: { name: "许天琪", note: "创作者盛典报道署名", url: CEREMONY_2026 },
  花隅相伴: { name: "黄宇", note: "创作者盛典报道署名", url: CEREMONY_2026 },
  灼阳忆影: {
    name: "Jamir Lyndon Lumbao",
    note: "创作者盛典报道署名",
    url: CEREMONY_2026,
  },
  古祠侠影: { name: "许浩龙", note: "创作者盛典报道署名", url: CEREMONY_2026 },
  故乡的雨季: { name: "张景翔", note: "创作者盛典报道署名", url: CEREMONY_2026 },
  高山之上: { name: "王振", note: "创作者盛典报道署名", url: CEREMONY_2026 },
  影像的回响: { name: "王旭", note: "创作者盛典报道署名", url: CEREMONY_2026 },
  金峰悬月: { name: "李文尧", note: "创作者盛典报道署名", url: CEREMONY_2026 },
  门内门外: { name: "丁道明", note: "创作者盛典报道署名", url: CEREMONY_2026 },
  星移神山: { name: "孙昊", note: "创作者盛典报道署名", url: CEREMONY_2026 },
  动与静: { name: "管彦聪", note: "创作者盛典报道署名", url: CEREMONY_2026 },
  少年的心事: { name: "李东杰", note: "创作者盛典报道署名", url: CEREMONY_2026 },
  棒球场: { name: "李学骋", note: "创作者盛典报道署名", url: CEREMONY_2026 },
};

const titleAliases = {
  "Dancing Silhouettes": ["舞动的剪影"],
  "《祈祷的小女孩》": ["期盼中的小女孩"],
  "【戴礼帽的男子】": ["戴礼帽的男子"],
  Helicity: ["螺旋度"],
  逐梦生蓝: ["追梦青年"],
  "《我要飞得更高》": ["我要飞得更高"],
  灼阳忆影: ["Sunburnt Memories"],
};

const publicityToGallery = {
  太空战舰: "太空战舰",
  金鱼长满枝头: "金鱼长满枝头",
  节日夜: "节日夜",
  密布其上之光: "密布其上之光",
  舞动的剪影: "Dancing Silhouettes",
  乡村放映员: "乡村放映员",
  皮影戏: "皮影戏",
  织网: "织网",
  天山下的牧羊人: "天山下的牧羊人",
  大地的血肉: "大地的血肉",
  世界的北极: "世界的北极",
  走过冷暖: "走过冷暖",
  期盼中的小女孩: "《祈祷的小女孩》",
  戴礼帽的男子: "【戴礼帽的男子】",
  少年强: "少年强",
  单杠上的教学: "单杠上的教学",
  螺旋度: "Helicity",
  追梦青年: "逐梦生蓝",
  生命的源泉: "生命的源泉",
  大地之树: "大地之树",
  我要飞得更高: "《我要飞得更高》",
  瑟切达的金色时刻: "瑟切达的金色时刻",
  夜树繁花: "夜树繁花",
  独行: "独行",
  落日调色盘: "落日调色盘",
};

function isVivoId(name) {
  return /^vivo\d+$/.test(name || "");
}

function cleanModel(raw) {
  if (!raw || !String(raw).trim()) {
    return { phone_model: null, phone_note: null };
  }
  const parts = [
    ...new Set(
      String(raw)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
  if (parts.length === 1 && (parts[0] === "无exif" || parts[0] === "vivo")) {
    return {
      phone_model: null,
      phone_note:
        parts[0] === "无exif"
          ? "官网机型字段为「无exif」。"
          : "官网机型字段只有品牌「vivo」，没有具体机型。",
    };
  }
  const cleaned = parts
    .filter((p) => p !== "无exif" && p !== "vivo")
    .map((p) => p.replace(/^vivo\s+/i, ""));
  if (!cleaned.length) {
    return { phone_model: null, phone_note: "官网机型字段为「无exif」。" };
  }
  return { phone_model: cleaned.join("、"), phone_note: null };
}

function loadComments() {
  const src = fs.readFileSync("/tmp/p2025.js", "utf8");
  const obj = eval("(" + src + ")");
  const byGallery = {};
  const take = (item) => {
    const galleryTitle = publicityToGallery[item.worksName];
    if (!galleryTitle) {
      throw new Error("unmapped publicity title " + item.worksName);
    }
    const comments = [];
    for (const judge of item.judgeDetails || []) {
      const text = (judge.comment || "").trim();
      if (!text) continue;
      comments.push({
        speaker: judge.chName || judge.name || null,
        text,
        source_label: "官网获奖公示模块署名评语",
        source_url: GALLERY,
      });
    }
    if (typeof item.winJudge === "string" && item.winJudge.trim()) {
      comments.push({
        speaker: null,
        text: item.winJudge.trim(),
        source_label: "官网获奖公示模块评语（未署名）",
        source_url: GALLERY,
      });
    }
    byGallery[galleryTitle] = comments;
  };
  for (const item of obj.annualWorkList) take(item);
  for (const item of obj.unitChampionList) take(item);
  for (const group of obj.winnerList) {
    for (const item of group.list) take(item);
  }
  for (const item of obj.specialList) take(item);
  for (const item of obj.xSeriesWorkList) take(item);
  for (const item of obj.sSeriesWorkList) take(item);
  for (const item of obj.zeesWorkList) take(item);
  for (const item of obj.youngWorkList) take(item);
  return byGallery;
}

function resolveNames(title, galleryUser) {
  const aliases = [];
  const pub = publicityAuthors[title];
  const ceremony = ceremonyAuthors[title];
  let photographer = null;
  let photographer_source = null;
  if (galleryUser && !isVivoId(galleryUser)) {
    photographer = galleryUser;
    photographer_source = "作品集账号";
  } else if (pub) {
    photographer = pub;
    photographer_source = "获奖公示页作者名";
  } else if (ceremony) {
    photographer = ceremony.name;
    photographer_source = ceremony.note;
  } else if (galleryUser) {
    photographer = galleryUser;
    photographer_source = "作品集账号";
  }
  const seen = new Set([photographer]);
  const push = (name, source, source_url) => {
    if (!name || seen.has(name)) return;
    seen.add(name);
    aliases.push({ name, source, source_url });
  };
  if (pub) push(pub, "获奖公示页作者名", GALLERY);
  if (ceremony) push(ceremony.name, ceremony.note, ceremony.url);
  if (galleryUser) push(galleryUser, "作品集账号", GALLERY);
  return { photographer, photographer_source, name_aliases: aliases };
}

function publicNotes(title) {
  const notes = [];
  if (title === "地球之巅") {
    notes.push({
      label: "公开报道",
      text: "创作者盛典报道同时称《地球之巅》为风光单元冠军。作品集获奖接口只把它列在「年度最佳作品」，没有再单列一条单元冠军，因此这里不另记「类别第一名」。",
      source_url: CEREMONY_2026,
    });
  }
  if (title === "逐梦生蓝") {
    notes.push({
      label: "标题对照",
      text: "获奖公示模块标题为《追梦青年》，作品集标题为《逐梦生蓝》。两边的说明都指向江苏省残疾人游泳队，按同一件作品归档。",
      source_url: GALLERY,
    });
  }
  if (title === "灼阳忆影") {
    notes.push({
      label: "标题对照",
      text: "创作者盛典报道使用英文标题 Sunburnt Memories。作品集标题为《灼阳忆影》。",
      source_url: CEREMONY_2026,
    });
  }
  if (title === "太空战舰") {
    notes.push({
      label: "作者名对照",
      text: "获奖公示页作者名为吴正杰；公开报道称其网名为歪杰；作品集账号是一串 vivo 数字号。三处同时保留，方便对照。",
      source_url: NEWS_2025,
    });
  }
  return notes;
}

const commentsByTitle = loadComments();
const details = JSON.parse(fs.readFileSync("/tmp/details.json", "utf8"));

const works = [];
const awards = [];
const seenWorks = new Set();

for (const year of [2026, 2025]) {
  const modules = JSON.parse(
    fs.readFileSync(`/tmp/award-${year}.json`, "utf8"),
  );
  for (const mod of modules) {
    const awardType = awardMap[mod.awardName];
    if (!awardType) throw new Error("unknown award " + mod.awardName);
    for (const item of mod.imageWorkConfigs) {
      const detail = details[item.workId];
      if (!detail || detail.error) {
        throw new Error("missing detail " + item.workName);
      }
      const title = detail.workName || item.workName;
      if (!seenWorks.has(item.workId)) {
        seenWorks.add(item.workId);
        const galleryUser = detail.userName || item.userName || "";
        const names = resolveNames(title, galleryUser);
        const model = cleanModel(detail.model || item.model);
        const categoryId = unitToCategory[item.workUnit];
        if (!categoryId) throw new Error("unknown unit " + item.workUnit);
        const description = (detail.workDesc || "").trim() || null;
        works.push({
          id: item.workId,
          contest_id: `contest-${year}`,
          title,
          photographer: names.photographer,
          photographer_source: names.photographer_source,
          name_aliases: names.name_aliases,
          title_aliases: titleAliases[title] || [],
          category_id: categoryId,
          phone_model: model.phone_model,
          phone_note: model.phone_note,
          like_count: Number.isFinite(detail.likes) ? detail.likes : item.likeCount ?? null,
          share_count: Number.isFinite(detail.shares) ? detail.shares : null,
          detail_path: `/cn/works/detail?workId=${item.workId}`,
          detail_url: `https://visionplus.vivo.com/cn/works/detail?workId=${encodeURIComponent(item.workId)}`,
          work_id_ext: item.workId,
          description,
          is_award_winning: true,
          is_excellent: false,
          year,
          official_comments: year === 2025 ? commentsByTitle[title] || [] : [],
          public_notes: publicNotes(title),
          gallery_unit_name: item.workUnitName,
          created_at: STAMP,
          updated_at: STAMP,
        });
      }
      awards.push({
        id: `award-${item.workId}-${awardType}`,
        work_id: item.workId,
        award_type: awardType,
        year,
        rank_hint:
          awardType === "类别第一名" || awardType === "类别优胜"
            ? `官网单元：${item.workUnitName}`
            : awardType === "蔡司专业风格奖"
              ? "官网奖项名：蔡司专业影像奖"
              : null,
        official_name_zh: mod.awardName,
        official_name_en: mod.awardNameEnglish,
      });
    }
  }
}

const categories = [
  { id: "cat-landscape", code: "Landscape", name_zh: "风光", name_en: "Landscape", gallery_name_zh: "风光" },
  { id: "cat-portrait", code: "Portrait", name_zh: "人像", name_en: "Portrait", gallery_name_zh: "人像" },
  { id: "cat-night", code: "Night", name_zh: "夜景", name_en: "Night", gallery_name_zh: "夜色" },
  { id: "cat-motion", code: "Motion", name_zh: "动态", name_en: "Motion", gallery_name_zh: "运动" },
  { id: "cat-tele", code: "TelephotoMacro", name_zh: "长焦与微距", name_en: "Telephoto & Macro", gallery_name_zh: "长焦与微距" },
  { id: "cat-series", code: "PhotoSeries", name_zh: "组图", name_en: "PhotoSeries", gallery_name_zh: "组图" },
].map((c) => ({ ...c, contest_id: null }));

const judges = [
  {
    id: "judge-li",
    name: "黎晓亮",
    role: "摄影师、影像艺术家",
    bio_official: "",
    style_tags_inferred: ["叙事人像", "人物气质", "戏剧光影"],
    zeiss_path: false,
    years: [2026],
  },
  {
    id: "judge-xiao",
    name: "肖全",
    role: "人像摄影师",
    bio_official:
      "他被誉为“中国最好的人像摄影师”，著有摄影集《我们这一代》，2020年，他被联合国教科文组织授予国际文化促进基金会委员。他是一位以肖像记录时代的中国视觉讲述者，也是一个黄金时代的文化符号。",
    style_tags_inferred: ["时代肖像", "人物档案感组图"],
    zeiss_path: false,
    years: [2025, 2026],
  },
  {
    id: "judge-gola",
    name: "Francesco Gola",
    role: "蔡司移动摄影大使",
    bio_official:
      "他专注于长曝光海景拍摄至今已经超过15年。他致力于在米兰教授摄影技术并在全球范围内定期举办研讨会。他的照片多年来发表于RCS Media, Olycom，Landscape Photography Magazine, Digital Photographer等多家专业杂志和机构。他在风光摄影方面的大师级技巧也多次发表在由尼康，NiSi等品牌伙伴组织的多个影集中。",
    style_tags_inferred: ["长曝光风光 / 夜景", "蔡司光学向"],
    zeiss_path: true,
    years: [2025, 2026],
  },
  {
    id: "judge-bertram",
    name: "Bertram Hönlinger",
    role: "蔡司摄影专家",
    bio_official:
      "他既是一位摄影师，又是一位影像技术工程师。他拥有30余年影像领域工作经验，涉猎肖像、静物以及技术摄影等。他始终致力于传播摄影技术，其技术文章曾多次被发表在LENSIPRE摄影平台，曾于2017和2018年在“ZEISS ACADEMY”活动中开展摄影培训课程。",
    style_tags_inferred: ["技术完成度与蔡司向"],
    zeiss_path: true,
    years: [2025, 2026],
  },
  {
    id: "judge-yu",
    name: "于猛",
    role: "vivo 影像副总裁",
    bio_official:
      "他负责领导公司在影像领域的关键技术预研、产品认知、算法研究、系统集成开发、效果实现等；带领团队深度洞察消费者需求，推动智能手机影像功能创新，致力于为消费者提供便捷的影像工具，实现个性化的生活记录和艺术表达。",
    style_tags_inferred: ["机型与移动影像能力", "夜景/微距/动态等技术向"],
    zeiss_path: false,
    years: [2025, 2026],
  },
  {
    id: "judge-webb",
    name: "Alex Webb",
    role: "世界著名色彩摄影师",
    bio_official:
      "亚历克斯·韦伯是当今最著名的街头摄影大师之一，马格南图片社成员，他以生动而复杂的彩色照片而闻名。在30年的摄影生涯中，韦伯用幽默而神秘的镜头语言捕捉世界各地的街头生活，用他特有的方式使用光、影和颜色，创造了独一无二的阴影美学和色彩美学。",
    style_tags_inferred: ["彩色街头层次", "色彩叙事"],
    zeiss_path: false,
    years: [2025],
  },
].map((j) => ({
  id: j.id,
  name: j.name,
  role: j.role,
  bio_official: j.bio_official,
  style_tags_inferred: j.style_tags_inferred,
  source_url: PHOTO_AWARDS,
  locale_note: "须简体中文/中国区。英文 Europe 视图可能隐藏评委区块。",
  zeiss_path: j.zeiss_path,
  years: j.years,
  created_at: STAMP,
  updated_at: STAMP,
}));

const contestJudges = judges.flatMap((j, judgeIndex) =>
  j.years.map((year) => ({
    contest_id: `contest-${year}`,
    judge_id: j.id,
    year,
    sort_order: judgeIndex + 1,
  })),
);

const contests = [
  {
    id: "contest-2026",
    name: "vivo VISION+",
    brand: "vivo",
    edition_year: 2026,
    source_url: GALLERY,
    status_note:
      "投稿截止公开信息为 2026-06-26，本届征集已结束。赛影不提供投稿。",
    created_at: STAMP,
    updated_at: STAMP,
  },
  {
    id: "contest-2025",
    name: "vivo VISION+",
    brand: "vivo",
    edition_year: 2025,
    source_url: GALLERY,
    status_note: "2025 届获奖结果已公布。赛影只整理公开获奖档案，不提供投稿。",
    created_at: STAMP,
    updated_at: STAMP,
  },
];

const seed = {
  meta: {
    captured_at: STAMP,
    scope: "vivo VISION+ Mobile PhotoAwards 2025 and 2026 award winners only",
    image_policy: "未下载、未托管获奖原图。详情只保留官网 workId 外链。",
    sources: [GALLERY, PHOTO_AWARDS, RULES, NEWS_2025, CEREMONY_2026],
    notes: [
      "作品字段来自官网获奖列表接口 /api/web/page/award/work（langCode=zh）与作品详情接口。",
      "2025 公示评语来自官网前端 publicityDetails2025，按页面署名原样保留；未署名的不指认评委。",
      "2026 作品集接口的评语字段为空，不补写。",
      "黎晓亮的中文 Photo Awards 简介原文未在已抓取页面中找到，bio_official 留空。",
      "Bertram 页上简介里「曾在多项摄影比赛中担任评委」一句未写入档案，避免做成站外履历字段。",
      "点赞与分享来自详情接口，只作互动计数。",
    ],
  },
  contests,
  categories,
  judges: judges.map((judge) => {
    const { years, ...rest } = judge;
    void years;
    return rest;
  }),
  contest_judges: contestJudges,
  works,
  awards,
};

const byYear = { 2025: 0, 2026: 0 };
for (const w of works) byYear[w.year] += 1;
if (byYear[2025] !== 25 || byYear[2026] !== 25) {
  throw new Error("expected 25 works each year, got " + JSON.stringify(byYear));
}
const best2026 = works.find((w) => w.year === 2026 && w.title === "地球之巅");
const best2025 = works.find((w) => w.year === 2025 && w.title === "太空战舰");
if (!best2026 || best2026.photographer !== "CHUNLIN" || best2026.phone_model !== "X300 Ultra") {
  throw new Error("2026 best mismatch " + JSON.stringify(best2026));
}
if (
  !best2025 ||
  best2025.phone_model !== "X200 Pro" ||
  !best2025.name_aliases.some((a) => a.name === "歪杰")
) {
  throw new Error("2025 best mismatch");
}
const types = new Set(awards.map((a) => a.award_type));
for (const t of types) {
  if (!Object.values(awardMap).includes(t)) throw new Error("bad type " + t);
}

fs.mkdirSync(path.join(ROOT, "data"), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, "data", "seed.json"),
  JSON.stringify(seed, null, 2) + "\n",
);
console.log(
  "works",
  works.length,
  "awards",
  awards.length,
  "comments",
  works.reduce((n, w) => n + w.official_comments.length, 0),
);
