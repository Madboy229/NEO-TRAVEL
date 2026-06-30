import ReactMarkdown from "react-markdown";

export default function ChatMessage({ message }) {
  const { role, text } = message;

  if (role === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-neo-primary text-white px-4 py-3 rounded-2xl rounded-br-sm max-w-[80%] whitespace-pre-wrap">
          {text}
        </div>
      </div>
    );
  }

  if (role === "assistant") {
    return (
      <div className="flex justify-start mb-4">
        <div className="bg-white text-neo-text px-4 py-3 rounded-2xl rounded-bl-sm max-w-[80%] shadow-sm prose-sm">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
              strong: ({ children }) => (
                <strong className="font-semibold text-neo-primary">{children}</strong>
              ),
              ul: ({ children }) => <ul className="my-2 ml-4 list-disc">{children}</ul>,
              li: ({ children }) => <li className="my-1">{children}</li>,
            }}
          >
            {text}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center mb-4">
      <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm border border-red-200">
        {text}
      </div>
    </div>
  );
}
