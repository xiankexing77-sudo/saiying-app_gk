export const metadata = { title: "关于" };

const sources = [
  {
    label: "作品集",
    href: "https://visionplus.vivo.com/competition.html/worksGalleries",
  },
  {
    label: "Photo Awards（评委请用中文区）",
    href: "https://visionplus.vivo.com/competition.html/photoawards",
  },
  {
    label: "竞赛规则",
    href: "https://visionplus.vivo.com/rules",
  },
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8 text-sm leading-7">
      <header>
        <h1 className="font-serif text-4xl">关于赛影</h1>
        <p className="mt-3 text-base">
          赛影是给摄影新手的学习助手，只整理 vivo VISION+ Mobile PhotoAwards
          的 2025 与 2026。它不是图床，不是投稿工具，也不是官方赛务后台。
        </p>
      </header>

      <section>
        <h2 className="font-serif text-2xl">范围</h2>
        <p className="mt-2">
          官网还有 Film、Exhibitions 等栏目。赛影没有收录那些全库，也不做 2024
          及更早届次，不做其他赛事品牌。2026 届投稿截止的公开信息是 2026-06-26，征集已经结束。这里不能替你投稿。
        </p>
        <p className="mt-2">
          评委信息以来源站简体中文 / 中国区为准。切换语言或地区后，评委区块可能不可见；英文 Europe 视图不一定有评委。
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl">数据从哪来</h2>
        <ul className="mt-2 space-y-1">
          {sources.map((source) => (
            <li key={source.href}>
              <a className="underline" href={source.href} target="_blank" rel="noreferrer">
                {source.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-2">
          获奖作品的标题、作者展示名、题材、奖项、机型、点赞、分享和作品说明，来自作品集获奖接口与作品详情页。2025
          的公示评语来自官网前端的获奖公示模块，按页面署名原样放在「官网原文」里。2026
          的评语字段是空的，页面会写「来源页暂无」。
        </p>
        <p className="mt-2">
          黎晓亮的完整中文简介没有在已抓取的 Photo Awards 文本里找到，所以简介原文留空。Bertram
          Hönlinger 页上有一句曾担任其他比赛评委的话，赛影没有把它做成档案字段。
        </p>
        <p className="mt-2">
          原图不下载、不托管。作品详情用 workId 链回官网。截图引用只保存你填写的本地文件名和来源网址。
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl">诚实性</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>「官网原文」和「推断」分开标。推断不是 vivo 官方评语。</li>
          <li>不编造评委原话、分数或官方排名算法。</li>
          <li>点赞是读者互动，不是评分，也不拿来解释入选。</li>
          <li>不说某一位评委单独决定了某件作品。席位对照只说明「这类题材可能被哪些角色看到」。</li>
          <li>蔡司专业风格奖按公开规则单独标出蔡司评委终审路径。</li>
          <li>缺了的字段显示「来源页暂无」，不用站外履历或作品集补上。</li>
          <li>入选解读由本地规则模板生成，方便以后换成可重复运行的模型；换模型时仍要过同一条诚实检查。</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl">你的笔记</h2>
        <p>
          收藏、笔记和截图引用存在浏览器本地。取消收藏时，笔记默认保留，并会提示你。赛影 v1 没有账号，也没有云同步。
        </p>
      </section>
    </main>
  );
}
