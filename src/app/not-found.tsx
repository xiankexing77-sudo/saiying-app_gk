import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-serif text-3xl">这一页不在 2025 / 2026 的档案里</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        赛影只收录 VISION+ Mobile PhotoAwards 这两届。
      </p>
      <Link href="/" className="mt-4 inline-block text-sm text-primary">
        回首页
      </Link>
    </main>
  );
}
