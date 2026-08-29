import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck, ShieldAlert, FileText, Upload, Check, Clock, ArrowRight,
  Lock, AlertTriangle, ChevronRight, Languages, Zap, ZapOff, RefreshCw,
  CheckCircle2, Circle, Loader2, ArrowLeft, Sparkles, FileSearch, Landmark, Eye
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Synthetic case data — no real people, PAN, or documents.           */
/* ------------------------------------------------------------------ */

const SCAM_SMS =
  "URGENT: Your income-tax refund of ₹48,500 is pending. Verify your bank account immediately to receive it: http://bit.ly/itr-refund-verify";

const NOTICE = {
  section: "143(3)",
  sectionPlain: "The department is reviewing your return",
  ay: "2025–26",
  deadline: "15 September 2026",
  pan: "ABCDE1234F",
  claim: "Section 80C deduction",
  claimPlain: "A tax-saving deduction you claimed",
  amount: "₹1,50,000",
  questioned: "₹50,000",
};

const DOCS = [
  { id: "proof", plain: "Investment & payment proof", formal: "80C investment proof", have: true },
  { id: "return", plain: "Your return for 2025–26", formal: "ITR, AY 2025–26", have: true },
  {
    id: "bank",
    plain: "Bank evidence for the ₹50,000 balance",
    formal: "Bank statement — 80C",
    have: false,
    why: "The notice questions ₹50,000 of your ₹1,50,000 claim. This one document answers exactly that.",
  },
];

const DRAFT = `To the Assessing Officer,

In response to the notice under Section 143(3) for Assessment Year 2025–26, regarding the deduction of ₹1,50,000 claimed under Section 80C:

I confirm the deduction and enclose the supporting evidence. Investment and payment proofs covering ₹1,00,000 are attached. For the remaining ₹50,000, I enclose the corresponding bank debit evidence dated within the financial year.

I request that this be taken on record. I remain available to provide any further information.

— [Your name]`;

/* ------------------------------------------------------------------ */
/*  Small UI atoms                                                     */
/* ------------------------------------------------------------------ */

const serif = { fontFamily: "Georgia, 'Times New Roman', serif" };

function Chip({ tone = "slate", icon: Icon, children }) {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    indigo: "bg-indigo-50 text-indigo-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}

function Primary({ children, onClick, disabled, icon: Icon = ArrowRight }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-base font-semibold text-white transition duration-200 hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300 disabled:opacity-40"
    >
      {children}
      <Icon className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
    </button>
  );
}

