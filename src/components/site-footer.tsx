import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-xs leading-5 text-muted-foreground sm:px-6">
        <p>
          Photo Jury Intelligence 把主办方公开事实和 AI 推断分开。当前视觉分析是模板，没有调用模型，也没有保存获奖原图。
        </p>
        <p>
          SWPA 为匿名评审。平台不推断评委个人投票，也不把历史获奖特征写成未来比赛结果。
          <Link className="ml-2 underline" href="/reports">
            看事实对照
          </Link>
        </p>
      </div>
    </footer>
  );
}
