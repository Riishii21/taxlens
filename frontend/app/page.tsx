"use client";

import { ChangeEvent, useMemo, useState } from "react";

type Screen =
  | "home"
  | "notice-input"
  | "message-input"
  | "processing"
  | "understood"
  | "documents"
  | "ais-feedback"
  | "draft"
  | "review"
  | "submitted"
  | "clarification"
  | "resolved";

type NoticeFacts = {
  communicationType: "notice" | "suspicious_message" | "record_issue";
  riskLevel: "low" | "medium" | "high";
  noticeType: string;
  assessmentYear: string;
  deadline: string;
  issue: string;
  requestedAction: string;
  requestedDocuments: string[];
  plainLanguage: string;
  whyReceived: string;
  confidence: number;
};

const syntheticNotice = `NOTICE UNDER SECTION 143(3)\n\nAssessment Year: 2025-26\n\nDear Taxpayer,\n\nDuring review of the return for the assessment year 2025-26, supporting documentary evidence is required in respect of a deduction claimed in the return.\n\nPlease furnish supporting evidence for the deduction, including relevant payment or investment proof and supporting bank evidence where applicable.\n\nPlease respond by 15 September 2026.\n\nThis synthetic communication is created solely for demonstration of TaxLens.`;

const syntheticSuspiciousMessage = `URGENT: Your Income Tax refund of Rs. 48,500 is pending. Verify your bank account immediately by clicking this link: http://tax-refund-example.invalid/claim. Failure to act within 2 hours will result in cancellation.`;

const syntheticAISIssue = `AIS ENTRY\nSource: Synthetic Reporting Entity\nAssessment Year: 2025-26\nTransaction amount: Rs. 1,20,000\nUser note: I do not recognize this transaction and believe it may not belong to me.`;

