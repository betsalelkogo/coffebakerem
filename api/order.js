const MAX_NAME = 80;
const MAX_PHONE = 20;
const MAX_NOTES = 500;
const MAX_SUMMARY = 1000;
const MAX_TOTAL = 10000;
const PAYMENT_METHODS = new Set(["Bit", "Paybox"]);
const TELEGRAM_TIMEOUT_MS = 8000;

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function asTrimmedString(value, max) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) {
    return null;
  }
  return trimmed;
}

function parseOrder(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const name = asTrimmedString(body.name, MAX_NAME);
  const phone = asTrimmedString(body.phone, MAX_PHONE);
  const summary = asTrimmedString(body.summary, MAX_SUMMARY);
  const paymentMethod = asTrimmedString(body.paymentMethod, 20);
  const notes =
    typeof body.notes === "string" ? body.notes.trim().slice(0, MAX_NOTES) : "";
  const total = Number(body.total);

  if (!name || !phone || !summary || !PAYMENT_METHODS.has(paymentMethod)) {
    return null;
  }

  if (!Number.isInteger(total) || total < 1 || total > MAX_TOTAL) {
    return null;
  }

  if (!/^[0-9+\-\s()]{7,20}$/.test(phone)) {
    return null;
  }

  return { name, phone, notes, summary, total, paymentMethod };
}

function formatOrderMessage(order) {
  return [
    "הזמנה חדשה – קפה בכרם",
    "",
    order.summary,
    "",
    `סה״כ: ₪${order.total}`,
    "",
    `שם: ${order.name}`,
    `טלפון: ${order.phone}`,
    order.notes ? `הערות: ${order.notes}` : "",
    "",
    `תשלום: ${order.paymentMethod}`,
    "ממתין לתשלום",
  ]
    .filter((line, index, lines) => line !== "" || lines[index - 1] !== "")
    .join("\n");
}

function telegramToken() {
  const token = process.env.TELEGRAM_BOT || process.env.TELEGRAM_BOT_TOKEN || "";
  return token.trim();
}

async function fetchTelegram(token, method, payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TELEGRAM_TIMEOUT_MS);

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function resolveChatId(token) {
  const configured = (process.env.TELEGRAM_CHAT_ID || "").trim();
  if (/^-?\d+$/.test(configured)) {
    return configured;
  }

  const data = await fetchTelegram(token, "getUpdates", { limit: 10 });
  const updates = Array.isArray(data?.result) ? data.result : [];

  for (let i = updates.length - 1; i >= 0; i -= 1) {
    const chatId = updates[i]?.message?.chat?.id;
    if (chatId != null) {
      return String(chatId);
    }
  }

  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    json(res, 405, { ok: false });
    return;
  }

  const token = telegramToken();
  if (!token) {
    json(res, 503, { ok: false });
    return;
  }

  const order = parseOrder(req.body);
  if (!order) {
    json(res, 400, { ok: false });
    return;
  }

  try {
    const chatId = await resolveChatId(token);
    if (!chatId) {
      json(res, 503, { ok: false });
      return;
    }

    const result = await fetchTelegram(token, "sendMessage", {
      chat_id: chatId,
      text: formatOrderMessage(order),
      disable_web_page_preview: true,
    });

    if (!result?.ok) {
      json(res, 502, { ok: false });
      return;
    }

    json(res, 200, { ok: true });
  } catch {
    json(res, 502, { ok: false });
  }
}
