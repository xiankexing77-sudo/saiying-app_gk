import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-6 py-20">
      <h1 className="text-4xl">没有这条记录</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">首期只有 SWPA 2025 与 2026 的已核对种子。缺失字段不会被补写成事实。</p>
      <Link href="/" className="mt-6 inline-block text-sm underline">
        回到总览
      </Link>
    </main>
  );
}
