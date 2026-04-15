import { formatCurrency } from "../lib/format";

function getCategoryBreakdown(expenses) {
  const totals = expenses.reduce((accumulator, expense) => {
    const amount = Number(expense.amount) || 0;
    accumulator[expense.category] = (accumulator[expense.category] || 0) + amount;
    return accumulator;
  }, {});

  return Object.entries(totals)
    .map(([category, total]) => ({ category, total }))
    .sort((left, right) => right.total - left.total);
}

export default function Dashboard({ expenses, onRefresh }) {
  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const currentMonthSpent = expenses
    .filter((expense) => String(expense.date).startsWith(currentMonthKey))
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const categoryBreakdown = getCategoryBreakdown(expenses);
  const topCategory = categoryBreakdown[0];

  return (
    <section className="dashboard-stack">
      <div className="hero-card">
        <div>
          <span className="eyebrow">MoneyMind AI</span>
          <h1>Your money dashboard, without spreadsheet fatigue</h1>
          <p>
            Stay on top of everyday spending, see where your cash is flowing, and ask AI for the
            next smartest move.
          </p>
        </div>

        <button className="button button-secondary" onClick={onRefresh} type="button">
          Refresh Data
        </button>
      </div>

      <div className="stats-grid">
        <article className="card stat-card">
          <span>Total Spend</span>
          <strong>{formatCurrency(totalSpent)}</strong>
          <small>Across every recorded expense</small>
        </article>

        <article className="card stat-card">
          <span>This Month</span>
          <strong>{formatCurrency(currentMonthSpent)}</strong>
          <small>Transactions dated in the current month</small>
        </article>

        <article className="card stat-card">
          <span>Top Category</span>
          <strong>{topCategory ? topCategory.category : "No data"}</strong>
          <small>{topCategory ? formatCurrency(topCategory.total) : "Add a few expenses first"}</small>
        </article>

        <article className="card stat-card">
          <span>Transactions</span>
          <strong>{expenses.length}</strong>
          <small>Every log helps sharpen the AI insights</small>
        </article>
      </div>

      <section className="card">
        <div className="card-header">
          <span className="eyebrow">Category Breakdown</span>
          <h2>Where your money is going</h2>
        </div>

        {categoryBreakdown.length === 0 ? (
          <div className="empty-state">Your category breakdown will appear after your first expense.</div>
        ) : (
          <div className="category-list">
            {categoryBreakdown.map((item) => {
              const share = totalSpent === 0 ? 0 : Math.round((item.total / totalSpent) * 100);

              return (
                <div className="category-row" key={item.category}>
                  <div className="category-meta">
                    <strong>{item.category}</strong>
                    <span>{formatCurrency(item.total)}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${share}%` }} />
                  </div>
                  <span className="progress-label">{share}%</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
