import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-6 text-xs leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>推断卡片不是 vivo 官方评语。点赞不是评选依据。</p>
        <p>
          范围仅 PhotoAwards 2025 / 2026。
          <Link href="/about" className="ml-2 underline underline-offset-2">
            数据说明
          </Link>
        </p>
      </div>
    </footer>
  );
}
