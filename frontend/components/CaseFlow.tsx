"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  FileText, Upload, Check, Clock, Circle, ShieldCheck, Languages, Sparkles,
  Landmark, RefreshCw, CheckCircle2, AlertTriangle, Camera,
} from "lucide-react";
import { api, type CaseView } from "@/lib/api";
import {
  Card, Primary, Ghost, Chip, Mini, Seam, Scanning, ErrorBanner, Spine,
  SERIF, ArrowLeft,
} from "./ui";

type UiStep = "intake" | "verify" | "understand" | "documents" | "draft" | "submitted" | "waiting" | "clarification" | "resolved";
const STORE_KEY = "taxlens_case";

function spineIndex(step: UiStep): number {
  return ({ intake: 0, verify: 0, understand: 1, documents: 2, draft: 3, submitted: 4, waiting: 5, clarification: 5, resolved: 5 } as const)[step];
}

export default function CaseFlow({ back, reduced }: { back: () => void; reduced: boolean }) {
  const [c, setC] = useState<CaseView | null>(null);
  const [step, setStep] = useState<UiStep>("intake");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plain, setPlain] = useState(true);
  const [draftText, setDraftText] = useState("");
  const [approved, setApproved] = useState(false);
  const [clarifyExplain, setClarifyExplain] = useState<string>("");
  const [clarifyText, setClarifyText] = useState("Bank debit proof for the Rs 50,000 is attached.");
  const [noticeText, setNoticeText] = useState("");
  const [scanning, setScanning] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<"gemini" | "demo-fallback" | "text">("text");
  const [ocrError, setOcrError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      setError(null);
      const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORE_KEY) : null;
      if (saved) {
        setLoading(true);
        try {
          const { case_id, step: savedStep } = JSON.parse(saved);
          setC(await api.getCase(case_id));
          setStep(savedStep as UiStep);
        } catch {
          window.localStorage.removeItem(STORE_KEY);
          setStep("intake");
        } finally { setLoading(false); }
        return;
      }
      setStep("intake");
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (c) window.localStorage.setItem(STORE_KEY, JSON.stringify({ case_id: c.case_id, step }));
    top.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }, [c, step, reduced]);

  const scanNotice = (text?: string) => {
    setScanning(true); setError(null);
    api.createCase(text)
      .then((created) => { setC(created); setStep("verify"); })
      .catch((e) => setError((e as Error).message))
      .finally(() => setScanning(false));
  };

  const onPhoto = async (file: File) => {
    setOcrBusy(true);
    setError(null);
    setOcrError(null);

    if (!file.type.startsWith("image/")) {
      setOcrError("Please upload a JPG, PNG, or WEBP photo of the notice.");
      setOcrBusy(false);
      return;
    }

    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);

    try {
      const created = await api.createCaseFromImage(file);
      setC(created);
      setAnalysisMode(created.analysis_mode === "gemini" ? "gemini" : "demo-fallback");
      setStep("verify");
    } catch (e) {
      setOcrError((e as Error).message || "We couldn't read that photo.");
    } finally {
      setOcrBusy(false);
    }
  };

  const restart = () => { window.localStorage.removeItem(STORE_KEY); back(); };
  const guard = async (fn: () => Promise<void>) => {
    setBusy(true); setError(null);
    try { await fn(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  if (loading) return <div className="pt-10"><Scanning label="Loading" /></div>;

  if (step === "intake") {
    return (
      <div className="flex flex-col gap-4 pt-2" ref={top}>
        <Ghost onClick={back} icon={ArrowLeft}>Back</Ghost>
        <div>
          <div className="kicker mb-2">Step 01 · Scan</div>
          <h2 className="font-heading text-[26px] font-extrabold leading-[1.05] tracking-tighter">
            Show us your notice.
          </h2>
          <p className="mt-2 text-[13.5px] text-ink/70">Take a photo, upload a copy, paste the text, or use the sample.</p>
        </div>

        {scanning ? (
          <Scanning label="Reading your notice" />
        ) : (
          <>
            {photoPreview && (
              <div className="border-2 border-ink/15 bg-paper p-2">
                <div className="mb-2 flex items-center justify-between">
                  <span className="kicker">Photo selected</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreview(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink/55 hover:text-ink"
                  >
                    Retake
                  </button>
                </div>
                <img
                  src={photoPreview}
                  alt="Uploaded tax notice preview"
                  className="max-h-64 w-full object-contain bg-white"
                />
              </div>
            )}

            <div className="border-2 border-ink/25 bg-white">
              <div className="flex items-center justify-between border-b border-ink/15 px-3 py-2">
                <span className="kicker">Notice intake</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink/50">
                  {noticeText ? `${noticeText.length} chars` : "empty"}
                </span>
              </div>
              <textarea
                value={noticeText}
                onChange={(e) => { setNoticeText(e.target.value); setOcrError(null); }}
                rows={7}
                placeholder="Paste the full text of your Income Tax notice here…"
                aria-label="Notice text"
                className="w-full resize-none border-0 bg-white p-3 font-mono text-[12.5px] leading-relaxed text-ink placeholder:text-ink/35 focus:outline-none"
              />
              <div className="flex items-center gap-2 border-t border-ink/15 bg-paper px-3 py-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={ocrBusy}
                  className="flex items-center gap-1.5 border border-ink/25 bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ink hover:border-ink disabled:opacity-40"
                >
                  <Camera className="h-3 w-3 text-signal" /> {ocrBusy ? "Reading your notice…" : "Upload photo"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => e.target.files?.[0] && onPhoto(e.target.files[0])}
                  className="hidden"
                />
              </div>
            </div>

            {ocrError && <ErrorBanner message={ocrError} />}
            {error && <ErrorBanner message={error} onRetry={() => scanNotice(noticeText || undefined)} />}

            <Primary onClick={() => scanNotice(noticeText)} disabled={!noticeText.trim() || ocrBusy} icon={FileText}>
              Scan this notice
            </Primary>
            <Ghost onClick={() => scanNotice(undefined)} icon={Sparkles}>Use the sample notice instead</Ghost>
          </>
        )}
      </div>
    );
  }

  if (error && !c) return <div className="pt-6"><ErrorBanner message={error} onRetry={() => location.reload()} /></div>;
  if (!c) return null;

  const ext = c.extraction;
  const issue = ext?.issues?.[0];
  const amount = issue?.amount ? `₹${issue.amount.toLocaleString("en-IN")}` : "the claimed amount";
  const missing = c.required_documents.filter((d) => !d.present);

  const uploadMissing = () => guard(async () => {
    let updated = c;
    for (const d of missing) updated = await api.uploadDoc(c.case_id, d.doc_id);
    setC(updated);
  });
  const doDraft = () => guard(async () => { const u = await api.draft(c.case_id); setC(u); setDraftText(u.draft?.body ?? ""); setStep("draft"); });
  const doSubmit = () => guard(async () => { const u = await api.submit(c.case_id, true); setC(u); setStep("submitted"); });
  const doRequestClar = () => guard(async () => { const u = await api.requestClarification(c.case_id); setC(u); setClarifyExplain(u.clarification_explanation ?? ""); setStep("clarification"); });
  const doSubmitClar = () => guard(async () => { const u = await api.submitClarification(c.case_id, clarifyText); setC(u); setStep("resolved"); });

  return (
    <div className="flex flex-col gap-4 pt-2" ref={top}>
      <div className="flex items-center justify-between">
        <Ghost onClick={restart} icon={ArrowLeft}>Exit</Ghost>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink/50">Case</span>
          <span className="font-mono text-[11px] text-ink">{c.case_id}</span>
        </div>
      </div>
      <Spine active={spineIndex(step)} />
      {error && <ErrorBanner message={error} />}

      {step === "verify" && (
        <div className="flex flex-col gap-4">
          <div>
            <div className="kicker mb-2">Step 02 · Verify</div>
            <h2 className="font-heading text-[22px] font-extrabold leading-tight tracking-tighter">The notice, as we read it.</h2>
          </div>
          <div className="border-2 border-ink/25 bg-white">
            <div className="flex items-center gap-2 border-b border-ink/15 px-3 py-2">
              <FileText className="h-3.5 w-3.5 text-ink/60" />
              <span className="kicker">{analysisMode === "gemini" ? "Notice photo · Gemini read" : "Notice text · scanned"}</span>
            </div>
            <pre className="whitespace-pre-wrap break-words p-3 font-mono text-[11.5px] leading-[1.65] text-ink/75">{c.notice_preview}</pre>
          </div>
          <Card className="border-l-4 border-l-emerald-600">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-emerald-700" />
              <div>
                <div className="font-heading text-[15px] font-extrabold text-emerald-900">We can explain this notice</div>
                <div className="text-[12.5px] text-emerald-800">A photo cannot prove authenticity by itself. Verify the communication through the official Income Tax portal before acting.</div>
              </div>
            </div>
          </Card>
          <Primary onClick={() => setStep("understand")} icon={FileText}>Understand this notice</Primary>
        </div>
      )}

      {step === "understand" && ext && (
        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="kicker mb-2">Step 03 · Understand</div>
              <h2 className="font-heading text-[22px] font-extrabold leading-tight tracking-tighter">Here's what it means.</h2>
            </div>
            <button onClick={() => setPlain((v) => !v)}
              className="flex shrink-0 items-center gap-1.5 border border-ink/25 bg-white px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ink/70">
              <Languages className="h-3 w-3" />{plain ? "Plain" : "Official"}
            </button>
          </div>
          <p className="border-l-4 border-signal py-1 pl-3 text-[14px] italic leading-relaxed text-ink/80" style={SERIF}>
            {ext.notice_type === "143_3"
              ? "This notice appears to be asking for supporting evidence for information in your tax return. It is a review, not a verdict."
              : "TaxLens translated the important parts of your notice into plain language so you can see what to do next."}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Mini label={plain ? "Tax year" : "Assessment year"} value={ext.assessment_year} />
            <Mini label={plain ? "Reply by" : "Deadline"} value={ext.deadline ?? "see notice"} tone="signal" />
            <Mini label={plain ? "What they're checking" : "Section"} value={plain ? (issue?.topic ?? "Information in your return") : (issue?.topic ?? "See notice")} />
            <Mini label="Amount" value={amount} />
          </div>
          <Seam label="What they're asking"
            extracted={ext.requested_documents?.length ? `Supporting evidence for: ${ext.requested_documents.join(", ")}` : "See the notice for the requested information."}
            plain={issue?.questioned_amount
              ? `They want additional support for ₹${issue.questioned_amount.toLocaleString("en-IN")} of the amount being reviewed.`
              : "TaxLens found the requested information in your uploaded notice. We will guide you through what to collect next."}
            reduced={reduced} />
          <Card>
            <div className="kicker mb-3">Your action plan</div>
            {[["Understand the issue", "done"], ["Collect supporting documents", "now"], ["Prepare your response", "todo"], ["Review and approve it", "todo"], ["Submit through the official workflow", "todo"]].map(([label, state], i, a) => (
              <div key={label} className={`flex items-center gap-3 border-b border-ink/10 pb-2 last:border-b-0 last:pb-0 ${i > 0 ? "pt-2" : ""}`}>
                <div className={`flex h-5 w-5 items-center justify-center ${state === "done" ? "bg-emerald-100" : state === "now" ? "bg-signal text-paper" : "bg-ink/5"}`}>
                  {state === "done" ? <Check className="h-3 w-3 text-emerald-700" /> : state === "now" ? <Clock className="h-3 w-3" /> : <Circle className="h-3 w-3 text-ink/30" />}
                </div>
                <span className={`text-[13.5px] ${state === "todo" ? "text-ink/40" : "text-ink"}`}>{label}</span>
              </div>
            ))}
          </Card>
          <Primary onClick={() => setStep("documents")} icon={Upload}>Check my documents</Primary>
        </div>
      )}

      {step === "documents" && (
        <div className="flex flex-col gap-4">
          <div>
            <div className="kicker mb-2">Step 04 · Documents</div>
            <h2 className="font-heading text-[22px] font-extrabold leading-tight tracking-tighter">
              Your response is <span className="text-signal">{c.readiness}%</span> ready.
            </h2>
          </div>
          <div className="h-1.5 w-full overflow-hidden border border-ink/25 bg-white">
            <div className={`h-full bg-signal ${reduced ? "" : "transition-all duration-500"}`} style={{ width: `${c.readiness}%` }} />
          </div>
          <Card>
            {c.required_documents.map((d, i) => (
              <div key={d.doc_id} className={`flex items-start gap-3 ${i < c.required_documents.length - 1 ? "mb-3 border-b border-ink/10 pb-3" : ""}`}>
                <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center ${d.present ? "bg-emerald-100 text-emerald-700" : "bg-signal-100 text-signal-800"}`}>
                  {d.present ? <Check className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1">
                  <div className="text-[14px] font-bold text-ink">{d.label}</div>
                  <div className="text-[11px] font-mono text-ink/45">{d.formal_label}</div>
                  {!d.present && d.reason_if_missing && <div className="mt-1 border-l-2 border-signal pl-2 text-[12px] text-signal-800">{d.reason_if_missing}</div>}
                </div>
              </div>
            ))}
          </Card>
          {c.readiness < 100
            ? <Primary onClick={uploadMissing} loading={busy} icon={Upload}>Add the missing document</Primary>
            : <Primary onClick={doDraft} loading={busy} icon={Sparkles}>Prepare my response</Primary>}
        </div>
      )}

      {step === "draft" && c.draft && (
        <div className="flex flex-col gap-4">
          <div>
            <div className="kicker mb-2">Step 05 · Draft</div>
            <h2 className="font-heading text-[22px] font-extrabold leading-tight tracking-tighter">We prepared a response.</h2>
            <p className="mt-2 text-[13.5px] text-ink/70">A draft, not a final answer. Edit anything before you send.</p>
          </div>
          <textarea value={draftText} onChange={(e) => setDraftText(e.target.value)} rows={11} aria-label="Draft response"
            className="w-full border-2 border-ink/25 bg-white p-3 font-mono text-[12.5px] leading-relaxed text-ink focus:border-ink focus:outline-none" />
          <Card className="bg-paper">
            <div className="kicker mb-2">How this draft was built</div>
            <div className="flex flex-wrap gap-2">
              {c.draft.provenance.map((p, i) => (
                <Chip key={i} tone={p.origin === "rule" || p.origin === "interpreted" ? "signal" : "neutral"}
                  icon={p.origin === "rule" || p.origin === "interpreted" ? Sparkles : Check}>{p.detail}</Chip>
              ))}
            </div>
          </Card>
          <label className="flex items-center gap-3 border-2 border-ink/25 bg-white p-4">
            <input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} className="h-4 w-4 accent-signal" />
            <span className="text-[13px] text-ink">I've read this and I approve it being submitted.</span>
          </label>
          <Primary onClick={doSubmit} loading={busy} disabled={!approved} icon={Landmark}>Approve &amp; submit</Primary>
          <p className="text-center text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink/50">TaxLens never submits on its own</p>
        </div>
      )}

      {step === "submitted" && (
        <div className="flex flex-col gap-4">
          <Card className="border-l-4 border-l-emerald-600 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-700" />
            <div className="mt-2 font-heading text-[18px] font-extrabold text-emerald-900">Response submitted</div>
            <div className="mt-1 font-mono text-[12px] text-emerald-800">Ref {c.submission_ref}</div>
          </Card>
          <Primary onClick={() => setStep("waiting")} icon={RefreshCw}>See what happens next</Primary>
        </div>
      )}

      {step === "waiting" && (
        <div className="flex flex-col gap-4">
          <div>
            <div className="kicker mb-2">Step 06 · Waiting</div>
            <h2 className="font-heading text-[22px] font-extrabold leading-tight tracking-tighter">What happens now.</h2>
          </div>
          <p className="text-[13.5px] text-ink/70">You don't need to do anything else right now. We'll translate the department's reply the moment it comes.</p>
          <Card>
            <div className="text-[13px] font-bold text-ink">Waiting for the department</div>
            <div className="text-[11.5px] text-ink/60">This can take time. You don't need to chase it.</div>
          </Card>
          <div className="border-2 border-dashed border-ink/30 p-3 text-center text-[10px] font-bold uppercase tracking-[0.1em] text-ink/50">
            Demo control — stand in for the department
          </div>
          <Primary onClick={doRequestClar} loading={busy} icon={RefreshCw}>Simulate the department's reply</Primary>
        </div>
      )}

      {step === "clarification" && (
        <div className="flex flex-col gap-4">
          <Card className="border-l-4 border-l-amber-600">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-700" />
              <div>
                <div className="font-heading text-[15px] font-extrabold text-amber-900">The department needs one more thing</div>
                <div className="text-[12.5px] text-amber-800">Good news first: they accepted most of your response.</div>
              </div>
            </div>
          </Card>
          <Seam label="Their message"
            extracted="Furnish evidence that the ₹50,000 payment was made from the assessee's own bank account."
            plain={clarifyExplain} reduced={reduced} />
          <textarea value={clarifyText} onChange={(e) => setClarifyText(e.target.value)} rows={3} aria-label="Clarification response"
            className="w-full border-2 border-ink/25 bg-white p-3 font-mono text-[12.5px] text-ink focus:border-ink focus:outline-none" />
          <Primary onClick={doSubmitClar} loading={busy} icon={Landmark}>Send the clarification</Primary>
        </div>
      )}

      {step === "resolved" && (
        <div className="flex flex-col gap-4">
          <Card className="border-l-4 border-l-emerald-600 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-700" />
            <div className="mt-2 font-heading text-[18px] font-extrabold text-emerald-900">Complete</div>
            <div className="mt-1 text-[12.5px] text-emerald-800">The department has recorded everything. No further action needed right now.</div>
          </Card>
          <p className="border-l-4 border-signal py-1 pl-3 text-center text-[14px] italic leading-relaxed text-ink/70" style={SERIF}>
            You handled a scrutiny notice end to end — without becoming a tax expert. That's the whole idea.
          </p>
          <Ghost onClick={restart} icon={ArrowLeft}>Back to start</Ghost>
        </div>
      )}
    </div>
  );
}