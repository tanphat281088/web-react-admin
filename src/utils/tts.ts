// src/utils/tts.ts
/* Vietnamese TTS helper using Web Speech API.
   - canSpeak(): kiểm tra khả dụng
   - setPreferredVoiceName(name): cố định 1 giọng (lưu localStorage)
   - speakVi(text, { interrupt }): đọc tiếng Việt, tự chọn giọng ưu tiên
   - buildDeliverySpeech(): tạo câu nhắc cho đơn giao
*/

const PREF_KEY = "tts_voice_name";

/** Có hỗ trợ Web Speech API không */
export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Lưu tên giọng ưa thích (ví dụ "Microsoft Hien Online (Natural)") */
export function setPreferredVoiceName(name: string) {
  try {
    localStorage.setItem(PREF_KEY, name || "");
  } catch {
    // noop
  }
}

/** Lấy tên giọng ưa thích đã lưu */
function getPreferredVoiceName(): string {
  try {
    return localStorage.getItem(PREF_KEY) || "";
  } catch {
    return "";
  }
}

/** Đợi đến khi voices load xong (Chrome đôi khi trả mảng rỗng) */
async function ensureVoicesLoaded(timeoutMs = 1500): Promise<void> {
  if (!canSpeak()) return;
  const synth = window.speechSynthesis;
  const ready = () => (synth.getVoices() || []).length > 0;

  if (ready()) return;

  await new Promise<void>((resolve) => {
    const t = setTimeout(() => resolve(), timeoutMs);
    const handler = () => {
      if (ready()) {
        clearTimeout(t);
        synth.onvoiceschanged = null;
        resolve();
      }
    };
    synth.onvoiceschanged = handler;
    // kích hoạt 1 vòng tick
    synth.getVoices();
  });
}

/** Chọn giọng: 1) giọng đã lưu; 2) vi-VN; 3) giọng có 'vi'; 4) giọng đầu tiên */
function pickVoice(): SpeechSynthesisVoice | null {
  const synth = window.speechSynthesis;
  const voices = synth.getVoices() || [];
  const wanted = getPreferredVoiceName();

  return (
    voices.find((v) => v.name === wanted) ||
    voices.find((v) => /vi[-_]VN/i.test(v.lang)) ||
    voices.find((v) => /viet/i.test(v.name) || /(^|[^a-z])vi([^a-z]|$)/i.test(v.lang)) ||
    voices[0] ||
    null
  );
}

/** Đọc tiếng Việt. interrupt=true: huỷ queue hiện tại trước khi nói */
export async function speakVi(
  text: string,
  opts: { interrupt?: boolean } = { interrupt: true }
) {
  if (!canSpeak() || !text) return;

  await ensureVoicesLoaded();

  const synth = window.speechSynthesis;
  const utter = new SpeechSynthesisUtterance(text);

  const voice = pickVoice();
  if (voice) utter.voice = voice;

  // cấu hình mặc định dễ nghe
  utter.rate = 1;
  utter.pitch = 1;
  utter.volume = 1;

  // (tuỳ chọn) log chẩn đoán:
  // utter.onstart = () => console.log("[TTS] start", utter.voice?.name, utter.voice?.lang);
  // utter.onend   = () => console.log("[TTS] end");
  // utter.onerror = (e) => console.warn("[TTS] error", e);

  if (opts.interrupt) synth.cancel(); // tránh chồng tiếng
  // Thêm 1 khung thời gian ngắn để đảm bảo cancel() hoàn tất
  setTimeout(() => synth.speak(utter), 60);
}

/** Tạo nội dung đọc cho đơn giao (tuỳ biến câu ở đây) */
export function buildDeliverySpeech(opts: {
  maDon?: string | null;
  nguoiNhan?: string | null;
  gio?: string | null;      // "HH:mm"
  diaChi?: string | null;
  brand?: string;           // tuỳ chọn: tiền tố thương hiệu
}) {
  const {
    maDon,
    nguoiNhan,
    gio,
    diaChi,
    brand = "Phát Hoàng Gia Floral & Decor",
  } = opts;

  // Bạn có thể tuỳ biến template theo style của bạn:
  return [
    `${brand} nhắc giao hàng.`,
    maDon ? `Đơn ${maDon}.` : "",
    gio ? `Giao lúc ${gio}.` : "",
    nguoiNhan ? `Người nhận: ${nguoiNhan}.` : "",
    diaChi ? `Địa chỉ: ${diaChi}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}
