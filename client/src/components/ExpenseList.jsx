import { formatCurrency, formatDate } from "../lib/format";

export default function ExpenseList({ expenses, error, isLoading }) {
  return (
    <section className="card">
      <div className="card-header card-header-inline">
        <div>
          <span className="eyebrow">Expense Feed</span>
          <h2>All recorded expenses</h2>
        </div>
        <span className="badge">{expenses.length} items</span>
      </div>

      {isLoading ? <div className="empty-state">Loading expenses...</div> : null}
      {!isLoading && error ? <div className="empty-state error-state">{error}</div> : null}

      {!isLoading && !error && expenses.length === 0 ? (
        <div className="empty-state">
          No expenses yet. Add your first expense to unlock dashboard summaries and AI advice.
        </div>
      ) : null}

      {!isLoading && !error && expenses.length > 0 ? (
        <div className="table-wrap">
          <table className="expense-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Note</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{formatDate(expense.date)}</td>
                  <td>
                    <span className="category-pill">{expense.category}</span>
                  </td>
                  <td>{expense.note || "No note added"}</td>
                  <td className="amount-cell">{formatCurrency(expense.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
