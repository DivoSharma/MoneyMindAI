import { useEffect, useMemo, useState } from "react";
import { Bot, Filter, Sparkles } from "lucide-react";
import { buildEntryPrompt, getMergedActivity } from "../lib/finance";
import { formatCurrency, formatDate } from "../lib/format";

const filterOptions = ["all", "income", "expense"];

export default function ActivityFeed({ expenses, incomes, error, isLoading, onAskAboutEntry }) {
  const activity = useMemo(() => getMergedActivity(expenses, incomes), [expenses, incomes]);
  const [filter, setFilter] = useState("all");
  const [contextMenu, setContextMenu] = useState(null);

  const filteredActivity = activity.filter((entry) => filter === "all" || entry.entryType === filter);

  useEffect(() => {
    function handleClose() {
      setContextMenu(null);
    }

    window.addEventListener("click", handleClose);
    window.addEventListener("resize", handleClose);
    window.addEventListener("scroll", handleClose, true);

    return () => {
      window.removeEventListener("click", handleClose);
      window.removeEventListener("resize", handleClose);
      window.removeEventListener("scroll", handleClose, true);
    };
  }, []);

  function openContextMenu(event, entry) {
    event.preventDefault();
    setContextMenu({
      entry,
      x: event.clientX,
      y: event.clientY,
    });
  }

  return (
    <section className="glass-panel feed-panel">
      <div className="section-heading section-heading-inline">
        <div>
          <span className="eyebrow">Tracker Feed</span>
          <h3>Recent money movement</h3>
        </div>

        <span className="badge">{filteredActivity.length} items</span>
      </div>

      <div className="filter-row" role="tablist" aria-label="Activity filters">
        {filterOptions.map((option) => (
          <button
            className={filter === option ? "segment-button active" : "segment-button"}
            key={option}
            onClick={() => setFilter(option)}
            type="button"
          >
            <Filter size={14} />
            {option === "all" ? "All" : option === "income" ? "Income" : "Expenses"}
          </button>
        ))}
      </div>

      {isLoading ? <div className="empty-state">Loading your activity...</div> : null}
      {!isLoading && error ? <div className="empty-state error-state">{error}</div> : null}

      {!isLoading && !error && filteredActivity.length === 0 ? (
        <div className="empty-state">
          Start logging income and expenses so MoneyMind AI can map your full financial picture.
        </div>
      ) : null}

      {!isLoading && !error && filteredActivity.length > 0 ? (
        <div className="feed-scroll">
          <div className="activity-list">
            {filteredActivity.map((entry) => (
              <article
                className="activity-item"
                key={`${entry.entryType}-${entry.id}`}
                onContextMenu={(event) => openContextMenu(event, entry)}
              >
                <div className="activity-main">
                  <div className="activity-topline">
                    <span className={entry.entryType === "income" ? "type-pill income-pill" : "type-pill expense-pill"}>
                      {entry.entryType === "income" ? "Income" : "Expense"}
                    </span>
                    <span className="activity-date">{formatDate(entry.date)}</span>
                  </div>

                  <div className="activity-copy">
                    <strong>{entry.title}</strong>
                    <p>{entry.subtitle}</p>
                  </div>
                </div>

                <div className="activity-side">
                  <strong className={entry.entryType === "income" ? "activity-amount income-text" : "activity-amount expense-text"}>
                    {entry.entryType === "income" ? "+" : "-"}
                    {formatCurrency(entry.amount)}
                  </strong>
                  <span className="activity-hint">Right click</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {contextMenu ? (
        <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <button
            className="context-menu-item"
            onClick={() => {
              onAskAboutEntry?.(buildEntryPrompt(contextMenu.entry));
              setContextMenu(null);
            }}
            type="button"
          >
            <Bot size={15} />
            Ask AI about this entry
          </button>
          <button
            className="context-menu-item"
            onClick={() => {
              onAskAboutEntry?.(
                contextMenu.entry.entryType === "income"
                  ? `I received ${contextMenu.entry.amount} as ${contextMenu.entry.title}. What is the smartest way to allocate this?`
                  : `I spent ${contextMenu.entry.amount} on ${contextMenu.entry.title}. Is this spending level healthy for my current budget?`
              );
              setContextMenu(null);
            }}
            type="button"
          >
            <Sparkles size={15} />
            Get optimization advice
          </button>
        </div>
      ) : null}
    </section>
  );
}
