import { useState } from "react";
import { createIncome } from "../lib/api";

const incomeSources = [
  "Salary",
  "Freelance",
  "Business",
  "Bonus",
  "Interest",
  "Refund",
  "Gift",
  "Other",
];

const initialState = {
  amount: "",
  source: "Salary",
  date: new Date().toISOString().slice(0, 10),
  note: "",
};

export default function IncomeForm({ onIncomeCreated }) {
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

      const data = await createIncome(payload);
      onIncomeCreated(data.income);
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
    <section className="card form-card income-card">
      <div className="card-header">
        <span className="eyebrow">Log Income</span>
        <h2>Track what is coming in</h2>
        <p>Add salary, freelance work, refunds, and other cash inflows for better net-cash analysis.</p>
      </div>

      <form className="expense-form" onSubmit={handleSubmit}>
        <label>
          Amount
          <input
            min="0"
            name="amount"
            onChange={handleChange}
            placeholder="45000"
            required
            step="0.01"
            type="number"
            value={formData.amount}
          />
        </label>

        <label>
          Source
          <select name="source" onChange={handleChange} value={formData.source}>
            {incomeSources.map((source) => (
              <option key={source} value={source}>
                {source}
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
            placeholder="April salary credit, client retainer, annual bonus..."
            rows="4"
            value={formData.note}
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button className="button button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving..." : "Save Income"}
        </button>
      </form>
    </section>
  );
}
