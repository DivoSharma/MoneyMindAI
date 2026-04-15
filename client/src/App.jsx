import { useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import AIInsights from "./components/AIInsights";
import AuthPanel from "./components/AuthPanel";
import Dashboard from "./components/Dashboard";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";
import { analyzeExpenses, getExpenses } from "./lib/api";
import { supabase } from "./lib/supabase";

function DashboardPage({
  analysis,
  analysisSource,
  expenses,
  isAnalyzing,
  isLoading,
  listError,
  onAnalyze,
  onRefresh,
}) {
  return (
    <div className="page-grid">
      <div className="page-main">
        <Dashboard expenses={expenses} onRefresh={onRefresh} />
        <AIInsights
          analysis={analysis}
          isAnalyzing={isAnalyzing}
          onAnalyze={onAnalyze}
          source={analysisSource}
        />
      </div>
      <div className="page-sidebar">
        <ExpenseList error={listError} expenses={expenses} isLoading={isLoading} />
      </div>
    </div>
  );
}

function AddExpensePage({ expenses, isLoading, listError, onExpenseCreated }) {
  return (
    <div className="page-grid">
      <div className="page-main">
        <ExpenseForm onExpenseCreated={onExpenseCreated} />
      </div>
      <div className="page-sidebar">
        <ExpenseList error={listError} expenses={expenses} isLoading={isLoading} />
      </div>
    </div>
  );
}

function AuthExperience() {
  return (
    <div className="auth-shell">
      <section className="hero-card auth-hero">
        <div>
          <span className="eyebrow">MoneyMind AI</span>
          <h1>Your personal money cockpit, now private to you</h1>
          <p>
            Track every expense, see your biggest categories, and get AI-backed savings and
            investment suggestions without sharing a demo account.
          </p>
        </div>

        <div className="feature-list">
          <div className="feature-item">
            <strong>Private by default</strong>
            <span>Supabase auth and row-level security keep each expense tied to its owner.</span>
          </div>
          <div className="feature-item">
            <strong>Actionable insights</strong>
            <span>Use Groq-powered analysis to spot habits, savings potential, and SIP ideas.</span>
          </div>
          <div className="feature-item">
            <strong>Fast daily logging</strong>
            <span>Add cash, card, and UPI expenses in a clean two-screen workflow.</span>
          </div>
        </div>
      </section>

      <AuthPanel />
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [authReady, setAuthReady] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [analysisSource, setAnalysisSource] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapSession() {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      setSession(initialSession);
      setUserEmail(initialSession?.user?.email || "");
      setAuthReady(true);
    }

    void bootstrapSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);
      setUserEmail(nextSession?.user?.email || "");
      setAnalysis("");
      setAnalysisSource("");
      setListError("");

      if (!nextSession) {
        setExpenses([]);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    async function loadExpenses() {
      setIsLoading(true);
      setListError("");

      try {
        const data = await getExpenses();
        setExpenses(data.expenses || []);
      } catch (error) {
        setListError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadExpenses();
  }, [session]);

  async function handleAnalyze() {
    if (expenses.length === 0) {
      setAnalysis("Add a few expenses first so MoneyMind AI has enough context to analyze.");
      setAnalysisSource("fallback");
      return;
    }

    setIsAnalyzing(true);

    try {
      const data = await analyzeExpenses();
      setAnalysis(data.analysis || "");
      setAnalysisSource(data.source || "");
    } catch (error) {
      setAnalysis(error.message);
      setAnalysisSource("fallback");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleRefresh() {
    setIsLoading(true);
    setListError("");

    try {
      const data = await getExpenses();
      setExpenses(data.expenses || []);
    } catch (error) {
      setListError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleExpenseCreated(expense) {
    setExpenses((current) => [expense, ...current]);
    setAnalysis("");
    setAnalysisSource("");
  }

  async function handleSignOut() {
    setAnalysis("");
    setAnalysisSource("");
    setExpenses([]);
    setListError("");
    await supabase.auth.signOut();
  }

  if (!authReady) {
    return <div className="loading-screen">Loading MoneyMind AI...</div>;
  }

  if (!session) {
    return <AuthExperience />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">AI-powered personal finance assistant</span>
          <h1>MoneyMind AI</h1>
        </div>

        <div className="topbar-actions">
          <span className="user-chip">{userEmail}</span>
          <nav className="nav-tabs">
            <NavLink className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} to="/">
              Dashboard
            </NavLink>
            <NavLink
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              to="/add-expense"
            >
              Add Expense
            </NavLink>
          </nav>
          <button className="button button-ghost" onClick={handleSignOut} type="button">
            Sign Out
          </button>
        </div>
      </header>

      <Routes>
        <Route
          element={
            <DashboardPage
              analysis={analysis}
              analysisSource={analysisSource}
              expenses={expenses}
              isAnalyzing={isAnalyzing}
              isLoading={isLoading}
              listError={listError}
              onAnalyze={handleAnalyze}
              onRefresh={handleRefresh}
            />
          }
          path="/"
        />
        <Route
          element={
            <AddExpensePage
              expenses={expenses}
              isLoading={isLoading}
              listError={listError}
              onExpenseCreated={handleExpenseCreated}
            />
          }
          path="/add-expense"
        />
      </Routes>
    </div>
  );
}
