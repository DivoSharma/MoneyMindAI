import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, Sparkles } from "lucide-react";
import { formatCurrency } from "../lib/format";

const promptSuggestions = [
  "Can I comfortably start a SIP this month?",
  "Build me a realistic monthly spending cap.",
  "How much emergency fund should I target next?",
  "Which category should I reduce first to improve cash flow?",
];

export default function AIInsights({
  financeSnapshot,
  hasFinanceData,
  isAnalyzing,
  messages,
  onAnalyze,
  onSendMessage,
  source,
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }

    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isAnalyzing]);

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
    <section className="analysis-grid">
      <section className="glass-panel analysis-panel">
        <div className="analysis-header">
          <div>
            <span className="eyebrow">AI Analysis</span>
            <h2>MoneyMind Copilot</h2>
            <p>Ask questions the way you would in ChatGPT, but grounded in your own cash flow.</p>
          </div>

          <div className="analysis-header-actions">
            <span className="source-pill">{source === "groq" ? "Groq live model" : "Fallback finance coach"}</span>
            <button className="button button-primary" disabled={isAnalyzing} onClick={onAnalyze} type="button">
              {isAnalyzing ? "Thinking..." : messages.length > 0 ? "Refresh Review" : "Start Review"}
            </button>
          </div>
        </div>

        <div className="analysis-thread" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="analysis-empty">
              <div className="analysis-empty-icon">
                <Sparkles />
              </div>
              <h3>{hasFinanceData ? "Start with a portfolio-style review" : "Add income and expenses first"}</h3>
              <p>
                {hasFinanceData
                  ? "Ask about budget caps, overspending, SIP affordability, emergency funds, or whether your spending pattern is sustainable."
                  : "The AI gets much better once it can see how money comes in and where it goes."}
              </p>
            </div>
          ) : (
            <div className="chat-stream">
              {messages.map((message) => (
                <article
                  className={message.role === "user" ? "chat-row chat-row-user" : "chat-row chat-row-assistant"}
                  key={message.id}
                >
                  <div className="chat-avatar">{message.role === "user" ? "You" : <Bot size={16} />}</div>
                  <div className="chat-card">
                    <span className="chat-label">{message.role === "user" ? "You" : "MoneyMind AI"}</span>
                    <div className="chat-body">{message.content}</div>
                  </div>
                </article>
              ))}

              {isAnalyzing ? (
                <article className="chat-row chat-row-assistant">
                  <div className="chat-avatar">
                    <Bot size={16} />
                  </div>
                  <div className="chat-card">
                    <span className="chat-label">MoneyMind AI</span>
                    <div className="chat-body">Thinking through your cash flow, monthly buffer, and next best move...</div>
                  </div>
                </article>
              ) : null}
            </div>
          )}
        </div>

        <div className="analysis-composer">
          <div className="suggestion-row analysis-suggestions">
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

          <form className="analysis-form" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="analysis-input">
              Ask MoneyMind AI a finance question
            </label>
            <textarea
              disabled={isAnalyzing || !hasFinanceData}
              id="analysis-input"
              maxLength="1200"
              onChange={(event) => setDraft(event.target.value)}
              placeholder={
                hasFinanceData
                  ? "Ask about savings targets, category cuts, SIP vs FD, budgeting trade-offs, or your spending habits..."
                  : "Add income and expense entries to unlock personalized AI guidance..."
              }
              rows="3"
              value={draft}
            />
            <button
              aria-label="Send message"
              className="button button-primary analysis-send"
              disabled={isAnalyzing || !hasFinanceData || !draft.trim()}
              type="submit"
            >
              <ArrowUp size={18} />
            </button>
          </form>
        </div>
      </section>

      <aside className="glass-panel analysis-sidebar">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Context</span>
            <h3>Live finance snapshot</h3>
          </div>
        </div>

        <div className="analysis-stats">
          <div className="analysis-stat">
            <span>Monthly income</span>
            <strong>{formatCurrency(financeSnapshot.monthlyIncome)}</strong>
          </div>
          <div className="analysis-stat">
            <span>Monthly spend</span>
            <strong>{formatCurrency(financeSnapshot.monthlySpend)}</strong>
          </div>
          <div className="analysis-stat">
            <span>Monthly net</span>
            <strong>{formatCurrency(financeSnapshot.monthlyNet)}</strong>
          </div>
          <div className="analysis-stat">
            <span>Savings rate</span>
            <strong>{financeSnapshot.monthlyIncome > 0 ? `${financeSnapshot.savingsRate}%` : "--"}</strong>
          </div>
        </div>

        <div className="context-card">
          <span className="eyebrow">Best prompt right now</span>
          <p>
            {financeSnapshot.topExpense
              ? `Ask how to reduce ${financeSnapshot.topExpense.label} without disrupting your month.`
              : "Once you add more activity, the copilot will suggest more precise next questions."}
          </p>
        </div>

        <div className="context-card">
          <span className="eyebrow">How it thinks</span>
          <ul className="plain-list">
            <li>Spending pressure by category</li>
            <li>Monthly surplus or overspend</li>
            <li>Savings rate and buffer quality</li>
            <li>Emergency fund, FD, and SIP trade-offs</li>
          </ul>
        </div>
      </aside>
    </section>
  );
}
