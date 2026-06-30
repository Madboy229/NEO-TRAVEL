import { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

export default function ChatPanel({ messages, loading, onSend }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, loading]);

  const showWelcome = messages.length === 0;

  return (
    <section className="flex-1 flex flex-col h-full bg-neo-bg">
      <div className="px-8 py-4 text-sm text-neo-muted text-center">
        Votre chat <span className="opacity-50">▼</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-4">
        {showWelcome && <Welcome />}
        {!showWelcome &&
          messages.map((m) => <ChatMessage key={m.id} message={m} />)}
        {loading && (
          <div className="flex justify-start mb-4">
            <div className="bg-white text-neo-muted px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
              <span className="inline-flex gap-1">
                <Dot delay={0} />
                <Dot delay={150} />
                <Dot delay={300} />
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="px-8 pb-6 pt-2">
        <ChatInput onSend={onSend} disabled={loading} />
      </div>
    </section>
  );
}

function Welcome() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-neo-primary mb-4">
        Expliquez votre trajet, je m'occupe du reste
      </h2>
      <p className="text-neo-muted text-base leading-relaxed max-w-lg">
        Bonjour, je suis l'assistant Neotravel. Décrivez-moi votre trajet
        (villes, dates, passagers) et je prépare votre devis d'autocar.
      </p>
    </div>
  );
}

function Dot({ delay }) {
  return (
    <span
      className="inline-block w-2 h-2 bg-neo-muted rounded-full animate-bounce"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
