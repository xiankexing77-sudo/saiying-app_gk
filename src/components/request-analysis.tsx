"use client";

import { useState } from "react";

export function RequestAnalysis({ url, label }: { url: string; label: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function run() {
    setPending(true);
    try {
      const response = await fetch(url, { method: "POST" });
      const body = (await response.json()) as { message?: string };
      setMessage(body.message ?? "已返回");
    } catch {
      setMessage("请求没有完成");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="rounded-full bg-amber-900 px-3 py-1.5 text-xs text-amber-50 disabled:opacity-60"
      >
        {pending ? "请求中" : label}
      </button>
      {message ? <p className="max-w-xs text-xs leading-5 text-amber-950">{message}</p> : null}
    </div>
  );
}