function Ghost({ children, onClick, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-slate-500 transition hover:text-slate-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

/* The signature element: extracted-from-source vs interpreted-by-us. */
function Seam({ label, extracted, plain, reduced }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <Chip tone="slate" icon={FileSearch}>From your notice</Chip>
          <span className="pt-0.5 text-sm font-semibold text-slate-900">{extracted}</span>
        </div>
        {plain && (
          <div className={`flex items-start gap-2 ${reduced ? "" : "transition"}`}>
            <Chip tone="indigo" icon={Sparkles}>Explained</Chip>
            <span className="pt-0.5 text-sm text-slate-600">{plain}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Scanning({ label }) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      <div className="text-sm font-medium text-slate-500">{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Case spine — interprets state, never shows the enum               */
/* ------------------------------------------------------------------ */

const SPINE = [
  "Message checked",
  "Notice understood",
  "Documents ready",
  "Response prepared",
  "Response submitted",
  "Waiting for department",
];

function Spine({ active }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {SPINE.map((s, i) => {
        const done = i < active;
        const now = i === active;
        return (
          <div key={s} className="flex shrink-0 items-center gap-1">
            <div
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                done ? "bg-emerald-50 text-emerald-700" : now ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
              }`}
            >
              {done ? <Check className="h-3 w-3" /> : now ? <Clock className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
              {s}
            </div>
            {i < SPINE.length - 1 && <ChevronRight className="h-3 w-3 text-slate-300" />}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Root                                                               */
/* ------------------------------------------------------------------ */

export default function TaxLens() {
  const [screen, setScreen] = useState("landing"); // landing | scam | case | ais
  const [lowData, setLowData] = useState(false);

  return (
    <div className="min-h-screen w-full bg-slate-50 py-4 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4">
        {/* top bar */}
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => setScreen("landing")} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Eye className="h-4 w-4" />
            </div>
            <div className="text-left leading-none">
              <div className="text-sm font-bold tracking-tight">TaxLens</div>
              <div className="text-[10px] text-slate-400">Demo · synthetic data</div>
            </div>
          </button>
          <button
            onClick={() => setLowData((v) => !v)}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500"
          >
            {lowData ? <ZapOff className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
            {lowData ? "Low-data on" : "Low-data"}
          </button>
        </div>

        <div className="flex-1">
          {screen === "landing" && <Landing go={setScreen} reduced={lowData} />}
          {screen === "scam" && <ScamFlow back={() => setScreen("landing")} reduced={lowData} />}
          {screen === "case" && <CaseFlow back={() => setScreen("landing")} reduced={lowData} />}
          {screen === "ais" && <AisFlow back={() => setScreen("landing")} reduced={lowData} />}
        </div>

        <footer className="mt-6 border-t border-slate-200 pt-4 text-center text-[11px] leading-relaxed text-slate-400">
          Independent prototype. Not affiliated with or endorsed by the Income Tax Department.
          Uses synthetic documents and data. No real PAN, Aadhaar, or accounts.
        </footer>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Landing                                                            */
/* ------------------------------------------------------------------ */

function Landing({ go, reduced }) {
  return (
    <div className="flex flex-col gap-6 pt-6">
      <div>
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900">
          Got a tax message and don't know what it means?
        </h1>
        <p className="mt-3 text-base italic text-slate-500" style={serif}>
          That's okay. Show it to us — we'll tell you what it is, whether it's real, and what to do next.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <EntryCard
          tone="rose"
          icon={ShieldAlert}
          title="Check a suspicious message"
          sub="Paste an SMS or email you're not sure about"
          onClick={() => go("scam")}
        />
        <EntryCard
          tone="slate"
          icon={FileText}
          title="Understand a notice"
          sub="Open a sample Section 143(3) notice"
          onClick={() => go("case")}
        />
        <EntryCard
          tone="amber"
          icon={FileSearch}
          title="Something in my records looks wrong"
          sub="Flag an entry in your annual statement (AIS)"
          onClick={() => go("ais")}
        />
      </div>

      <div className="rounded-2xl bg-white p-4 text-center text-xs text-slate-400">
        No sign-up. No PAN. No OTP. Pick any option to start the demo.
      </div>
    </div>
  );
}

function EntryCard({ tone, icon: Icon, title, sub, onClick }) {
  const ring = {
    rose: "text-rose-600 bg-rose-50",
    slate: "text-slate-700 bg-slate-100",
    amber: "text-amber-600 bg-amber-50",
  }[tone];
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${ring}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <div className="text-xs text-slate-500">{sub}</div>
      </div>
      <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Scam flow  (VERIFY)                                                */
/* ------------------------------------------------------------------ */

function ScamFlow({ back, reduced }) {
  const [text, setText] = useState(SCAM_SMS);
  const [phase, setPhase] = useState("input"); // input | scanning | result

  const run = () => {
    setPhase("scanning");
    setTimeout(() => setPhase("result"), reduced ? 200 : 1100);
  };

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Ghost onClick={back} icon={ArrowLeft}>Back</Ghost>

      {phase !== "result" && (
        <>
          <h2 className="text-xl font-bold tracking-tight">Paste the message you received</h2>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-100"
          />
          {phase === "scanning" ? (
            <Scanning label="Checking links, urgency, and requests…" />
          ) : (
            <Primary onClick={run} icon={ShieldCheck}>Check this message</Primary>
          )}
        </>
      )}

      {phase === "result" && (
        <div className="flex flex-col gap-4">
          <Card className="border-rose-200 bg-rose-50">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <div className="text-lg font-bold text-rose-900">This looks suspicious</div>
                <div className="text-sm text-rose-700">Treat it as a scam until you've verified it yourself.</div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Why we flagged it</div>
            <Reason icon={AlertTriangle} title="Outside link" text="It sends you to a shortened link, away from the official tax workflow." />
            <Reason icon={Clock} title="Pressure to act now" text="Real notices give you a deadline, not a 'do this immediately'." />
            <Reason icon={Lock} title="Asks for bank details" text="The department never collects account details through a message link." last />
          </Card>

          <Card className="border-slate-900">
            <div className="text-sm font-semibold text-slate-900">What to do</div>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />Don't click the link or reply.</li>
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />Check for any real refund only on the official Income Tax portal.</li>
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />If unsure, no genuine refund is ever lost by waiting to verify.</li>
            </ul>
          </Card>

          <p className="px-1 text-center text-xs text-slate-400">
            We assess risk to help you decide. We don't confirm fraud, and we never speak for the department.
          </p>
          <Ghost onClick={back} icon={ArrowLeft}>Check another message</Ghost>
        </div>
      )}
    </div>
  );
}

function Reason({ icon: Icon, title, text, last }) {
  return (
    <div className={`flex gap-3 ${last ? "" : "mb-3 border-b border-slate-100 pb-3"}`}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <div className="text-sm text-slate-500">{text}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Case flow — the golden path                                        */
/* ------------------------------------------------------------------ */

function CaseFlow({ back, reduced }) {
  // stage: 0 verify, 1 understand, 2 documents, 3 draft, 4 submitted, 5 waiting,
  //        6 clarification, 7 resolved
  const [stage, setStage] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [plain, setPlain] = useState(true);
  const [docs, setDocs] = useState(DOCS);
  const [draft, setDraft] = useState(DRAFT);
  const [approved, setApproved] = useState(false);
  const topRef = useRef(null);

  const ready = Math.round((docs.filter((d) => d.have).length / docs.length) * 100);
  const spineIndex = [0, 1, 2, 3, 4, 5, 5, 5][stage];

  const advance = (to, label) => {
    if (reduced) { setStage(to); return; }
    setScanning(true);
    setTimeout(() => { setScanning(false); setStage(to); }, 1100);
  };

  useEffect(() => { topRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" }); }, [stage]);

  return (
    <div className="flex flex-col gap-4 pt-2" ref={topRef}>
      <div className="flex items-center justify-between">
        <Ghost onClick={back} icon={ArrowLeft}>Exit</Ghost>
        <Chip tone="slate">Case IT-DEMO-8421</Chip>
      </div>

      <Card className="py-3"><Spine active={spineIndex} /></Card>

      {scanning && <Scanning label="Reading the notice…" />}

      {!scanning && stage === 0 && (
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
              <FileText className="h-4 w-4" /> Sample notice · synthetic
            </div>
            <div className="space-y-1 font-mono text-[11px] leading-relaxed text-slate-500">
              <div>INCOME-TAX NOTICE (SYNTHETIC)</div>
              <div>Under Section 143(3)</div>
              <div>PAN: {NOTICE.pan}  ·  AY {NOTICE.ay}</div>
              <div>Subject: Verification of deduction u/s 80C</div>
              <div>Amount under review: {NOTICE.amount}</div>
              <div>Respond by: {NOTICE.deadline}</div>
            </div>
          </div>
          <Card className="border-emerald-200 bg-emerald-50">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
              <div>
                <div className="font-bold text-emerald-900">No scam signals found</div>
                <div className="text-sm text-emerald-700">This matches the shape of a genuine notice — but always confirm it on the official portal too.</div>
              </div>
            </div>
          </Card>
          <Primary onClick={() => advance(1)} icon={FileText}>Understand this notice</Primary>
        </div>
      )}

      {!scanning && stage === 1 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Here's what it means</h2>
            <button
              onClick={() => setPlain((v) => !v)}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500"
            >
              <Languages className="h-3.5 w-3.5" />
              {plain ? "Plain" : "Official"}
            </button>
          </div>

          <p className="text-base italic text-slate-600" style={serif}>
            A scrutiny notice is a review, not a verdict. The department is asking you to back up one thing on your return.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <Mini label={plain ? "What tax year" : "Assessment year"} value={NOTICE.ay} />
            <Mini label={plain ? "Reply by" : "Response deadline"} value={NOTICE.deadline} tone="amber" />
            <Mini label={plain ? "What they're checking" : "Section / claim"} value={plain ? NOTICE.claimPlain : NOTICE.claim} />
            <Mini label={plain ? "How much" : "Amount"} value={NOTICE.amount} />
          </div>

          <Seam
            label="The specific request"
            extracted={`Provide proof for the ${NOTICE.amount} claimed under Section 80C`}
            plain={`They accept most of it. ${NOTICE.questioned} of your claim needs one more supporting document.`}
            reduced={reduced}
          />

          <Card>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Your action plan</div>
            <Plan step="Understand the issue" state="done" />
            <Plan step="Collect supporting documents" state="now" />
            <Plan step="Prepare your response" state="todo" />
            <Plan step="Review and approve it" state="todo" />
            <Plan step="Submit through the official workflow" state="todo" last />
          </Card>

          <Primary onClick={() => advance(2)} icon={Upload}>Check my documents</Primary>
        </div>
      )}

      {!scanning && stage === 2 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold tracking-tight">Your response is {ready}% ready</h2>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full bg-emerald-500 ${reduced ? "" : "transition-all duration-500"}`} style={{ width: `${ready}%` }} />
          </div>

          <Card>
            {docs.map((d, i) => (
              <div key={d.id} className={`flex items-start gap-3 ${i < docs.length - 1 ? "mb-3 border-b border-slate-100 pb-3" : ""}`}>
                <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${d.have ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                  {d.have ? <Check className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-900">{d.plain}</div>
                  <div className="text-xs text-slate-400">{d.formal}</div>
                  {!d.have && <div className="mt-1 text-xs text-amber-700">{d.why}</div>}
                </div>
                {!d.have && (
                  <button
                    onClick={() => setDocs((prev) => prev.map((x) => (x.id === d.id ? { ...x, have: true } : x)))}
                    className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Add
                  </button>
                )}
              </div>
            ))}
          </Card>

          {ready < 100 ? (
            <p className="text-center text-sm text-slate-500">Add the one missing document to continue.</p>
          ) : (
            <Primary onClick={() => advance(3)} icon={Sparkles}>Prepare my response</Primary>
          )}
        </div>
      )}

      {!scanning && stage === 3 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold tracking-tight">We prepared a response</h2>
          <p className="text-sm text-slate-500">A draft, not a final answer. You're in control — edit anything before it's sent.</p>

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={11}
            className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-100"
          />

          <Card className="bg-slate-50">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">How this draft was built</div>
            <div className="flex flex-wrap gap-2">
              <Chip tone="slate" icon={FileSearch}>Your notice</Chip>
              <Chip tone="slate" icon={Check}>Your confirmation</Chip>
              <Chip tone="slate" icon={FileText}>Your documents</Chip>
              <Chip tone="indigo" icon={Sparkles}>TaxLens response rules</Chip>
            </div>
          </Card>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} className="h-5 w-5 rounded" />
            <span className="text-sm text-slate-600">I've read this and I approve it being submitted.</span>
          </label>

          <Primary onClick={() => advance(4)} disabled={!approved} icon={Landmark}>Approve & submit</Primary>
          <p className="text-center text-xs text-slate-400">TaxLens never submits a tax response on its own.</p>
        </div>
      )}

      {!scanning && stage === 4 && (
        <div className="flex flex-col gap-4">
          <Card className="border-emerald-200 bg-emerald-50 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <div className="mt-2 text-lg font-bold text-emerald-900">Response submitted</div>
            <div className="mt-1 text-sm text-emerald-700">Reference IT-DEMO-8421 · {NOTICE.deadline.replace("September 2026", "Aug 2026")}</div>
          </Card>
          <Timeline stage="submitted" />
          <Primary onClick={() => setStage(5)} icon={ArrowRight}>See what happens next</Primary>
        </div>
      )}

      {!scanning && stage === 5 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold tracking-tight">What happens now</h2>
          <p className="text-sm text-slate-500">You don't need to do anything else right now. We'll translate the department's reply the moment it comes.</p>
          <Timeline stage="waiting" />
          <div className="rounded-2xl border border-dashed border-slate-300 p-3 text-center text-xs text-slate-400">
            Demo control — stand in for the department
          </div>
          <Primary onClick={() => advance(6)} icon={RefreshCw}>Simulate the department's reply</Primary>
        </div>
      )}

      {!scanning && stage === 6 && (
        <div className="flex flex-col gap-4">
          <Card className="border-amber-200 bg-amber-50">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
              <div>
                <div className="font-bold text-amber-900">The department needs one more thing</div>
                <div className="text-sm text-amber-700">Good news first: they accepted most of your response.</div>
              </div>
            </div>
          </Card>

          <Seam
            label="Their message"
            extracted="Furnish evidence that the ₹50,000 payment was made from the assessee's own bank account."
            plain="They want proof that the ₹50,000 came from your account — not just that the investment exists."
            reduced={reduced}
          />

          <Card>
            <div className="mb-2 text-sm font-semibold text-slate-900">What you need to add</div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <FileText className="h-4 w-4 text-slate-400" /> Bank debit proof for ₹50,000
              </div>
              <Chip tone="emerald" icon={Check}>Added</Chip>
            </div>
          </Card>

          <Primary onClick={() => advance(7)} icon={Landmark}>Send the clarification</Primary>
        </div>
      )}

      {!scanning && stage === 7 && (
        <div className="flex flex-col gap-4">
          <Card className="border-emerald-200 bg-emerald-50 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <div className="mt-2 text-lg font-bold text-emerald-900">Your response is complete</div>
            <div className="mt-1 text-sm text-emerald-700">The department has recorded everything. No further action needed right now.</div>
          </Card>
          <Timeline stage="resolved" />
          <p className="text-center text-sm italic text-slate-500" style={serif}>
            You handled a scrutiny notice end to end — without becoming a tax expert. That's the whole idea.
          </p>
          <Ghost onClick={back} icon={ArrowLeft}>Back to start</Ghost>
        </div>
      )}
    </div>
  );
}

function Mini({ label, value, tone = "slate" }) {
  const v = tone === "amber" ? "text-amber-700" : "text-slate-900";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-0.5 text-sm font-bold ${v}`}>{value}</div>
    </div>
  );
}

function Plan({ step, state, last }) {
  const icon =
    state === "done" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> :
    state === "now" ? <Clock className="h-3.5 w-3.5 text-slate-900" /> :
    <Circle className="h-3.5 w-3.5 text-slate-300" />;
  const bg = state === "done" ? "bg-emerald-100" : state === "now" ? "bg-slate-200" : "bg-slate-100";
  return (
    <div className={`flex items-center gap-3 ${last ? "" : "mb-2"}`}>
      <div className={`flex h-6 w-6 items-center justify-center rounded-full ${bg}`}>{icon}</div>
      <span className={`text-sm ${state === "todo" ? "text-slate-400" : "text-slate-700"}`}>{step}</span>
    </div>
  );
}

function Timeline({ stage }) {
  const nodes = [
    { label: "Communication received", meaning: "We logged the notice." , done: true },
    { label: "Notice understood", meaning: "You saw what it meant.", done: true },
    { label: "Documents checked", meaning: "Your evidence was complete.", done: true },
    { label: "Response submitted", meaning: "It reached the department.", done: true },
    {
      label: stage === "resolved" ? "Recorded by department" : "Waiting for department",
      meaning: stage === "resolved" ? "Everything is on record. Nothing to do now." : "This can take time. You don't need to chase it.",
      done: stage === "resolved",
      now: stage !== "resolved",
    },
  ];
  return (
    <Card>
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Your case</div>
      {nodes.map((n, i) => (
        <div key={n.label} className={`flex gap-3 ${i < nodes.length - 1 ? "pb-3" : ""}`}>
          <div className="flex flex-col items-center">
            <div className={`flex h-5 w-5 items-center justify-center rounded-full ${n.done ? "bg-emerald-500 text-white" : "bg-slate-900 text-white"}`}>
              {n.done ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            </div>
            {i < nodes.length - 1 && <div className="my-1 w-px flex-1 bg-slate-200" />}
          </div>
          <div className="pb-1">
            <div className="text-sm font-semibold text-slate-900">{n.label}</div>
            <div className="text-xs text-slate-500">{n.meaning}</div>
          </div>
        </div>
      ))}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  AIS flow — second complete loop                                    */
/* ------------------------------------------------------------------ */

function AisFlow({ back, reduced }) {
  const [phase, setPhase] = useState("view"); // view | reason | review | done
  const [reason, setReason] = useState(null);

  const reasons = ["Not my transaction", "Duplicate entry", "Incorrect amount", "Incorrect information"];

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Ghost onClick={back} icon={ArrowLeft}>Back</Ghost>

      {phase === "view" && (
        <>
          <h2 className="text-xl font-bold tracking-tight">This entry in your records</h2>
          <Card>
            <div className="grid grid-cols-2 gap-3">
              <Mini label="Reported by" value="XYZ AMC" />
              <Mini label="Type" value="Mutual fund purchase" />
              <Mini label="Amount" value="₹2,00,000" tone="amber" />
              <Mini label="Reported date" value="12 Jan 2026" />
            </div>
          </Card>
          <p className="text-sm text-slate-500">If this doesn't look right, you can tell the department — they let you give feedback on records you believe are wrong.</p>
          <Primary onClick={() => setPhase("reason")} icon={ArrowRight}>This isn't right</Primary>
        </>
      )}

      {phase === "reason" && (
        <>
          <h2 className="text-xl font-bold tracking-tight">What's wrong with it?</h2>
          <div className="flex flex-col gap-2">
            {reasons.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`flex items-center justify-between rounded-2xl border p-4 text-left text-sm font-medium transition ${
                  reason === r ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                {r}
                {reason === r && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
          <Primary onClick={() => setPhase("review")} disabled={!reason} icon={ArrowRight}>Prepare my feedback</Primary>
        </>
      )}

      {phase === "review" && (
        <>
          <h2 className="text-xl font-bold tracking-tight">Review your feedback</h2>
          <Card>
            <Seam
              label="Feedback to be submitted"
              extracted={`${reason} — MF purchase, ₹2,00,000, XYZ AMC, 12 Jan 2026`}
              plain="We'll flag this entry with your reason. The department reviews it and updates your record if it agrees."
              reduced={reduced}
            />
          </Card>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <input type="checkbox" defaultChecked className="h-5 w-5 rounded" />
            <span className="text-sm text-slate-600">This is accurate to the best of my knowledge.</span>
          </label>
          <Primary onClick={() => setPhase("done")} icon={Landmark}>Submit feedback</Primary>
        </>
      )}

      {phase === "done" && (
        <>
          <Card className="border-emerald-200 bg-emerald-50 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <div className="mt-2 text-lg font-bold text-emerald-900">Feedback submitted</div>
            <div className="mt-1 text-sm text-emerald-700">Reference AIS-DEMO-3390 · marked "{reason}"</div>
          </Card>
          <p className="text-center text-sm text-slate-500">You'll see the outcome in your records once the department reviews it. Nothing else needed for now.</p>
          <Ghost onClick={back} icon={ArrowLeft}>Back to start</Ghost>
        </>
      )}
    </div>
  );
}
