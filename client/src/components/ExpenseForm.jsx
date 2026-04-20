import { useState } from "react";
import { createExpense } from "../lib/api";

const categories = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Rent",
  "Entertainment",
  "Health",
  "Travel",
  "Education",
  "Other",
];

const initialState = {
  amount: "",
  category: "Food",
  date: new Date().toISOString().slice(0, 10),
  note: "",
};

export default function ExpenseForm({ onExpenseCreated, embedded = false }) {
  const [formData, setFormData] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const Wrapper = embedded ? "div" : "section";

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount),
      };

      const data = await createExpense(payload);
      onExpenseCreated(data.expense);
      setFormData({
        ...initialState,
        date: new Date().toISOString().slice(0, 10),
      });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  return (
    <Wrapper className={embedded ? "form-surface expense-form-surface" : "card form-card expense-card"}>
      <div className="card-header">
        <span className="eyebrow">Log Expense</span>
        <h2>Capture every outgoing rupee</h2>
        <p>
          Record recurring bills, daily spending, and one-off purchases so your cash-flow picture stays current.
        </p>
      </div>

      <form className="expense-form" onSubmit={handleSubmit}>
        <label>
          Amount
          <input
            min="0"
            name="amount"
            onChange={handleChange}
            placeholder="2500"
            required
            step="0.01"
            type="number"
            value={formData.amount}
          />
        </label>

        <label>
          Category
          <select name="category" onChange={handleChange} value={formData.category}>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label>
          Date
          <input name="date" onChange={handleChange} required type="date" value={formData.date} />
        </label>

        <label>
          Note
          <textarea
            maxLength="240"
            name="note"
            onChange={handleChange}
            placeholder="Dinner with friends, petrol refill, SIP top-up..."
            rows="4"
            value={formData.note}
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button className="button button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving..." : "Save Expense"}
        </button>
      </form>
    </Wrapper>
  );
}
