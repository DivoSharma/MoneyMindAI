import { getFinanceSnapshot } from "../lib/finance";
import { formatCurrency } from "../lib/format";

function buildPersonalizedHeadline(snapshot) {
  if (snapshot.monthlyIncome === 0) {
    return "Start logging income to unlock a more accurate finance operating system.";
  }

  if (snapshot.monthlyNet > 0) {
    return `You are currently running a ${formatCurrency(snapshot.monthlyNet)} monthly surplus.`;
  }

  if (snapshot.monthlyNet < 0) {
    return `You are currently overspending by ${formatCurrency(Math.abs(snapshot.monthlyNet))} this month.`;
  }

  return "Your current month is breaking roughly even, which gives us a stable baseline to optimize.";
}

function buildGuidance(snapshot) {
  const topExpense = snapshot.expenseBreakdown[0];
  const topIncome = snapshot.incomeBreakdown[0];

  if (!topExpense && !topIncome) {
    return "Add both incomes and expenses to start seeing your personal cash-flow patterns.";
  }

  return `${topIncome ? `Main inflow: ${topIncome.label}. ` : ""}${topExpense ? `Largest pressure point: ${topExpense.label}.` : ""}`;
}

function renderBreakdownRows(items, emptyLabel) {
  if (items.length === 0) {
    return <div className="empty-state compact-empty">{emptyLabel}</div>;
  }

  const total = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="breakdown-list">
      {items.map((item) => {
        const share = total > 0 ? Math.round((item.total / total) * 100) : 0;

        return (
          <div className="breakdown-row" key={item.label}>
            <div className="breakdown-meta">
              <strong>{item.label}</strong>
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
  );
}

export default function Dashboard({ expenses, incomes, onRefresh }) {
  const snapshot = getFinanceSnapshot(expenses, incomes);

  return (
    <section className="dashboard-stack">
      <div className="hero-card dashboard-hero">
        <div className="hero-copy">
          <span className="eyebrow">Personal Finance OS</span>
          <h1>Track income, control spending, and plan your next move with clarity.</h1>
          <p>{buildPersonalizedHeadline(snapshot)}</p>
          <div className="hero-note">{buildGuidance(snapshot)}</div>
        </div>

        <div className="hero-actions">
          <div className="glass-stat">
            <span>Monthly net</span>
            <strong>{formatCurrency(snapshot.monthlyNet)}</strong>
          </div>
          <div className="glass-stat">
            <span>Savings rate</span>
            <strong>{snapshot.monthlyIncome > 0 ? `${snapshot.savingsRate}%` : "--"}</strong>
          </div>
          <button className="button button-secondary" onClick={onRefresh} type="button">
            Refresh Data
          </button>
        </div>
      </div>

      <div className="stats-grid stats-grid-rich">
        <article className="card stat-card income-surface">
          <span>Total Income</span>
          <strong>{formatCurrency(snapshot.totalIncome)}</strong>
          <small>All recorded inflows across salary, freelance, and other sources</small>
        </article>

        <article className="card stat-card expense-surface">
          <span>Total Expenses</span>
          <strong>{formatCurrency(snapshot.totalExpenses)}</strong>
          <small>Every outflow logged for your current financial picture</small>
        </article>

        <article className="card stat-card neutral-surface">
          <span>This Month</span>
          <strong>{formatCurrency(snapshot.monthlyIncome)}</strong>
          <small>Income booked in the current month</small>
        </article>

        <article className="card stat-card net-surface">
          <span>Monthly Net Cash</span>
          <strong>{formatCurrency(snapshot.monthlyNet)}</strong>
          <small>{snapshot.monthlyIncome > 0 ? `${snapshot.savingsRate}% savings rate` : "Add income to calculate savings rate"}</small>
        </article>
      </div>

      <div className="insight-strip">
        <div className="insight-tile">
          <span className="eyebrow">Top Expense</span>
          <strong>{snapshot.expenseBreakdown[0]?.label || "No expense data"}</strong>
          <small>{snapshot.expenseBreakdown[0] ? formatCurrency(snapshot.expenseBreakdown[0].total) : "Log expenses to see patterns"}</small>
        </div>

        <div className="insight-tile">
          <span className="eyebrow">Top Income Source</span>
          <strong>{snapshot.incomeBreakdown[0]?.label || "No income data"}</strong>
          <small>{snapshot.incomeBreakdown[0] ? formatCurrency(snapshot.incomeBreakdown[0].total) : "Log income to unlock deeper advice"}</small>
        </div>

        <div className="insight-tile">
          <span className="eyebrow">Spend vs Income</span>
          <strong>
            {snapshot.monthlyIncome > 0
              ? `${Math.round((snapshot.monthlySpend / snapshot.monthlyIncome) * 100)}%`
              : "--"}
          </strong>
          <small>How much of this month's income has already been used</small>
        </div>
      </div>

      <div className="dashboard-split">
        <section className="card data-card">
          <div className="card-header">
            <span className="eyebrow">Expense Pressure</span>
            <h2>Where your money is going</h2>
            <p>Use this to identify which categories are pulling down your monthly surplus.</p>
          </div>
          {renderBreakdownRows(
            snapshot.expenseBreakdown,
            "Add expenses to see your category pressure points."
          )}
        </section>

        <section className="card data-card">
          <div className="card-header">
            <span className="eyebrow">Income Mix</span>
            <h2>How your money comes in</h2>
            <p>A more complete income mix helps MoneyMind personalize savings targets and investing suggestions.</p>
          </div>
          {renderBreakdownRows(
            snapshot.incomeBreakdown,
            "Add incomes to track salary, freelance, business, and other cash inflows."
          )}
        </section>
      </div>
    </section>
  );
}
