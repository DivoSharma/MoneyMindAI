import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import AuthPanel from "./components/AuthPanel";
import {
  analyzeExpenses,
  chatWithAdvisor,
  getExpenses,
  getIncomes,
} from "./lib/api";
import { getFinanceSnapshot, getToastSuggestions } from "./lib/finance";
import { supabase } from "./lib/supabase";

const ActivityFeed = lazy(() => import("./components/ActivityFeed"));
const AIInsights = lazy(() => import("./components/AIInsights"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const SuggestionToasts = lazy(() => import("./components/SuggestionToasts"));
const TrackerWorkspace = lazy(() => import("./components/TrackerWorkspace"));

function createMessage(role, content) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
  };
}

function DashboardPage({ expenses, incomes, isLoading, listError, onRefresh, onAskAboutEntry }) {
  return (
    <div className="page-grid">
      <div className="page-main page-scroll">
        <Suspense fallback={<div className="panel-loading">Loading dashboard...</div>}>
          <Dashboard expenses={expenses} incomes={incomes} onRefresh={onRefresh} />
        </Suspense>
      </div>

      <div className="page-sidebar">
        <Suspense fallback={<div className="panel-loading">Loading activity...</div>}>
          <ActivityFeed
            error={listError}
            expenses={expenses}
            incomes={incomes}
            isLoading={isLoading}
            onAskAboutEntry={onAskAboutEntry}
          />
        </Suspense>
      </div>
    </div>
  );
}

function TrackerPage({
  expenses,
  incomes,
  isLoading,
  listError,
  onAskAboutEntry,
  onExpenseCreated,
  onIncomeCreated,
}) {
  return (
    <div className="page-grid">
      <div className="page-main page-scroll">
        <Suspense fallback={<div className="panel-loading">Loading tracker...</div>}>
          <TrackerWorkspace
            expenses={expenses}
            incomes={incomes}
            onAskAboutEntry={onAskAboutEntry}
            onExpenseCreated={onExpenseCreated}
            onIncomeCreated={onIncomeCreated}
          />
        </Suspense>
      </div>

      <div className="page-sidebar">
        <Suspense fallback={<div className="panel-loading">Loading activity...</div>}>
          <ActivityFeed
            error={listError}
            expenses={expenses}
            incomes={incomes}
            isLoading={isLoading}
            onAskAboutEntry={onAskAboutEntry}
          />
        </Suspense>
      </div>
    </div>
  );
}

function AnalysisPage({
  aiSource,
  chatMessages,
  expenses,
  incomes,
  isAnalyzing,
  onAnalyze,
  onSendMessage,
}) {
  return (
    <div className="page-single page-scroll">
      <Suspense fallback={<div className="panel-loading">Loading AI analysis...</div>}>
        <AIInsights
          financeSnapshot={getFinanceSnapshot(expenses, incomes)}
          hasFinanceData={expenses.length > 0 || incomes.length > 0}
          isAnalyzing={isAnalyzing}
          messages={chatMessages}
          onAnalyze={onAnalyze}
          onSendMessage={onSendMessage}
          source={aiSource}
        />
      </Suspense>
    </div>
  );
}

function AuthExperience() {
  return (
    <div className="auth-shell">
      <section className="hero-card auth-hero">
        <div>
          <span className="eyebrow">MoneyMind AI</span>
          <h1>A private finance workspace with live cash-flow visibility and an AI copilot.</h1>
          <p>
            Track income, capture expenses, monitor your trends, and ask grounded questions about budgeting, FD, SIP,
            and savings decisions.
          </p>
        </div>

        <div className="feature-list">
          <div className="feature-item">
            <strong>Professional dashboard</strong>
            <span>Monitor trends, breakdowns, and net cash flow in one glass-style workspace.</span>
          </div>
          <div className="feature-item">
            <strong>Tracker with context</strong>
            <span>Capture income and spending without losing sight of your monthly position.</span>
          </div>
          <div className="feature-item">
            <strong>AI finance analysis</strong>
            <span>Chat naturally about overspending, savings targets, emergency funds, and SIP readiness.</span>
          </div>
        </div>
      </section>

      <AuthPanel />
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [queuedPrompt, setQueuedPrompt] = useState("");

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

  useEffect(() => {
    if (!queuedPrompt || !session || isAnalyzing) {
      return;
    }

    const prompt = queuedPrompt;
    setQueuedPrompt("");
    void handleSendMessage(prompt);
  }, [queuedPrompt, session, isAnalyzing]);

  function openAnalysisWithPrompt(prompt) {
    if (!prompt) {
      return;
    }

    navigate("/analysis");
    setQueuedPrompt(prompt);
  }

  function handleExpenseCreated(expense) {
    setExpenses((current) => [expense, ...current]);
  }

  function handleIncomeCreated(income) {
    setIncomes((current) => [income, ...current]);
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

  const financeSnapshot = getFinanceSnapshot(expenses, incomes);
  const toastSuggestions = getToastSuggestions(financeSnapshot, location.pathname);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <span className="eyebrow">Personal finance workspace</span>
          <h1>MoneyMind AI</h1>
        </div>

        <div className="topbar-actions">
          <nav className="nav-tabs">
            <NavLink className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} to="/">
              Dashboard
            </NavLink>
            <NavLink className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} to="/tracker">
              Tracker
            </NavLink>
            <NavLink className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} to="/analysis">
              AI Analysis
            </NavLink>
          </nav>
          <span className="user-chip">{userEmail}</span>
          <button className="button button-ghost" onClick={handleSignOut} type="button">
            Sign Out
          </button>
        </div>
      </header>

      <main className="workspace-shell">
        <Routes>
          <Route
            element={
              <DashboardPage
                expenses={expenses}
                incomes={incomes}
                isLoading={isLoading}
                listError={listError}
                onAskAboutEntry={openAnalysisWithPrompt}
                onRefresh={loadFinanceData}
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
                onAskAboutEntry={openAnalysisWithPrompt}
                onExpenseCreated={handleExpenseCreated}
                onIncomeCreated={handleIncomeCreated}
              />
            }
            path="/tracker"
          />
          <Route
            element={
              <AnalysisPage
                aiSource={aiSource}
                chatMessages={chatMessages}
                expenses={expenses}
                incomes={incomes}
                isAnalyzing={isAnalyzing}
                onAnalyze={handleAnalyze}
                onSendMessage={handleSendMessage}
              />
            }
            path="/analysis"
          />
          <Route element={<Navigate replace to="/tracker" />} path="/add-expense" />
        </Routes>
      </main>

      <Suspense fallback={null}>
        <SuggestionToasts onOpenSuggestion={openAnalysisWithPrompt} suggestions={toastSuggestions} />
      </Suspense>
    </div>
  );
}
