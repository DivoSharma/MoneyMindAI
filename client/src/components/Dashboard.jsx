import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getFinanceSnapshot } from "../lib/finance";
import { formatCurrency } from "../lib/format";

function buildHeadline(snapshot) {
  if (snapshot.monthlyIncome === 0) {
    return "Start logging income so the workspace can map your real savings capacity.";
  }

  if (snapshot.monthlyNet < 0) {
    return `You are burning ${formatCurrency(Math.abs(snapshot.monthlyNet))} more than you brought in this month.`;
  }

  if (snapshot.savingsRate >= 30) {
    return `You are protecting ${snapshot.savingsRate}% of this month's income, which is a strong savings posture.`;
  }

  return `You are holding a ${formatCurrency(snapshot.monthlyNet)} monthly buffer right now.`;
}

function FinanceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  const resolvedLabel = label || payload[0]?.payload?.label || payload[0]?.name || "Details";

  return (
    <div className="chart-tooltip">
      <strong>{resolvedLabel}</strong>
      {payload.map((item) => (
        <div className="tooltip-row" key={item.dataKey}>
          <span>{item.name || item.dataKey}</span>
          <strong>{formatCurrency(item.value)}</strong>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ expenses, incomes, onRefresh }) {
  const snapshot = getFinanceSnapshot(expenses, incomes);
  const expenseChartData = snapshot.expenseBreakdown.slice(0, 5);
  const incomeChartData = snapshot.incomeBreakdown.slice(0, 5);

  return (
    <section className="workspace-stack">
      <section className="glass-panel workspace-hero">
        <div className="hero-copy">
          <span className="eyebrow">Dashboard</span>
          <h2>Run your finances like a calm, informed operating system.</h2>
          <p>{buildHeadline(snapshot)}</p>
        </div>

        <div className="hero-actions">
          <button className="button button-secondary" onClick={onRefresh} type="button">
            Refresh Workspace
          </button>
        </div>

        <div className="metric-strip">
          <article className="metric-tile">
            <span>Monthly income</span>
            <strong>{formatCurrency(snapshot.monthlyIncome)}</strong>
            <small>Current-month inflows</small>
          </article>

          <article className="metric-tile">
            <span>Monthly spend</span>
            <strong>{formatCurrency(snapshot.monthlySpend)}</strong>
            <small>Current-month outflows</small>
          </article>

          <article className="metric-tile">
            <span>Net cash</span>
            <strong>{formatCurrency(snapshot.monthlyNet)}</strong>
            <small>{snapshot.savingsRate}% savings rate</small>
          </article>

          <article className="metric-tile">
            <span>Transactions</span>
            <strong>{snapshot.transactionCount}</strong>
            <small>Total entries tracked</small>
          </article>
        </div>

        <div className="hero-chart">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Cash Flow Trend</span>
              <h3>Income vs expense over recent months</h3>
            </div>
          </div>

          <ResponsiveContainer height={250} width="100%">
            <AreaChart data={snapshot.monthlySeries}>
              <defs>
                <linearGradient id="incomeFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.34} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" vertical={false} />
              <XAxis axisLine={false} dataKey="label" tickLine={false} tick={{ fill: "#6b7a93", fontSize: 12 }} />
              <YAxis
                axisLine={false}
                tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                tickLine={false}
                tick={{ fill: "#6b7a93", fontSize: 12 }}
              />
              <Tooltip content={<FinanceTooltip />} />
              <Area dataKey="expense" fill="url(#expenseFill)" name="Expense" stroke="#f97316" strokeWidth={2} />
              <Area dataKey="income" fill="url(#incomeFill)" name="Income" stroke="#14b8a6" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="glass-panel chart-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Expense Mix</span>
              <h3>Where your money is concentrated</h3>
            </div>
          </div>

          {expenseChartData.length > 0 ? (
            <div className="donut-layout">
              <ResponsiveContainer height={220} width="100%">
                <PieChart>
                  <Pie
                    cx="50%"
                    cy="50%"
                    data={expenseChartData}
                    dataKey="total"
                    innerRadius={58}
                    outerRadius={84}
                    paddingAngle={4}
                  >
                    {expenseChartData.map((item) => (
                      <Cell fill={item.color} key={item.label} />
                    ))}
                  </Pie>
                  <Tooltip content={<FinanceTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              <div className="legend-list">
                {expenseChartData.map((item) => (
                  <div className="legend-item" key={item.label}>
                    <span className="legend-dot" style={{ backgroundColor: item.color }} />
                    <div>
                      <strong>{item.label}</strong>
                      <small>
                        {formatCurrency(item.total)} · {item.share}%
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">Start logging expenses to unlock the category view.</div>
          )}
        </article>

        <article className="glass-panel chart-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Income Mix</span>
              <h3>How your money comes in</h3>
            </div>
          </div>

          {incomeChartData.length > 0 ? (
            <ResponsiveContainer height={260} width="100%">
              <BarChart data={incomeChartData} layout="vertical">
                <CartesianGrid horizontal={false} stroke="rgba(148, 163, 184, 0.14)" />
                <XAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7a93", fontSize: 12 }} type="number" />
                <YAxis
                  axisLine={false}
                  dataKey="label"
                  tickLine={false}
                  tick={{ fill: "#2a3850", fontSize: 12 }}
                  type="category"
                  width={78}
                />
                <Tooltip content={<FinanceTooltip />} />
                <Bar dataKey="total" fill="#14b8a6" radius={[10, 10, 10, 10]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">Add salary, freelance, or other income entries to see inflow quality.</div>
          )}
        </article>

        <article className="glass-panel signal-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Signal Summary</span>
              <h3>What deserves attention now</h3>
            </div>
          </div>

          <div className="signal-list">
            <div className="signal-row">
              <span>Top expense</span>
              <strong>{snapshot.topExpense ? snapshot.topExpense.label : "No expense data"}</strong>
            </div>
            <div className="signal-row">
              <span>Top income source</span>
              <strong>{snapshot.topIncome ? snapshot.topIncome.label : "No income data"}</strong>
            </div>
            <div className="signal-row">
              <span>Spend ratio</span>
              <strong>{snapshot.monthlyIncome > 0 ? `${snapshot.spendRatio}%` : "--"}</strong>
            </div>
            <div className="signal-row">
              <span>Average monthly expense</span>
              <strong>{formatCurrency(snapshot.avgMonthlyExpense)}</strong>
            </div>
          </div>

          <div className="advice-banner">
            <span className="eyebrow">Focus</span>
            <p>
              {snapshot.topExpense
                ? `${snapshot.topExpense.label} is currently your main cash-flow pressure point.`
                : "Once you add more activity, this area will call out your main decision lever."}
            </p>
          </div>
        </article>

        <article className="glass-panel chart-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Recent Pulse</span>
              <h3>Last 10 days of money movement</h3>
            </div>
          </div>

          <ResponsiveContainer height={260} width="100%">
            <BarChart data={snapshot.dailySeries}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.14)" vertical={false} />
              <XAxis axisLine={false} dataKey="label" tickLine={false} tick={{ fill: "#6b7a93", fontSize: 12 }} />
              <YAxis
                axisLine={false}
                tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                tickLine={false}
                tick={{ fill: "#6b7a93", fontSize: 12 }}
              />
              <Tooltip content={<FinanceTooltip />} />
              <Bar dataKey="expense" fill="#f97316" name="Expense" radius={[8, 8, 0, 0]} />
              <Bar dataKey="income" fill="#14b8a6" name="Income" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>
      </section>
    </section>
  );
}
