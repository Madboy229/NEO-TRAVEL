// Client pour le webhook Chat Trigger n8n.

const CHAT_URL = import.meta.env.VITE_N8N_CHAT_URL;

export async function sendChatMessage({ sessionId, message }) {
  if (!CHAT_URL) {
    throw new Error(
      "VITE_N8N_CHAT_URL n'est pas configurée. Crée un fichier frontend/.env (basé sur .env.example) avec l'URL du Chat Trigger n8n."
    );
  }

  const res = await fetch(CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "sendMessage",
      sessionId,
      chatInput: message,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`n8n HTTP ${res.status} — ${body}`);
  }

  const data = await res.json();
  if (typeof data === "string") return data;
  return data.output ?? data.text ?? data.response ?? JSON.stringify(data);
}

export function newSessionId() {
  return crypto.randomUUID();
}
