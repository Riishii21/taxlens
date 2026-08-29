"use client";
import React, { useEffect, useState } from "react";
import { ArrowRight, Check, Landmark, CheckCircle2 } from "lucide-react";
import { api, type AisItem } from "@/lib/api";
import { Card, Primary, Ghost, Mini, Seam, Scanning, ErrorBanner, ArrowLeft } from "./ui";

const REASONS: [string, string][] = [
  ["not_mine", "Not my transaction"], ["duplicate", "Duplicate entry"],
  ["incorrect_amount", "Incorrect amount"], ["incorrect_info", "Incorrect information"],
];

export default function AisFlow({ back, reduced }: { back: () => void; reduced: boolean }) {
  const [item, setItem] = useState<AisItem | null>(null);
  const [phase, setPhase] = useState<"view" | "reason" | "review" | "done">("view");
  const [reason, setReason] = useState<string | null>(null);
  const [ref, setRef] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.aisSample().then(setItem).catch((e) => setError((e as Error).message)); }, []);

  const submit = async () => {
    if (!item || !reason) return;
    setBusy(true); setError(null);
    try { const r = await api.aisFeedback(item.ais_id, reason); setRef(r.feedback_id); setPhase("done"); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  if (!item) return <div className="pt-10">{error ? <ErrorBanner message={error} /> : <Scanning label="Loading your records" />}</div>;
  const label = REASONS.find(([id]) => id === reason)?.[1] ?? "";

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Ghost onClick={back} icon={ArrowLeft}>Back</Ghost>
      {error && <ErrorBanner message={error} />}
      {phase === "view" && (
        <>
          <div>
            <div className="kicker mb-2">AIS entry</div>
            <h2 className="font-heading text-[24px] font-extrabold leading-tight tracking-tighter">This entry in your records.</h2>
          </div>
          <Card>
            <div className="grid grid-cols-2 gap-3">
              <Mini label="Reported by" value={item.reported_by} />
              <Mini label="Type" value={item.type} />
              <Mini label="Amount" value={`₹${item.amount.toLocaleString("en-IN")}`} tone="signal" />
              <Mini label="Reported" value={item.reported_date} />
            </div>
          </Card>
          <p className="text-[13.5px] text-ink/70">If this doesn&apos;t look right, you can tell the department — they let you give feedback on records you believe are wrong.</p>
          <Primary onClick={() => setPhase("reason")} icon={ArrowRight}>This isn&apos;t right</Primary>
        </>
      )}
      {phase === "reason" && (
        <>
          <div>
            <div className="kicker mb-2">Reason</div>
            <h2 className="font-heading text-[24px] font-extrabold leading-tight tracking-tighter">What&apos;s wrong with it?</h2>
          </div>
          <div className="flex flex-col">
            {REASONS.map(([id, text]) => (
              <button key={id} onClick={() => setReason(id)}
                className={`flex items-center justify-between border-2 border-b-0 border-ink/25 p-3 text-left text-[13px] font-bold transition last:border-b-2 ${reason === id ? "bg-ink text-paper" : "bg-white text-ink hover:bg-paper"}`}>
                {text}
                {reason === id && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
          <Primary onClick={() => setPhase("review")} disabled={!reason} icon={ArrowRight}>Prepare my feedback</Primary>
        </>
      )}
      {phase === "review" && (
        <>
          <div>
            <div className="kicker mb-2">Review</div>
            <h2 className="font-heading text-[24px] font-extrabold leading-tight tracking-tighter">Review your feedback.</h2>
          </div>
          <Seam label="Feedback to be submitted"
            extracted={`${label} — ${item.type}, ₹${item.amount.toLocaleString("en-IN")}, ${item.reported_by}`}
            plain="We'll flag this entry with your reason. The department reviews it and updates your record if it agrees."
            reduced={reduced} />
          <label className="flex items-center gap-3 border-2 border-ink/25 bg-white p-4">
            <input type="checkbox" defaultChecked className="h-4 w-4 accent-signal" />
            <span className="text-[13px] text-ink">This is accurate to the best of my knowledge.</span>
          </label>
          <Primary onClick={submit} loading={busy} icon={Landmark}>Submit feedback</Primary>
        </>
      )}
      {phase === "done" && (
        <>
          <Card className="border-l-4 border-l-emerald-600 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-700" />
            <div className="mt-2 font-heading text-[18px] font-extrabold text-emerald-900">Feedback submitted</div>
            <div className="mt-1 font-mono text-[12px] text-emerald-800">Ref {ref} · {label}</div>
          </Card>
          <p className="text-center text-[13px] text-ink/70">You&apos;ll see the outcome once the department reviews it. Nothing else needed for now.</p>
          <Ghost onClick={back} icon={ArrowLeft}>Back to start</Ghost>
        </>
      )}
    </div>
  );
}