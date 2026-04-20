import { useState } from "react";
import { ArrowRight, PencilLine, Wallet } from "lucide-react";
import ExpenseForm from "./ExpenseForm";
import IncomeForm from "./IncomeForm";
import { getFinanceSnapshot } from "../lib/finance";
import { formatCurrency } from "../lib/format";

export default function TrackerWorkspace({ expenses, incomes, onExpenseCreated, onIncomeCreated, onAskAboutEntry }) {
  const [mode, setMode] = useState("expense");
  const snapshot = getFinanceSnapshot(expenses, incomes);

  return (
    <section className="tracker-workspace">
      <section className="glass-panel tracker-panel">
        <div className="section-heading section-heading-inline">
          <div>
            <span className="eyebrow">Tracker</span>
            <h2>Keep the ledger current without breaking your flow</h2>
            <p>Switch between outflows and inflows, then use the side insights to decide what to log next.</p>
          </div>
        </div>

        <div className="tracker-toggle" role="tablist" aria-label="Tracker mode">
          <button
            className={mode === "expense" ? "segment-button active" : "segment-button"}
            onClick={() => setMode("expense")}
            type="button"
          >
            <PencilLine size={15} />
            Log expense
          </button>
          <button
            className={mode === "income" ? "segment-button active" : "segment-button"}
            onClick={() => setMode("income")}
            type="button"
          >
            <Wallet size={15} />
            Log income
          </button>
        </div>

        <div className="tracker-layout">
          <div className="tracker-form-region">
            {mode === "expense" ? (
              <ExpenseForm embedded onExpenseCreated={onExpenseCreated} />
            ) : (
              <IncomeForm embedded onIncomeCreated={onIncomeCreated} />
            )}
          </div>

          <aside className="tracker-inspector">
            <div className="inspector-card">
              <span className="eyebrow">This month</span>
              <div className="inspector-grid">
                <div>
                  <span>Income</span>
                  <strong>{formatCurrency(snapshot.monthlyIncome)}</strong>
                </div>
                <div>
                  <span>Spend</span>
                  <strong>{formatCurrency(snapshot.monthlySpend)}</strong>
                </div>
                <div>
                  <span>Net</span>
                  <strong>{formatCurrency(snapshot.monthlyNet)}</strong>
                </div>
                <div>
                  <span>Savings rate</span>
                  <strong>{snapshot.monthlyIncome > 0 ? `${snapshot.savingsRate}%` : "--"}</strong>
                </div>
              </div>
            </div>

            <div className="inspector-card">
              <span className="eyebrow">Tracker cues</span>
              <ul className="plain-list">
                <li>Log salary and freelance inflows separately for cleaner AI advice.</li>
                <li>Use short notes for unusual spends so AI can reason about them later.</li>
                <li>Right click any recent entry to ask AI for optimization ideas.</li>
              </ul>
            </div>

            <div className="inspector-card">
              <span className="eyebrow">Fastest improvement</span>
              <p>
                {snapshot.topExpense
                  ? `${snapshot.topExpense.label} is your strongest spending lever right now.`
                  : "Once you log more activity, this will surface the quickest cash-flow improvement."}
              </p>
              {snapshot.topExpense ? (
                <button
                  className="inline-action"
                  onClick={() =>
                    onAskAboutEntry?.(
                      `My highest expense category is ${snapshot.topExpense.label}. Give me three practical ways to reduce it without hurting my routine.`
                    )
                  }
                  type="button"
                >
                  Ask AI about it
                  <ArrowRight size={15} />
                </button>
              ) : null}
            </div>
          </aside>
        </div>
      </section>
    </section>
  );
}
