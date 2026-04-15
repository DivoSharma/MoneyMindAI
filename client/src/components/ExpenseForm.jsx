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

export default function ExpenseForm({ onExpenseCreated }) {
  const [formData, setFormData] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

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
    <section className="card card-form">
      <div className="card-header">
        <span className="eyebrow">Add Expense</span>
        <h2>Capture spending in under a minute</h2>
        <p>
          Log every swipe, scan, and cash spend so MoneyMind AI can spot patterns faster.
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
    </section>
  );
}
