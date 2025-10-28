/* eslint-disable @typescript-eslint/no-explicit-any */

// ⚠️ BỎ QUA axios CHO 3 API NÀY — dùng fetch với URL tuyệt đối để né baseURL/interceptor
const API_BASE = (import.meta.env.VITE_API_URL || "https://api.phgfloral.com/api").replace(/\/+$/, "");

export type SignTemplate = {
  id: number;
  code: string;
  name: string;
  shape: "oval" | "rect" | "roundrect" | "cloud" | "heart" | "ribbon";
  width_mm: number;
  height_mm: number;
  bleed_mm: number;
  style: any | null;
  export_prefs: any | null;
  created_at: string;
  updated_at: string;
};

export type PreviewRequest = {
  template_code: string;
  text: string;
  style?: any;
  font_size?: number;
  font_family?: string;
};

export type ExportPdfRequest = {
  text: string;
  template_codes: string[];
  // mở rộng khổ giấy
  paper?: "A3" | "A4" | "A5" | "A6" | "A7";
  style?: any;
  font_size?: number;
  font_family?: string;
};

export type ExportPdfResponse = {
  success: boolean;
  job_id?: number;
  pdf_path?: string;
  download_url?: string;
  message?: string;
};

// ---- helpers
function authHeaders(extra: Record<string, string> = {}) {
  const token = localStorage.getItem("token") || "";
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function parseJsonSafe(resp: Response) {
  const text = await resp.text();
  try {
    return JSON.parse(text);
  } catch {
    return { success: false, message: text || `HTTP ${resp.status}` };
  }
}

export const signMakerApi = {
  /** Lấy danh sách template (trả về mảng) */
  async getTemplates(): Promise<SignTemplate[]> {
    const url = `${API_BASE}/sign-maker/templates`;
    const resp = await fetch(url, { method: "GET", headers: authHeaders() });

    if (!resp.ok) {
      const j = await parseJsonSafe(resp);
      console.error("getTemplates failed:", resp.status, j);
      return [];
    }

    const data = await resp.json();
    if (data?.success && Array.isArray(data?.data)) {
      return data.data as SignTemplate[];
    }
    return [];
  },

  /** Preview 1 template_code → trả HTML (SVG) string hoặc null */
  async preview(req: PreviewRequest): Promise<string | null> {
    const url = `${API_BASE}/sign-maker/preview`;
    const resp = await fetch(url, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(req),
    });

    if (!resp.ok) {
      const j = await parseJsonSafe(resp);
      console.error("preview failed:", resp.status, j);
      return null;
    }

    const data = await resp.json();
    return data?.success && typeof data?.html === "string" ? (data.html as string) : null;
  },

  /** Export PDF → trả về { success, download_url?, message? } */
  async exportPdf(req: ExportPdfRequest): Promise<ExportPdfResponse> {
    const url = `${API_BASE}/sign-maker/export-pdf`;
    const resp = await fetch(url, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(req),
    });

    if (!resp.ok) {
      const j = await parseJsonSafe(resp);
      console.error("exportPdf failed:", resp.status, j);
      return { success: false, message: j?.message || `HTTP ${resp.status}` };
    }

    const data = await resp.json();
    return data as ExportPdfResponse;
  },
};
