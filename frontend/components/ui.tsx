"use client";
import React from "react";
import {
  ArrowRight, ArrowLeft, Check, Clock, Circle, FileSearch,
  Sparkles, Loader2, AlertTriangle,
} from "lucide-react";

export const SERIF: React.CSSProperties = { fontFamily: "Georgia, 'Times New Roman', serif" };
export const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

type Tone = "neutral" | "signal" | "ok" | "warn";
const TONES: Record<Tone, string> = {
  neutral: "bg-white text-ink border border-ink/25",
  signal: "bg-signal text-paper",
  ok: "bg-emerald-100 text-emerald-900",
  warn: "bg-amber-100 text-amber-900",
};

export function Tag({ tone = "neutral", icon: Icon, children }: {
  tone?: Tone; icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode;
}) {
  return (
    <span className={cx(
      "inline-flex items-center gap-1.5 rounded-none px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]",
      TONES[tone]
    )}>
      {Icon && <Icon className="h-3 w-3" />}{children}
    </span>
  );
}

export const Chip = Tag;

export function Card({ children, className = "", flush = false }: {
  children: React.ReactNode; className?: string; flush?: boolean;
}) {
  return (
    <div className={cx("border-2 border-ink/25 bg-white", flush ? "" : "p-5", className)}>{children}</div>
  );
}

export function Primary({ children, onClick, disabled, loading, icon: Icon = ArrowRight }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; loading?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button onClick={onClick} disabled={disabled || loading}
      className="group flex w-full items-center justify-between gap-2 rounded-none bg-signal px-5 py-4 text-base font-bold uppercase tracking-wider text-paper transition-all duration-150 hover:bg-signal-600 active:scale-[0.985] focus:outline-none focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2 disabled:opacity-40 disabled:active:scale-100">
      <span className="text-left text-[15px] leading-tight">{children}</span>
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />}
    </button>
  );
}

export function Ghost({ children, onClick, icon: Icon }: {
  children: React.ReactNode; onClick?: () => void; icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 rounded-none border-2 border-ink/25 bg-white px-4 py-3 text-xs font-bold uppercase tracking-wider text-ink transition-all duration-150 hover:border-ink hover:bg-paper active:scale-[0.98] focus:outline-none focus-visible:outline-2 focus-visible:outline-signal">
      {Icon && <Icon className="h-4 w-4 text-signal" />}{children}
    </button>
  );
}

export function Mini({ label, value, tone = "ink" }: { label: string; value: string; tone?: "ink" | "signal" }) {
  return (
    <div className="border-2 border-ink/25 bg-white p-3">
      <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink/55">{label}</div>
      <div className={cx("mt-1 font-heading text-lg font-extrabold leading-none", tone === "signal" ? "text-signal" : "text-ink")}>{value}</div>
    </div>
  );
}

export function Seam({ label, extracted, plain, reduced }: {
  label: string; extracted: string; plain?: string; reduced?: boolean;
}) {
  return (
    <div className="border-2 border-ink/25 bg-white p-4">
      <div className="kicker mb-3">{label}</div>
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <Tag tone="neutral" icon={FileSearch}>From your notice</Tag>
        </div>
        <div className="pl-1 font-mono text-[13px] leading-relaxed text-ink">{extracted}</div>
        {plain && (
          <>
            <div className={cx("mt-1 flex items-start gap-2", !reduced && "transition")}>
              <Tag tone="signal" icon={Sparkles}>Explained</Tag>
            </div>
            <div className="border-l-4 border-signal bg-signal-50 py-2 pl-3 pr-2 text-[14px] leading-relaxed text-signal-800">{plain}</div>
          </>
        )}
      </div>
    </div>
  );
}

export function Scanning({ label }: { label: string }) {
  return (
    <div className="border-2 border-ink/25 bg-white p-6">
      <div className="relative h-1 w-full overflow-hidden bg-ink/10">
        <div className="absolute inset-y-0 left-0 h-full w-1/3 animate-[scan_1.2s_linear_infinite] bg-signal" />
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-signal-700">
        <Loader2 className="h-4 w-4 animate-spin" /> {label}
      </div>
      <style>{`@keyframes scan { 0% { transform: translateX(-100%) } 100% { transform: translateX(400%) } }`}</style>
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-start gap-3 border-2 border-signal bg-signal-50 p-4" role="alert">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-signal" />
      <div className="flex-1">
        <div className="kicker mb-1">Something went wrong</div>
        <div className="text-sm text-signal-800">{message}</div>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="rounded-none bg-signal px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-wider text-paper">Retry</button>
      )}
    </div>
  );
}

const SPINE = ["Verified", "Understood", "Docs ready", "Drafted", "Submitted", "Waiting"];
export function Spine({ active }: { active: number }) {
  return (
    <div className="border-2 border-ink/25 bg-white">
      <div className="grid grid-cols-6">
        {SPINE.map((s, i) => {
          const done = i < active, now = i === active;
          return (
            <div key={s} className={cx(
              "flex flex-col items-center gap-1 border-r border-ink/15 px-1 py-2 last:border-r-0",
              done && "bg-signal-50",
              now && "bg-signal text-paper",
            )}>
              <div className={cx("flex h-4 w-4 items-center justify-center",
                done ? "text-signal-700" : now ? "text-paper" : "text-ink/30")}>
                {done ? <Check className="h-3 w-3" /> : now ? <Clock className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
              </div>
              <div className={cx("text-[9px] font-bold uppercase tracking-[0.05em] leading-tight text-center",
                done ? "text-signal-700" : now ? "text-paper" : "text-ink/40")}>{s}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { ArrowLeft };