"use client";
import React, { useState } from "react";
import { ShieldAlert, ShieldCheck, Check, Clock, Lock, AlertTriangle } from "lucide-react";
import { api, type Risk } from "@/lib/api";
import { Card, Primary, Ghost, Scanning, ErrorBanner, ArrowLeft } from "./ui";

const SAMPLE = "URGENT: Your income-tax refund of Rs 48,500 is pending. Verify your bank account immediately to receive it: http://bit.ly/itr-refund-verify";

export default function ScamFlow({ back }: { back: () => void }) {
  const [text, setText] = useState(SAMPLE);
  const [risk, setRisk] = useState<Risk | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true); setError(null);
    try { setRisk(await api.checkMessage(text)); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Ghost onClick={back} icon={ArrowLeft}>Back</Ghost>
      {!risk && (
        <>
          <div>
            <div className="kicker mb-2">Suspicious message</div>
            <h2 className="font-heading text-[24px] font-extrabold leading-tight tracking-tighter">Paste what you received.</h2>
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} aria-label="Message to check"
            className="w-full border-2 border-ink/25 bg-white p-3 font-mono text-[12.5px] leading-relaxed text-ink focus:border-ink focus:outline-none" />
          {error && <ErrorBanner message={error} onRetry={run} />}
          {loading ? <Scanning label="Checking links, urgency, and requests" /> : <Primary onClick={run} icon={ShieldCheck}>Check this message</Primary>}
        </>
      )}
      {risk && (
        <div className="flex flex-col gap-4">
          <Card className={risk.risk_level === "HIGH" ? "border-l-4 border-l-signal" : "border-l-4 border-l-amber-600"}>
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center ${risk.risk_level === "HIGH" ? "bg-signal-100 text-signal" : "bg-amber-100 text-amber-700"}`}>
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <div className="font-heading text-[17px] font-extrabold text-ink">
                  {risk.risk_level === "HIGH" ? "This looks suspicious" : "Be careful with this one"}
                </div>
                <div className="text-[12.5px] text-ink/70">Treat it as a scam until you've verified it yourself.</div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="kicker mb-3">Why we flagged it</div>
            {risk.reasons.map((r, i) => (
              <div key={i} className={`flex gap-3 ${i < risk.reasons.length - 1 ? "mb-3 border-b border-ink/10 pb-3" : ""}`}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-signal-100 text-signal">
                  {i === 0 ? <AlertTriangle className="h-4 w-4" /> : i === 1 ? <Clock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </div>
                <div className="text-[13px] text-ink/80">{r}</div>
              </div>
            ))}
          </Card>
          {risk.advice.length > 0 && (
            <Card className="border-l-4 border-l-ink">
              <div className="kicker mb-2">What to do</div>
              <ul className="space-y-2 text-[13px] text-ink/80">
                {risk.advice.map((a, i) => (
                  <li key={i} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />{a}</li>
                ))}
              </ul>
            </Card>
          )}
          <p className="text-center text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink/50">
            We assess risk — we don't confirm fraud
          </p>
          <Ghost onClick={() => setRisk(null)} icon={ArrowLeft}>Check another message</Ghost>
        </div>
      )}
    </div>
  );
}