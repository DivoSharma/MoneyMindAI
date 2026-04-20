import { useState } from "react";

const promptSuggestions = [
  "How do I reduce shopping spend next month?",
  "Can I afford a SIP right now?",
  "Give me a weekly budget plan.",
];

export default function AIInsights({ hasExpenses, isAnalyzing, messages, onAnalyze, onSendMessage, source }) {
  const [draft, setDraft] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }

    setDraft("");
    await onSendMessage(trimmed);
  }

  return (
    <section className="card insights-card">
      <div className="card-header card-header-inline">
        <div>
          <span className="eyebrow">AI Copilot</span>
          <h2>Chat about your money</h2>
          <p>Ask smarter follow-up questions about habits, savings targets, budgets, and investing.</p>
        </div>

        <button className="button button-primary" disabled={isAnalyzing} onClick={onAnalyze} type="button">
          {isAnalyzing ? "Thinking..." : messages.length > 0 ? "Refresh AI Review" : "Start AI Review"}
        </button>
      </div>

      {messages.length > 0 ? (
        <div className="chat-shell">
          <div className="insights-meta">
            <span>{source === "groq" ? "Powered by Groq" : "Fallback finance coach"}</span>
          </div>

          <div className="chat-thread">
            {messages.map((message) => (
              <article
                className={message.role === "user" ? "chat-message user-message" : "chat-message assistant-message"}
                key={message.id}
              >
                <span className="chat-role">{message.role === "user" ? "You" : "MoneyMind AI"}</span>
                <div className="chat-bubble-content">{message.content}</div>
              </article>
            ))}

            {isAnalyzing ? (
              <article className="chat-message assistant-message">
                <span className="chat-role">MoneyMind AI</span>
                <div className="chat-bubble-content">Thinking through your finances...</div>
              </article>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          {hasExpenses
            ? "Start an AI review to get a personalized summary, then keep chatting about budgets, savings, and investment ideas."
            : "Add a few expenses first, then start your AI finance chat."}
        </div>
      )}

      <div className="suggestion-row">
        {promptSuggestions.map((prompt) => (
          <button
            className="prompt-chip"
            disabled={isAnalyzing || !hasExpenses}
            key={prompt}
            onClick={() => onSendMessage(prompt)}
            type="button"
          >
            {prompt}
          </button>
        ))}
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <label className="chat-input-wrap">
          <span className="sr-only">Ask MoneyMind AI a finance question</span>
          <textarea
            disabled={isAnalyzing || !hasExpenses}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={
              hasExpenses
                ? "Ask about your budget, savings target, SIP amount, or a specific category..."
                : "Add some expenses to unlock AI chat..."
            }
            rows="3"
            value={draft}
          />
        </label>

        <button className="button button-secondary" disabled={isAnalyzing || !hasExpenses || !draft.trim()} type="submit">
          Send Message
        </button>
      </form>
    </section>
  );
}
