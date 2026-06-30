import {
  MessageSquare,
  FileSearch,
  Euro,
  History,
  UserCircle,
  Plus,
  LogIn,
} from "lucide-react";

const MENU_ITEMS = [
  { id: "chat", label: "Chat", icon: MessageSquare, active: true },
  { id: "demandes", label: "Mes demandes", icon: FileSearch },
  { id: "devis", label: "Mes devis", icon: Euro },
  { id: "historique", label: "Historique", icon: History },
  { id: "contact", label: "Contact", icon: UserCircle },
];

export default function Sidebar({ onNewChat }) {
  const handlePlaceholderClick = (label) => {
    alert(`${label} — fonctionnalité prévue en v2 du prototype.`);
  };

  return (
    <aside className="bg-neo-sidebar w-72 flex-shrink-0 flex flex-col p-6 border-r border-gray-200">
      <h1 className="text-2xl font-extrabold text-neo-primary tracking-tight mb-10">
        NEO TRAVEL
      </h1>

      <nav className="flex-1 flex flex-col gap-1">
        {MENU_ITEMS.map(({ id, label, icon: Icon, active }) => (
          <button
            key={id}
            onClick={() =>
              active ? null : handlePlaceholderClick(label)
            }
            className={
              "flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors " +
              (active
                ? "bg-neo-bg-light text-neo-primary font-semibold"
                : "text-neo-text hover:bg-neo-bg-light")
            }
          >
            <Icon size={20} strokeWidth={2} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <button
        onClick={onNewChat}
        className="flex items-center justify-center gap-2 mt-4 px-4 py-3 rounded-lg border-2 border-neo-primary text-neo-primary font-semibold hover:bg-neo-primary hover:text-white transition-colors"
      >
        <Plus size={18} />
        Nouveau chat
      </button>

      <button
        onClick={() => handlePlaceholderClick("Connexion")}
        className="flex items-center justify-center gap-2 mt-3 px-4 py-3 rounded-lg bg-neo-bg-light text-neo-text hover:bg-gray-100 transition-colors"
      >
        <LogIn size={18} />
        Connexion
      </button>
    </aside>
  );
}
