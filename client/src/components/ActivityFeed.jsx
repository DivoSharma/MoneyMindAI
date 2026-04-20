import { getMergedActivity } from "../lib/finance";
import { formatCurrency, formatDate } from "../lib/format";

export default function ActivityFeed({ expenses, incomes, error, isLoading }) {
  const activity = getMergedActivity(expenses, incomes);

  return (
    <section className="card feed-card">
      <div className="card-header card-header-inline">
        <div>
          <span className="eyebrow">Activity Feed</span>
          <h2>Income and expenses</h2>
          <p>Recent money movement in one scrollable stream.</p>
        </div>
        <span className="badge">{activity.length} entries</span>
      </div>

      {isLoading ? <div className="empty-state">Loading your activity...</div> : null}
      {!isLoading && error ? <div className="empty-state error-state">{error}</div> : null}

      {!isLoading && !error && activity.length === 0 ? (
        <div className="empty-state">
          Start by logging income and expenses so MoneyMind AI can map your full financial picture.
        </div>
      ) : null}

      {!isLoading && !error && activity.length > 0 ? (
        <div className="feed-scroll">
          <div className="activity-list">
            {activity.map((entry) => (
              <article className="activity-item" key={`${entry.entryType}-${entry.id}`}>
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

                <strong className={entry.entryType === "income" ? "activity-amount income-text" : "activity-amount expense-text"}>
                  {entry.entryType === "income" ? "+" : "-"}
                  {formatCurrency(entry.amount)}
                </strong>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
