// Typed client for the TaxLens backend. Shapes mirror backend/app/schemas.
const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export type Provenance = { origin: "extracted" | "interpreted" | "rule" | "citizen" | "document"; detail: string };
export type Issue = { topic: string; amount?: number | null; questioned_amount?: number | null };
export type Extraction = {
  notice_type: string;
  assessment_year: string;
  deadline?: string | null;
  issues: Issue[];
  requested_documents: string[];
  confidence: number;
  provenance: Provenance[];
};
export type RequiredDoc = {
  doc_id: string; label: string; formal_label: string; present: boolean; reason_if_missing?: string | null;
};
export type CaseView = {
  case_id: string;
  state: string;
  state_meaning: string;
  notice_preview: string;
  extraction: Extraction | null;
  required_documents: RequiredDoc[];
  readiness: number;
  draft: { body: string; provenance: Provenance[]; approved: boolean } | null;
  submission_ref: string | null;
  clarification_explanation?: string;
};
export type Risk = { risk_level: "LOW" | "MEDIUM" | "HIGH"; reasons: string[]; advice: string[] };
export type AisItem = { ais_id: string; reported_by: string; type: string; amount: number; reported_date: string };

class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError(0, "Can't reach the TaxLens service. Is the backend running?");
  }
  if (!res.ok) throw new ApiError(res.status, `${path} failed (${res.status})`);
  return res.json();
}

const post = <T,>(p: string, body?: unknown) =>
  req<T>(p, { method: "POST", body: body ? JSON.stringify(body) : undefined });
const get = <T,>(p: string) => req<T>(p);

export const api = {
  health: () => get<{ status: string; ai_mode: string }>("/health"),
    createCase: (notice_text?: string) => post<CaseView>("/cases", notice_text ? { notice_text } : undefined),
  createCaseFromImage: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE}/cases/from-image`, { method: "POST", body: form });
    if (!res.ok) {
      let message = `Notice image analysis failed (${res.status})`;
      try {
        const body = await res.json();
        if (body?.detail) message = body.detail;
      } catch { /* keep default */ }
      throw new ApiError(res.status, message);
    }
    return res.json() as Promise<CaseView & { analysis_mode: string }>;
  },
  getCase: (id: string) => get<CaseView>(`/cases/${id}`),
  uploadDoc: (id: string, doc_id: string) => post<CaseView>(`/cases/${id}/documents`, { doc_id }),
  draft: (id: string) => post<CaseView>(`/cases/${id}/draft`),
  submit: (id: string, approved: boolean) => post<CaseView>(`/cases/${id}/submit`, { approved }),
  requestClarification: (id: string) => post<CaseView>(`/cases/${id}/clarification/request`),
  submitClarification: (id: string, citizen_response: string) =>
    post<CaseView>(`/cases/${id}/clarification/submit`, { citizen_response }),
  checkMessage: (text: string) => post<Risk>("/messages/check", { text }),
  aisSample: () => get<AisItem>("/ais/sample"),
  aisFeedback: (ais_id: string, reason: string) => post<{ feedback_id: string; status: string }>("/ais/feedback", { ais_id, reason }),
  reset: () => post<{ status: string }>("/demo/reset"),
};
export { ApiError };
