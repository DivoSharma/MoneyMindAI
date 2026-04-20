import { useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import ActivityFeed from "./components/ActivityFeed";
import AIInsights from "./components/AIInsights";
import AuthPanel from "./components/AuthPanel";
import Dashboard from "./components/Dashboard";
import ExpenseForm from "./components/ExpenseForm";
import IncomeForm from "./components/IncomeForm";
import {
  analyzeExpenses,
  chatWithAdvisor,
  getExpenses,
  getIncomes,
} from "./lib/api";
import { supabase } from "./lib/supabase";

function createMessage(role, content) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
  };
}

function DashboardPage({
  aiSource,
  chatMessages,
  expenses,
  incomes,
  isAnalyzing,
  isLoading,
  listError,
  onAnalyze,
  onRefresh,
  onSendMessage,
}) {
  return (
    <div className="page-grid dashboard-page-grid">
      <div className="page-main">
        <Dashboard expenses={expenses} incomes={incomes} onRefresh={onRefresh} />
        <AIInsights
          hasFinanceData={expenses.length > 0 || incomes.length > 0}
          isAnalyzing={isAnalyzing}
          messages={chatMessages}
          onAnalyze={onAnalyze}
          onSendMessage={onSendMessage}
          source={aiSource}
        />
      </div>
      <div className="page-sidebar">
        <ActivityFeed error={listError} expenses={expenses} incomes={incomes} isLoading={isLoading} />
      </div>
    </div>
  );
}

function TrackerPage({ expenses, incomes, isLoading, listError, onExpenseCreated, onIncomeCreated }) {
  return (
    <div className="page-grid tracker-grid">
      <div className="page-main">
        <section className="card planner-card">
          <div className="card-header">
            <span className="eyebrow">Cashflow Tracker</span>
            <h2>Manage both sides of your money system</h2>
            <p>Track income and spending together to understand net cash flow, savings power, and investable surplus.</p>
          </div>

          <div className="forms-grid">
            <ExpenseForm onExpenseCreated={onExpenseCreated} />
            <IncomeForm onIncomeCreated={onIncomeCreated} />
          </div>
        </section>
      </div>

      <div className="page-sidebar">
        <ActivityFeed error={listError} expenses={expenses} incomes={incomes} isLoading={isLoading} />
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
          <h1>A glassy finance workspace for income, spending, and smarter decisions.</h1>
          <p>
            Track how money comes in, where it goes, and what you should do next with personalized guidance built around your own numbers.
          </p>
        </div>

        <div className="feature-list">
          <div className="feature-item">
            <strong>Full cash-flow view</strong>
            <span>Capture both income and expenses so the dashboard reflects your real financial system.</span>
          </div>
          <div className="feature-item">
            <strong>Personalized AI finance chat</strong>
            <span>Ask about spending leaks, SIP affordability, budget caps, and next-month planning.</span>
          </div>
          <div className="feature-item">
            <strong>Professional daily tracking</strong>
            <span>Use one calm workspace for salary, bills, shopping, and long-term savings decisions.</span>
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
  const [incomes, setIncomes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [aiSource, setAiSource] = useState("");
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
      setChatMessages([]);
      setAiSource("");
      setListError("");

      if (!nextSession) {
        setExpenses([]);
        setIncomes([]);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function loadFinanceData() {
    setIsLoading(true);
    setListError("");

    try {
      const [expenseData, incomeData] = await Promise.all([getExpenses(), getIncomes()]);
      setExpenses(expenseData.expenses || []);
      setIncomes(incomeData.incomes || []);
    } catch (error) {
      setListError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!session) {
      return;
    }

    void loadFinanceData();
  }, [session]);

  async function handleAnalyze() {
    if (expenses.length === 0 && incomes.length === 0) {
      setChatMessages([
        createMessage(
          "assistant",
          "Add your income and expense entries first so MoneyMind AI can review your cash flow properly."
        ),
      ]);
      setAiSource("fallback");
      return;
    }

    setIsAnalyzing(true);

    try {
      const data = await analyzeExpenses();
      setChatMessages([createMessage("assistant", data.analysis || "I reviewed your recent finances.")]);
      setAiSource(data.source || "");
    } catch (error) {
      setChatMessages([createMessage("assistant", error.message)]);
      setAiSource("fallback");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSendMessage(content) {
    if (!content.trim()) {
      return;
    }

    const userMessage = createMessage("user", content.trim());
    const nextMessages = [...chatMessages, userMessage];
    setChatMessages(nextMessages);
    setIsAnalyzing(true);

    try {
      const data = await chatWithAdvisor(
        nextMessages.map((message) => ({
          role: message.role,
          content: message.content,
        }))
      );

      setChatMessages([...nextMessages, createMessage("assistant", data.reply || "I'm here to help.")]);
      setAiSource(data.source || "");
    } catch (error) {
      setChatMessages([
        ...nextMessages,
        createMessage(
          "assistant",
          error.message || "I ran into a problem while replying. Please try again in a moment."
        ),
      ]);
      setAiSource("fallback");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleExpenseCreated(expense) {
    setExpenses((current) => [expense, ...current]);
    setChatMessages([]);
    setAiSource("");
  }

  function handleIncomeCreated(income) {
    setIncomes((current) => [income, ...current]);
    setChatMessages([]);
    setAiSource("");
  }

  async function handleSignOut() {
    setChatMessages([]);
    setAiSource("");
    setExpenses([]);
    setIncomes([]);
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
        <div className="brand-block">
          <span className="eyebrow">AI-powered personal finance workspace</span>
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
              to="/tracker"
            >
              Tracker
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
              aiSource={aiSource}
              chatMessages={chatMessages}
              expenses={expenses}
              incomes={incomes}
              isAnalyzing={isAnalyzing}
              isLoading={isLoading}
              listError={listError}
              onAnalyze={handleAnalyze}
              onRefresh={loadFinanceData}
              onSendMessage={handleSendMessage}
            />
          }
          path="/"
        />
        <Route
          element={
            <TrackerPage
              expenses={expenses}
              incomes={incomes}
              isLoading={isLoading}
              listError={listError}
              onExpenseCreated={handleExpenseCreated}
              onIncomeCreated={handleIncomeCreated}
            />
          }
          path="/tracker"
        />
        <Route
          element={<Navigate replace to="/tracker" />}
          path="/add-expense"
        />
      </Routes>
    </div>
  );
}
