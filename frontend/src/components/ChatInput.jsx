import { useState } from "react";
import { ArrowRight } from "lucide-react";

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState("");

  const submit = (e) => {
    e?.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
  };

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-full shadow-md flex items-center gap-2 px-4 py-2 mx-auto w-full max-w-3xl"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ex : Lyon → Annecy, 45 personnes, 12 juillet"
        disabled={disabled}
        className="flex-1 bg-transparent outline-none text-neo-text placeholder-neo-muted py-2"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="bg-neo-primary hover:bg-neo-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white p-2 rounded-full transition-colors"
        aria-label="Envoyer"
      >
        <ArrowRight size={18} />
      </button>
    </form>
  );
}
