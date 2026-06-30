import { useCallback, useRef, useState } from "react";
import { sendChatMessage, newSessionId } from "../services/n8nChat";

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [devis, setDevis] = useState(null);
  const sessionIdRef = useRef(newSessionId());

  const reset = useCallback(() => {
    sessionIdRef.current = newSessionId();
    setMessages([]);
    setError(null);
    setDevis(null);
  }, []);

  const send = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage = { id: crypto.randomUUID(), role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      const reply = await sendChatMessage({
        sessionId: sessionIdRef.current,
        message: trimmed,
      });
      const botMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: reply,
      };
      setMessages((prev) => [...prev, botMessage]);

      const parsedDevis = extractDevis(reply);
      if (parsedDevis) setDevis(parsedDevis);
    } catch (err) {
      setError(err.message);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "system",
          text: `Erreur de communication avec l'agent : ${err.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { messages, loading, error, devis, send, reset };
}

function extractDevis(text) {
  if (!text) return null;

  const httcMatch = text.match(/total\s*ttc\s*[:\-]?\s*\**?\s*([\d\s.,]+)\s*€/i);
  if (!httcMatch) return null;
  const refMatch = text.match(/(A\d{4}-\d{3,4})/i);

  const ht = text.match(/total\s*ht\s*[:\-]?\s*([\d\s.,]+)\s*€/i);
  const tva = text.match(/tva[^:]*[:\-]?\s*([\d\s.,]+)\s*€/i);
  const trajet = text.match(/trajet\s*[:\-]?\s*([A-Za-zÀ-ſ\s]+(?:→|->|to|vers)[A-Za-zÀ-ſ\s]+)/i);
  const date = text.match(/(\d{1,2}\s+(?:janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[ée]cembre)\s+\d{4})/i);
  const pax = text.match(/(\d+)\s+(?:passagers?|personnes?)/i);

  return {
    reference: refMatch?.[1] ?? "En cours…",
    totalHT: cleanNumber(ht?.[1]),
    tva: cleanNumber(tva?.[1]),
    totalTTC: cleanNumber(httcMatch[1]),
    trajet: trajet?.[1]?.trim(),
    dateDepart: date?.[1],
    nbPassagers: pax?.[1] ? parseInt(pax[1], 10) : null,
  };
}

function cleanNumber(str) {
  if (!str) return null;
  const cleaned = str.replace(/\s/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}
