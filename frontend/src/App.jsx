import Sidebar from "./components/Sidebar";
import ChatPanel from "./components/ChatPanel";
import DevisPreview from "./components/DevisPreview";
import { useChat } from "./hooks/useChat";

export default function App() {
  const { messages, loading, devis, send, reset } = useChat();

  return (
    <div className="flex h-screen w-screen bg-neo-bg">
      <Sidebar onNewChat={reset} />
      <ChatPanel messages={messages} loading={loading} onSend={send} />
      <DevisPreview devis={devis} />
    </div>
  );
}
