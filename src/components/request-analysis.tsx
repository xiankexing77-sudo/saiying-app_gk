"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { translate } from "@/lib/i18n/messages";
import { LinearIcon } from "./linear-icon";
import { useI18n } from "./preferences";

export function RequestAnalysis({ url }: { url: string }) {
  const { m } = useI18n();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function run() {
    setPending(true);
    try {
      const response = await fetch(url, { method: "POST" });
      const body = (await response.json()) as { message?: string };
      setMessage(body.message ?? m.juries.returned);
    } catch {
      setMessage(m.juries.requestFailed);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button type="button" onClick={run} disabled={pending} className="btn-glow">
        <LinearIcon icon={Sparkles} />
        {pending ? m.juries.requesting : m.juries.generate}
      </button>
      {message ? <p className="max-w-xs text-xs leading-6 text-muted-foreground">{message}</p> : null}
    </div>
  );
}

export function JuryConfidence({ confidence, model, count }: { confidence: string; model: string | null; count: number }) {
  const { m } = useI18n();
  return (
    <p className="font-num mt-4 text-xs text-muted-foreground">
      {translate(m, "juries.confidence", { confidence, model: model ?? m.juries.modelMissing, count })}
    </p>
  );
}
