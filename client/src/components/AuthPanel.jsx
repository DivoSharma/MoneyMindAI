import { useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const initialState = {
  email: "",
  password: "",
};

export default function AuthPanel() {
  const [mode, setMode] = useState("sign-in");
  const [formData, setFormData] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    if (!isSupabaseConfigured) {
      setError("Add your Supabase URL and publishable key to client/.env before signing in.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (mode === "sign-up") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        if (data.session) {
          setMessage("Your account is ready. Loading your private dashboard now.");
        } else {
          setMessage("Check your inbox to confirm your account, then sign in to continue.");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password,
        });

        if (signInError) {
          throw signInError;
        }
      }

      setFormData(initialState);
    } catch (submitError) {
      setError(submitError.message || "Unable to complete authentication right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="card auth-card">
      <div className="card-header">
        <span className="eyebrow">Secure Access</span>
        <h2>{mode === "sign-in" ? "Sign in to your private ledger" : "Create your MoneyMind account"}</h2>
        <p>
          Every dashboard, expense, and AI recommendation stays scoped to your own Supabase user.
        </p>
      </div>

      <div className="mode-toggle" role="tablist" aria-label="Authentication mode">
        <button
          className={mode === "sign-in" ? "button button-primary" : "button button-ghost"}
          onClick={() => {
            setMode("sign-in");
            setError("");
            setMessage("");
          }}
          type="button"
        >
          Sign In
        </button>
        <button
          className={mode === "sign-up" ? "button button-primary" : "button button-ghost"}
          onClick={() => {
            setMode("sign-up");
            setError("");
            setMessage("");
          }}
          type="button"
        >
          Create Account
        </button>
      </div>

      <form className="expense-form auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            autoComplete="email"
            name="email"
            onChange={handleChange}
            placeholder="you@example.com"
            required
            type="email"
            value={formData.email}
          />
        </label>

        <label>
          Password
          <input
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            minLength="6"
            name="password"
            onChange={handleChange}
            placeholder="Minimum 6 characters"
            required
            type="password"
            value={formData.password}
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}
        {message ? <p className="form-message">{message}</p> : null}

        <button className="button button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting
            ? mode === "sign-in"
              ? "Signing in..."
              : "Creating account..."
            : mode === "sign-in"
              ? "Sign In"
              : "Create Account"}
        </button>
      </form>
    </section>
  );
}
