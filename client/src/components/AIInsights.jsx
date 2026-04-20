import { useState } from "react";

const promptSuggestions = [
  "Can I comfortably start a SIP this month?",
  "Which category should I reduce first?",
  "Build me a realistic monthly spending cap.",
  "How much emergency fund should I target?",
];

export default function AIInsights({
  hasFinanceData,
  isAnalyzing,
  messages,
  onAnalyze,
  onSendMessage,
  source,
}) {
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
    <section className="card copilot-card">
      <div className="card-header card-header-inline">
        <div>
          <span className="eyebrow">AI Copilot</span>
          <h2>Your personal finance strategist</h2>
          <p>Ask better questions about cash flow, savings rate, spending pressure, SIP planning, and budgeting decisions.</p>
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
                <div className="chat-bubble-content">Thinking through your income, expenses, and next best move...</div>
              </article>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          {hasFinanceData
            ? "Start with an AI review, then ask detailed follow-up questions about your budget, savings goals, and investing decisions."
            : "Add income and expense entries first, then start your AI finance conversation."}
        </div>
      )}

      <div className="suggestion-row">
        {promptSuggestions.map((prompt) => (
          <button
            className="prompt-chip"
            disabled={isAnalyzing || !hasFinanceData}
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
            disabled={isAnalyzing || !hasFinanceData}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={
              hasFinanceData
                ? "Ask about budget caps, savings targets, SIP affordability, emergency funds, or category decisions..."
                : "Add income and expenses to unlock personalized AI guidance..."
            }
            rows="3"
            value={draft}
          />
        </label>

        <button className="button button-secondary" disabled={isAnalyzing || !hasFinanceData || !draft.trim()} type="submit">
          Send Message
        </button>
      </form>
    </section>
  );
}