const fallbackFacts: NoticeFacts = {
  communicationType: "notice",
  riskLevel: "low",
  noticeType: "143(3)-style assessment communication",
  assessmentYear: "2025-26",
  deadline: "15 September 2026",
  issue: "Supporting evidence is requested for a deduction claimed in the return.",
  requestedAction: "Provide supporting information and documentary evidence for the stated claim.",
  requestedDocuments: ["Investment/payment proof", "Supporting bank evidence"],
  plainLanguage:
    "The department is reviewing part of your tax return and wants proof supporting a deduction you claimed.",
  whyReceived:
    "The notice asks for additional information so the department can verify the claim in the return.",
  confidence: 0.96,
};

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>("home");
  const [lowData, setLowData] = useState(false);
  const [facts, setFacts] = useState<NoticeFacts>(fallbackFacts);
  const [inputText, setInputText] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<"notice" | "suspicious" | "ais">("notice");
  const [analysisMode, setAnalysisMode] =
  useState<"gemini" | "openai" | "demo-fallback">("gemini");
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [draft, setDraft] = useState(
    "I am providing the requested supporting information and documentary evidence in response to the communication for the assessment year 2025-26. The attached documents relate to the claim identified in the notice. I request that the submitted information be considered as part of the review."
  );
  const [editedDraft, setEditedDraft] = useState(false);
  const [approved, setApproved] = useState(false);
  const [aisReason, setAisReason] = useState("");
  const [aisNote, setAisNote] = useState("");

  const progress = useMemo(() => {
    const index: Screen[] = [
      "home",
      "processing",
      "understood",
      "documents",
      "draft",
      "review",
      "submitted",
      "clarification",
      "resolved",
    ];
    return Math.max(0, index.indexOf(screen));
  }, [screen]);

  async function analyze(text: string) {
    setInputText(text);
    setScreen("processing");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error("Analysis request failed");

      const result = (await response.json()) as {
        facts: NoticeFacts;
        mode: "openai" | "demo-fallback";
      };

      setFacts(result.facts);
      setAnalysisMode(result.mode);
    } catch {
      setFacts(fallbackFacts);
      setAnalysisMode("demo-fallback");
    }

    setTimeout(() => setScreen("understood"), 550);
  }

  function selectDemo(kind: "notice" | "suspicious" | "ais") {
    setSelectedScenario(kind);

    if (kind === "notice") {
      analyze(syntheticNotice);
    } else if (kind === "suspicious") {
      setScreen("processing");
      setFacts({
        ...fallbackFacts,
        communicationType: "suspicious_message",
        riskLevel: "high",
        noticeType: "Unverified refund message",
        assessmentYear: "Not reliably identified",
        deadline: "2 hours (as claimed by the message)",
        issue: "The message urges immediate action through an external link.",
        requestedAction: "Do not click the link. Verify through the official Income Tax portal.",
        requestedDocuments: [],
        plainLanguage:
          "This message shows several suspicious signs. Do not click the link or share financial information through it.",
        whyReceived:
          "The message uses urgency, an external link, and a refund claim to pressure the recipient into acting quickly.",
        confidence: 0.92,
      });
      setAnalysisMode("demo-fallback");
      setTimeout(() => setScreen("understood"), 500);
    } else {
      setScreen("processing");
      setFacts({
        ...fallbackFacts,
        communicationType: "record_issue",
        riskLevel: "low",
        noticeType: "AIS record discrepancy",
        assessmentYear: "2025-26",
        deadline: "Not applicable in demo",
        issue: "A synthetic transaction appears unfamiliar to the taxpayer.",
        requestedAction: "Review the entry, select the reason for disagreement, and prepare feedback.",
        requestedDocuments: ["Any supporting record showing the transaction is incorrect"],
        plainLanguage:
          "You found a transaction in your tax information that you do not recognize. TaxLens helps you understand the entry and prepare feedback.",
        whyReceived:
          "The taxpayer has flagged the information as potentially incorrect or not belonging to them.",
        confidence: 0.94,
      });
      setAnalysisMode("demo-fallback");
      setTimeout(() => setScreen("understood"), 500);
    }
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setInputText(file.name);
    analyze(syntheticNotice);
  }

  function addDocument(name: string) {
    if (!uploadedDocs.includes(name)) {
      setUploadedDocs((docs) => [...docs, name]);
    }
  }

  function beginJourney() {
    selectDemo("notice");
  }

  function reset() {
    setScreen("home");
    setUploadedDocs([]);
    setInputText("");
    setEditedDraft(false);
    setApproved(false);
    setSelectedScenario("notice");
    setAnalysisMode("demo-fallback");
  }

  return (
    <main className={`site ${lowData ? "low-data" : ""}`}>
      <div className="emblem-watermark" aria-hidden="true">
        <img src="/emblem.png" alt="" />
      </div>

      <header className="topbar app-shell">
        <button className="brand-block" type="button" onClick={reset} aria-label="Back to TaxLens home">
          <span className="brand-mark" aria-hidden="true" />
          <span>
            <span className="brand-name">TaxLens</span>
            <span className="brand-meta">INDEPENDENT PROTOTYPE · SYNTHETIC DEMO</span>
          </span>
        </button>

        <button
          className={`low-data-toggle ${lowData ? "active" : ""}`}
          type="button"
          onClick={() => setLowData((value) => !value)}
          aria-pressed={lowData}
        >
          <span className="toggle-dot" />
          LOW-DATA
        </button>
      </header>

      {screen === "home" && (
        <>
          <section className="hero app-shell" aria-labelledby="hero-title">
            <p className="eyebrow">A MESSAGE FROM INCOME TAX</p>
            <h1 id="hero-title">
              Got a tax message?
              <br />
              <span>Understand it before you act.</span>
            </h1>
            <p className="hero-description">
              TaxLens turns confusing Income Tax communications into clear, guided next steps. Upload a notice,
              screenshot, or message and get a simple answer to what it means, what is required, and what to do next.
            </p>

            <div className="answer-strip" role="note">
              <span className="answer-label">TAXLENS IN THREE STEPS</span>
              <strong>VERIFY</strong>
              <span>→</span>
              <strong>UNDERSTAND</strong>
              <span>→</span>
              <strong>ACT</strong>
              <span className="answer-detail">Is it real? · What does it mean? · What do I do now?</span>
            </div>
          </section>

          <section className="actions app-shell" aria-label="Choose what you need help with">
            <button className="action-card" type="button" onClick={() => {
  setSelectedScenario("suspicious");
  setScreen("message-input");
}}>
              <span className="action-icon shield" aria-hidden="true"><span /></span>
              <span className="action-copy">
                <span className="action-topline"><span className="action-number">01</span><span className="action-eyebrow">SAFETY FIRST</span></span>
                <strong>Check a suspicious message</strong>
                <span>Found a refund, payment, or account message you don&apos;t trust? Check it before you click.</span>
              </span>
              <span className="action-arrow">↗</span>
            </button>

            <button className="action-card featured" type="button" onClick={() => setScreen("notice-input")} >
              <span className="action-icon document" aria-hidden="true"><span /></span>
              <span className="action-copy">
                <span className="action-topline"><span className="action-number">02</span><span className="action-eyebrow">MAIN JOURNEY</span></span>
                <strong>Understand a tax notice</strong>
                <span>See what the department is asking, why you received it, and what you need to do next.</span>
              </span>
              <span className="action-arrow">↗</span>
            </button>

            <button className="action-card" type="button" onClick={() => selectDemo("ais")}>
              <span className="action-icon record" aria-hidden="true"><span /></span>
              <span className="action-copy">
                <span className="action-topline"><span className="action-number">03</span><span className="action-eyebrow">YOUR RECORDS</span></span>
                <strong>Something in my tax records looks wrong</strong>
                <span>Found an unfamiliar or incorrect entry? Understand it and prepare the right feedback.</span>
              </span>
              <span className="action-arrow">↗</span>
            </button>
          </section>

          <section className="reviewer-demo app-shell">
            <div>
              <p className="micro-label">REVIEWER MODE</p>
              <h2>See the complete journey in about a minute.</h2>
              <p>Use a synthetic notice. No login, no personal information, no government connection.</p>
            </div>
            <button className="demo-button" type="button" onClick={beginJourney}>
              <span>Try a sample tax notice</span>
              <span aria-hidden="true">→</span>
            </button>
          </section>

          <div className="trust-strip app-shell">
            <span>NO SIGN-UP</span><i />
            <span>NO PAN</span><i />
            <span>NO AADHAAR</span><i />
            <span>NO OTP</span>
          </div>

          <footer className="footer app-shell">
            <div className="footer-rule" />
            <div className="footer-kicker">INDEPENDENT PROTOTYPE</div>
            <p>TaxLens is a hackathon prototype. It is not affiliated with or endorsed by the Income Tax Department and uses synthetic data plus mocked government services.</p>
          </footer>
        </>
      )}

      {screen !== "home" && (
        <section className="journey app-shell" aria-live="polite">
          <div className="journey-top">
            <button className="back-button" type="button" onClick={reset}>← TaxLens home</button>
            <div className="journey-progress" aria-label={`Step ${progress} of 8`}>
              <span className="progress-track"><span style={{ width: `${Math.min(100, Math.max(8, (progress / 8) * 100))}%` }} /></span>
              <span>{progress}/8</span>
            </div>
          </div>
          {screen === "message-input" && (
  <div className="journey-content narrow">
    <div className="result-kicker">
      STEP 1 · SHOW US THE MESSAGE
    </div>

    <h2>What did you receive?</h2>

    <p className="lead">
      Paste the message, upload a screenshot, or take a photo.
      TaxLens will check for suspicious signs and explain what to do next.
    </p>

    <div className="message-input-card">
      <p className="card-label">PASTE THE MESSAGE</p>

      <h3>Show us what worried you.</h3>

      <p className="input-helper">
        Paste the SMS, WhatsApp message, email, or other communication
        you received. You can also upload a screenshot.
      </p>

      <textarea
        id="suspicious-message"
        value={inputText}
        onChange={(event) => setInputText(event.target.value)}
        placeholder={`Example:
"Your Income Tax refund of ₹48,500 is pending.
Verify your bank account immediately by clicking
this link..."`}
        rows={9}
      />

      <div className="input-actions">
        <button
          className="primary-action"
          type="button"
          disabled={!inputText.trim()}
          onClick={() => {
            setScreen("processing");

            setTimeout(() => {
              setFacts({
                ...fallbackFacts,
                communicationType: "suspicious_message",
                riskLevel: "high",
                noticeType: "Unverified refund message",
                assessmentYear: "Not reliably identified",
                deadline: "2 hours (as claimed by the message)",
                issue:
                  "The message urges immediate action through an external link.",
                requestedAction:
                  "Do not click the link. Verify through the official Income Tax portal.",
                requestedDocuments: [],
                plainLanguage:
                  "This message shows several suspicious signs. Do not click the link or share financial information through it.",
                whyReceived:
                  "The message uses urgency, an external link, and a refund claim to pressure the recipient into acting quickly.",
                confidence: 0.92,
              });

              setAnalysisMode("demo-fallback");
              setScreen("understood");
            }, 900);
          }}
        >
          Check this message →
        </button>

        <label className="upload-action">
          📸 Upload screenshot
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            capture="environment"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (!file) return;

              setInputText(file.name);
              setScreen("processing");

              setTimeout(() => {
                setFacts({
                  ...fallbackFacts,
                  communicationType: "suspicious_message",
                  riskLevel: "high",
                  noticeType: "Unverified refund message",
                  assessmentYear: "Not reliably identified",
                  deadline: "2 hours (as claimed by the message)",
                  issue:
                    "The message urges immediate action through an external link.",
                  requestedAction:
                    "Do not click the link. Verify through the official Income Tax portal.",
                  requestedDocuments: [],
                  plainLanguage:
                    "This message shows several suspicious signs. Do not click the link or share financial information through it.",
                  whyReceived:
                    "The message uses urgency, an external link, and a refund claim to pressure the recipient into acting quickly.",
                  confidence: 0.92,
                });

                setAnalysisMode("demo-fallback");
                setScreen("understood");
              }, 900);
            }}
          />
        </label>
      </div>
    </div>

    <button
      type="button"
      className="demo-link"
      onClick={() => selectDemo("suspicious")}
    >
      Try a synthetic suspicious message →
    </button>
  </div>
)}
  <div className="journey-content narrow">
    <div className="result-kicker">
      STEP 1 · SHOW US THE MESSAGE
    </div>

    <h2>What did you receive?</h2>

    <p className="lead">
      Paste the message, upload a screenshot, or take a photo.
      TaxLens will look for suspicious signs and explain what to do next.
    </p>

    <div className="message-input-card">
      <label htmlFor="suspicious-message" className="card-label">
        PASTE THE MESSAGE
      </label>

      <textarea
        id="suspicious-message"
        value={inputText}
        onChange={(event) => setInputText(event.target.value)}
        placeholder="Paste an SMS, WhatsApp message, email, or other communication here..."
        rows={7}
      />

      <div className="input-actions">
        <button
          className="primary-action"
          type="button"
          disabled={!inputText.trim()}
          onClick={() => {
            setScreen("processing");

            setTimeout(() => {
              setFacts({
                ...fallbackFacts,
                communicationType: "suspicious_message",
                riskLevel: "high",
                noticeType: "Unverified refund message",
                assessmentYear: "Not reliably identified",
                deadline: "2 hours (as claimed by the message)",
                issue:
                  "The message urges immediate action through an external link.",
                requestedAction:
                  "Do not click the link. Verify through the official Income Tax portal.",
                requestedDocuments: [],
                plainLanguage:
                  "This message shows several suspicious signs. Do not click the link or share financial information through it.",
                whyReceived:
                  "The message uses urgency, an external link, and a refund claim to pressure the recipient into acting quickly.",
                confidence: 0.92,
              });

              setAnalysisMode("demo-fallback");
              setScreen("understood");
            }, 900);
          }}
        >
          Check this message →
        </button>

        <label className="secondary-action upload-action">
          📸 Upload screenshot
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            capture="environment"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;

              setInputText(file.name);
              setScreen("processing");

              setTimeout(() => {
                setFacts({
                  ...fallbackFacts,
                  communicationType: "suspicious_message",
                  riskLevel: "high",
                  noticeType: "Unverified refund message",
                  assessmentYear: "Not reliably identified",
                  deadline: "2 hours (as claimed by the message)",
                  issue:
                    "The message urges immediate action through an external link.",
                  requestedAction:
                    "Do not click the link. Verify through the official Income Tax portal.",
                  requestedDocuments: [],
                  plainLanguage:
                    "This message shows several suspicious signs. Do not click the link or share financial information through it.",
                  whyReceived:
                    "The message uses urgency, an external link, and a refund claim to pressure the recipient into acting quickly.",
                  confidence: 0.92,
                });

                setAnalysisMode("demo-fallback");
                setScreen("understood");
              }, 900);
            }}
          />
        </label>
      </div>
    </div>

    <button
      type="button"
      className="demo-link"
      onClick={() => selectDemo("suspicious")}
    >
      Try a synthetic suspicious message →
    </button>
  </div>
           {screen === "notice-input" && (
  <div className="journey-content">
    <div className="result-kicker">
      STEP 1 · SHOW US THE NOTICE
    </div>

    <h2>What did the Income Tax Department send you?</h2>

    <p className="lead">
      Take a photo or upload a copy of the notice. TaxLens will read it,
      explain what it means, and guide you through what to do next.
    </p>

    <div className="notice-upload-card">
      <div className="upload-visual" aria-hidden="true">
        📄
      </div>

      <p className="card-label">YOUR TAX NOTICE</p>

      <h3>Upload a photo or document</h3>

      <p className="upload-description">
        Make sure the notice is clear and all important text is visible.
        You don't need to type it out yourself.
      </p>

      <div className="notice-upload-actions">
        <label className="primary-action upload-main">
          📷 Take / upload photo
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            hidden
            onChange={async (event) => {
              const file = event.target.files?.[0];

              if (!file) return;

              setInputText(file.name);
              setScreen("processing");

              try {
                const formData = new FormData();
                formData.append("file", file);

                const response = await fetch(
                  `${process.env.NEXT_PUBLIC_API_BASE}/cases/from-image`,
                  {
                    method: "POST",
                    body: formData,
                  }
                );

                if (!response.ok) {
                  throw new Error("Unable to analyze notice.");
                }

                const result = await response.json();

                if (result?.facts) {
                  setFacts(result.facts);
                }

                setAnalysisMode("gemini");

                setTimeout(() => {
                  setScreen("understood");
                }, 700);
              } catch (error) {
                console.error(error);

                setFacts(fallbackFacts);
                setAnalysisMode("demo-fallback");

                setTimeout(() => {
                  setScreen("understood");
                }, 700);
              }
            }}
          />
        </label>

        <label className="secondary-action upload-secondary">
          📄 Choose image
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={async (event) => {
              const file = event.target.files?.[0];

              if (!file) return;

              setInputText(file.name);
              setScreen("processing");

              try {
                const formData = new FormData();
                formData.append("file", file);

                const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_BASE}/cases/from-image`,
  {
    method: "POST",
    body: formData,
  }
);

                if (!response.ok) {
                  throw new Error("Unable to analyze notice.");
                }

                const result = await response.json();

                if (result?.facts) {
                  setFacts(result.facts);
                }

                setAnalysisMode("gemini");

                setTimeout(() => {
                  setScreen("understood");
                }, 700);
              } catch (error) {
                console.error(error);

                setFacts(fallbackFacts);
                setAnalysisMode("demo-fallback");

                setTimeout(() => {
                  setScreen("understood");
                }, 700);
              }
            }}
          />
        </label>
      </div>

      <div className="upload-tip">
        <strong>Tip:</strong> Keep all four corners of the notice visible.
      </div>
    </div>

    <button
      type="button"
      className="demo-link"
      onClick={() => selectDemo("notice")}
    >
      Use a synthetic notice instead →
    </button>
  </div>
)}
          {screen === "processing" && (
            <div className="center-state">
              <p className="eyebrow">
  {selectedScenario === "notice"
    ? "READING YOUR TAX NOTICE"
    : selectedScenario === "suspicious"
      ? "CHECKING YOUR MESSAGE"
      : "REVIEWING YOUR TAX RECORD"}
</p>

<h2>
  {selectedScenario === "notice"
    ? "We're reading what matters."
    : selectedScenario === "suspicious"
      ? "We're checking for warning signs."
      : "We're looking at the information."}
</h2>
              <p>TaxLens is identifying the communication, important dates, what is being requested, and what you may need next.</p>
              <div className="analysis-list">
                <span>✓ Reading the communication</span>
                <span>✓ Identifying the issue</span>
                <span>● Finding the next steps</span>
                <span>○ Checking the required evidence</span>
              </div>
            </div>
          )}

          {screen === "understood" && (
            <div className="journey-content">
              <div className="result-kicker">
                <span className={facts.riskLevel === "high" ? "risk-dot danger" : "risk-dot"} />
                {facts.riskLevel === "high" ? "POTENTIALLY SUSPICIOUS" : "NOTICE UNDERSTOOD"}
              </div>

              <h2>Here&apos;s what it actually means.</h2>

              <div className="result-grid">
                <article className="result-card primary">
                  <p className="card-label">IN SIMPLE WORDS</p>
                  <p className="big-copy">{facts.plainLanguage}</p>
                  <div className="source-note">
                    <span>Based on the communication you provided.</span>
                    <button type="button">Why we think this ↗</button>
                  </div>
                </article>

                <article className="result-card">
                  <p className="card-label">WHAT THEY&apos;RE ASKING</p>
                  <h3>{facts.issue}</h3>
                  <p className="muted">{facts.requestedAction}</p>
                </article>
              </div>

              <div className="facts-row">
  {selectedScenario === "ais" ? (
    <>
      <div>
        <span>REPORTED ITEM</span>
        <strong>Unfamiliar transaction</strong>
      </div>

      <div>
        <span>ASSESSMENT YEAR</span>
        <strong>{facts.assessmentYear}</strong>
      </div>

      <div>
        <span>AMOUNT</span>
        <strong>₹1,20,000</strong>
      </div>
    </>
  ) : (
    <>
      <div>
        <span>COMMUNICATION</span>
        <strong>{facts.noticeType}</strong>
      </div>

      <div>
        <span>ASSESSMENT YEAR</span>
        <strong>{facts.assessmentYear}</strong>
      </div>

      <div>
        <span>RESPONSE BY</span>
        <strong>{facts.deadline}</strong>
      </div>
    </>
  )}
</div>

              {facts.riskLevel === "high" ? (
  <div className="warning-panel">
    <div>
      <p className="card-label">SAFETY FIRST</p>

      <h3>Don&apos;t click or pay through the message.</h3>

      <p>
        {facts.whyReceived} Verify any genuine communication through
        the official Income Tax portal.
      </p>
    </div>

    <button
      className="primary-action"
      type="button"
      onClick={reset}
    >
      Back to TaxLens
    </button>
  </div>
) : selectedScenario === "ais" ? (
  <>
    <div className="plain-language-panel">
      <div>
        <p className="card-label">
          WHAT YOU TOLD US → WHAT WE&apos;LL HELP WITH
        </p>

        <p>
          &quot;I don&apos;t recognize this transaction.&quot;
        </p>
      </div>

      <div className="human-box">
        <span>WHAT HAPPENS NEXT</span>

        <strong>
          We&apos;ll help you describe why this entry looks wrong
          and prepare your feedback.
        </strong>
      </div>
    </div>

    <div className="next-step-panel">
      <div>
        <p className="card-label">YOUR NEXT STEP</p>

        <h3>Tell us what looks wrong.</h3>

        <p>
          You don&apos;t need to know tax terminology. We&apos;ll guide
          you through the reason for your disagreement.
        </p>
      </div>

      <button
        className="primary-action"
        type="button"
        onClick={() => setScreen("ais-feedback")}
      >
        Tell us what&apos;s wrong →
      </button>
    </div>
  </>
) : (
  <>
    <div className="plain-language-panel">
      <div>
        <p className="card-label">
          GOVERNMENT WORDING → HUMAN LANGUAGE
        </p>

        <p>
          &quot;You are hereby required to furnish documentary evidence
          in respect of the claim mentioned in the communication.&quot;
        </p>
      </div>

      <div className="human-box">
        <span>PLAIN LANGUAGE</span>

        <strong>
          They want proof supporting the claim in your return.
        </strong>
      </div>
    </div>

    <div className="next-step-panel">
      <div>
        <p className="card-label">YOUR NEXT STEP</p>

        <h3>Collect the requested documents.</h3>

        <p>
          No government form numbers to remember. We&apos;ll guide
          you through what is missing.
        </p>
      </div>

      <button
        className="primary-action"
        type="button"
        onClick={() => setScreen("documents")}
      >
        Show me what I need →
      </button>
    </div>
  </>
)}

              <div className="mode-note">Analysis mode: {analysisMode === "openai" ? "OpenAI" : "synthetic demo fallback"}. No real taxpayer data is stored.</div>
            </div>
          )}
          {screen === "ais-feedback" && (
  <div className="journey-content narrow">
    <div className="result-kicker">
      STEP 2 · TELL US WHAT&apos;S WRONG
    </div>

    <h2>What is wrong with this entry?</h2>

    <p className="lead">
      Choose the reason that best describes the problem.
      You can add a short explanation if you want.
    </p>

    <div className="ais-options">
      {[
        "This isn't my transaction",
        "The amount is incorrect",
        "This entry appears duplicated",
        "I don't recognize the reporting source",
        "Something else",
      ].map((reason) => (
        <label
          key={reason}
          className={`ais-option ${
            aisReason === reason ? "selected" : ""
          }`}
        >
          <input
            type="radio"
            name="ais-reason"
            value={reason}
            checked={aisReason === reason}
            onChange={() => setAisReason(reason)}
          />

          <span>{reason}</span>
        </label>
      ))}
    </div>

    <div className="ais-note-card">
      <p className="card-label">
        OPTIONAL · ADD CONTEXT
      </p>

      <textarea
        value={aisNote}
        onChange={(event) => setAisNote(event.target.value)}
        placeholder="Tell us anything that may help explain why this entry looks incorrect..."
        rows={6}
      />
    </div>

    <div className="action-row">
      <button
        className="secondary-action"
        type="button"
        onClick={() => setScreen("understood")}
      >
        ← Back
      </button>

      <button
        className="primary-action"
        type="button"
        disabled={!aisReason}
        onClick={() => {
          setDraft(
            [
              "Feedback regarding an AIS entry:",
              `Reason: ${aisReason}`,
              aisNote.trim()
                ? `Additional context: ${aisNote.trim()}`
                : "Additional context: None provided.",
            ].join("\n\n")
          );

          setEditedDraft(false);
          setApproved(false);

          setScreen("draft");
        }}
      >
        Prepare my feedback →
      </button>
    </div>
  </div>
)}
          {screen === "documents" && (
            <div className="journey-content">
              <div className="result-kicker">STEP 2 · GET READY</div>
              <h2>Let&apos;s get your response ready.</h2>
              <p className="lead">TaxLens turns the request into a simple checklist. You only need to provide the missing evidence.</p>

              <div className="readiness-card">
                <div className="readiness-head">
                  <div><p className="card-label">RESPONSE READINESS</p><strong>{uploadedDocs.length === 0 ? "50" : "100"}%</strong></div>
                  <span>{uploadedDocs.length === 0 ? "One item still needed" : "Everything we need is here"}</span>
                </div>
                <div className="readiness-bar"><span style={{ width: `${uploadedDocs.length === 0 ? 50 : 100}%` }} /></div>

                <div className="checklist">
                  <div><span className="check">✓</span><span>Notice identified</span><b>Ready</b></div>
                  <div><span className="check">✓</span><span>Assessment year confirmed</span><b>Ready</b></div>
                  <div className={uploadedDocs.length === 0 ? "missing" : ""}>
                    <span className="check">{uploadedDocs.length === 0 ? "!" : "✓"}</span>
                    <span>Supporting payment evidence</span>
                    <b>{uploadedDocs.length === 0 ? "Missing" : "Ready"}</b>
                  </div>
                </div>
              </div>

              <div className="document-upload-card">
                <p className="card-label">UPLOAD SYNTHETIC DOCUMENT</p>
                <h3>Supporting payment evidence</h3>
                <p>For the demo, choose a synthetic document. TaxLens will check whether it appears relevant to the request.</p>
                <div className="document-buttons">
                  <button type="button" onClick={() => addDocument("Payment_Evidence_Demo.pdf")}>Use synthetic payment proof</button>
                  <button type="button" onClick={() => addDocument("Bank_Evidence_Demo.pdf")}>Use synthetic bank evidence</button>
                </div>
                {uploadedDocs.length > 0 && (
                  <div className="uploaded-state">✓ {uploadedDocs.join(" · ")} · appears relevant to this request.</div>
                )}
              </div>

              <div className="action-row">
                <button className="secondary-action" type="button" onClick={() => setScreen("understood")}>← Back</button>
                <button className="primary-action" type="button" disabled={uploadedDocs.length === 0} onClick={() => setScreen("draft")}>Prepare my response →</button>
              </div>
            </div>
          )}

          {screen === "draft" && (
            <div className="journey-content">
              <div className="result-kicker">STEP 3 · PREPARE</div>
              <h2>
  {selectedScenario === "ais"
    ? "We prepared your feedback."
    : "We prepared a draft response."}
</h2>
              <p className="lead">
  {selectedScenario === "ais"
    ? "TaxLens turned your explanation into a feedback draft. Review it before anything is submitted."
    : "TaxLens uses the notice, your selected evidence, and the prototype workflow rules. Nothing is submitted automatically."}
</p>

              <div className="draft-card">
                <div className="draft-head"><span>DRAFT RESPONSE</span><span>AI-ASSISTED</span></div>
                <textarea value={draft} onChange={(event) => { setDraft(event.target.value); setEditedDraft(true); }} aria-label="Draft response" />
                <div className="draft-footer">
                  <span>{editedDraft ? "Edited by citizen" : "Generated from the case"}</span>
                  <button type="button" onClick={() => alert("In the live product, this would open supporting source and case facts.")}>Why this draft? ↗</button>
                </div>
              </div>

              <div className="safety-banner">
                <strong>You decide what gets submitted.</strong>
                <span>TaxLens will not submit anything until you explicitly approve it.</span>
              </div>

              <div className="action-row">
                <button className="secondary-action" type="button" onClick={() => setScreen("documents")}>← Back</button>
                <button className="primary-action" type="button" onClick={() => setScreen("review")}>Review response →</button>
              </div>
            </div>
          )}

          {screen === "review" && (
            <div className="journey-content narrow">
              <div className="result-kicker">STEP 4 · CITIZEN APPROVAL</div>
              <h2>
  {selectedScenario === "ais"
    ? "Ready to submit your feedback?"
    : "Ready to submit?"}
</h2>
              <p className="lead">Review the response below. TaxLens does not submit consequential actions without your approval.</p>

              <div className="review-card">
               <p className="card-label">
  {selectedScenario === "ais"
    ? "YOUR FEEDBACK"
    : "YOUR RESPONSE"}
</p>
                <p>{draft}</p>
                <div className="review-checks">
                  <span>✓ Notice details checked</span>
                  {selectedScenario === "ais" ? (
  <>
    <span>✓ Reason for disagreement selected</span>
    <span>✓ Citizen explanation included</span>
    <span>✓ Citizen approval required</span>
  </>
) : (
  <>
    <span>✓ Notice details checked</span>
    <span>✓ Supporting evidence attached</span>
    <span>✓ Citizen approval required</span>
  </>
)}
                  <span>✓ Citizen approval required</span>
                </div>
              </div>

              <label className="approval-check">
                <input type="checkbox" id="approve" checked={approved} onChange={(event) => setApproved(event.target.checked)} />
                <span>I have reviewed this response and want to submit it in the synthetic demo.</span>
              </label>

              <div className="action-row">
                <button className="secondary-action" type="button" onClick={() => setScreen("draft")}>← Edit response</button>
                <button className="primary-action" type="button" disabled={!approved} onClick={() => setScreen("submitted")}>Approve & submit →</button>
              </div>
            </div>
          )}

          {screen === "submitted" && (
            <div className="journey-content">
              <div className="success-mark">✓</div>
              <div className="result-kicker">STEP 5 · SUBMITTED</div>
              <h2>
  {selectedScenario === "ais"
    ? "Your feedback is submitted."
    : "Your response is submitted."}
</h2>
              <p className="lead">
  Reference <strong>TL-DEMO-8421</strong>. The government
  connection is mocked, but the citizen journey is real and
  fully interactive.
</p>

              <div className="timeline-card">
                <div className="timeline-title"><span>YOUR CASE</span><span>TL-DEMO-8421</span></div>
                {["Communication received", "Notice understood", "Documents checked", selectedScenario === "ais"
  ? "Feedback prepared"
  : "Response prepared", "You approved it", "Response submitted"].map((item) => (
                  <div className="timeline-row" key={item}><span className="timeline-dot done">✓</span><span>{item}</span></div>
                ))}
                <div className="timeline-row active"><span className="timeline-dot">●</span><span>Waiting for department</span></div>
                <div className="timeline-row muted"><span className="timeline-dot">○</span><span>Further communication</span></div>
              </div>

              <div className="nothing-panel">
                <p className="card-label">WHAT DO I NEED TO DO NOW?</p>
                <h3>Nothing right now.</h3>
                <p>TaxLens turns a status into an action: wait until the case changes.</p>
              </div>

              <button className="primary-action full" type="button" onClick={() => setScreen("clarification")}>Simulate a department update →</button>
            </div>
          )}

          {screen === "clarification" && (
            <div className="journey-content">
              <div className="result-kicker">NEW UPDATE · CLARIFICATION</div>
              <h2>They need one more thing.</h2>
              <p className="lead">Instead of showing you another block of official wording, TaxLens explains exactly what changed.</p>

              <div className="clarification-grid">
                <article className="raw-message">
                  <p className="card-label">MOCK DEPARTMENT MESSAGE</p>
                  <p>&quot;Please furnish additional documentary evidence in respect of the aforementioned claim.&quot;</p>
                </article>
                <article className="result-card primary">
                  <p className="card-label">WHAT THIS MEANS</p>
                  <p className="big-copy">The department wants additional proof supporting the amount in your response.</p>
                  <p className="muted">You can respond from the same case. No need to start again.</p>
                </article>
              </div>

              <div className="next-step-panel">
                <div>
                  <p className="card-label">NEXT STEP</p>
                  <h3>Provide one more supporting document.</h3>
                  <p>Use the synthetic bank evidence for this demo.</p>
                </div>
                <button className="primary-action" type="button" onClick={() => setScreen("resolved")}>Provide clarification →</button>
              </div>
            </div>
          )}

          {screen === "resolved" && (
            <div className="journey-content">
              <div className="success-mark">✓</div>
              <div className="result-kicker">STEP 8 · RESOLVED</div>
              <h2>You&apos;ve reached the end of the journey.</h2>
              <p className="lead">The citizen saw the notice, understood it, prepared evidence, reviewed the response, submitted it, handled a clarification, and reached a resolved state.</p>

              <div className="final-grid">
                <div className="result-card primary">
                  <p className="card-label">WHAT TAXLENS DID</p>
                  <ul className="plain-list">
                    <li>Explained the communication in plain language.</li>
                    <li>Turned a government request into a checklist.</li>
                    <li>Used AI to draft and explain, not to act autonomously.</li>
                    <li>Kept the citizen in control of submission.</li>
                    <li>Explained the follow-up when the case changed.</li>
                  </ul>
                </div>
                <div className="result-card">
                  <p className="card-label">HOW IT SCALES</p>
                  <p className="muted">TaxLens is designed as a citizen experience layer over existing government workflows, with a deterministic state machine, curated guidance, safety checks, and replaceable service adapters.</p>
                </div>
              </div>

              <div className="final-quote">Government systems understand processes. Citizens understand problems. TaxLens connects the two.</div>

              <button className="primary-action full" type="button" onClick={reset}>Back to home</button>
            </div>
          )}

          {screen !== "processing" && (
            <div className="journey-disclaimer">Independent prototype · synthetic data · mock government services · not tax or legal advice</div>
          )}
        </section>
      )}
    </main>
  );
}
