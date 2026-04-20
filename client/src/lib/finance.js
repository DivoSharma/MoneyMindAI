const EXPENSE_COLORS = ["#f97316", "#fb7185", "#8b5cf6", "#06b6d4", "#14b8a6", "#f59e0b"];
const INCOME_COLORS = ["#10b981", "#14b8a6", "#0ea5e9", "#22c55e", "#84cc16", "#06b6d4"];

function getMonthKey(value) {
  return String(value || "").slice(0, 7);
}

function formatMonthLabel(monthKey) {
  if (!monthKey) {
    return "";
  }

  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
  }).format(new Date(year, (month || 1) - 1, 1));
}

export function sumAmounts(items) {
  return items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

export function getCurrentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

function attachPalette(items, palette) {
  return items.map((item, index) => ({
    ...item,
    color: palette[index % palette.length],
  }));
}

export function getBreakdown(items, field, palette = EXPENSE_COLORS) {
  const mapped = Object.entries(
    items.reduce((accumulator, item) => {
      const key = String(item[field] || "Other").trim() || "Other";
      accumulator[key] = (accumulator[key] || 0) + Number(item.amount || 0);
      return accumulator;
    }, {})
  )
    .map(([label, total]) => ({ label, total }))
    .sort((left, right) => right.total - left.total);

  const total = mapped.reduce((sum, item) => sum + item.total, 0);

  return attachPalette(
    mapped.map((item) => ({
      ...item,
      share: total > 0 ? Math.round((item.total / total) * 100) : 0,
    })),
    palette
  );
}

export function getMonthlyItems(items) {
  const monthKey = getCurrentMonthKey();
  return items.filter((item) => getMonthKey(item.date) === monthKey);
}

export function getMonthlySeries(expenses, incomes, limit = 6) {
  const currentMonth = getCurrentMonthKey();
  const monthKeys = [...expenses, ...incomes]
    .map((item) => getMonthKey(item.date))
    .filter(Boolean);

  if (!monthKeys.includes(currentMonth)) {
    monthKeys.push(currentMonth);
  }

  const uniqueMonths = [...new Set(monthKeys)].sort();
  const selectedMonths = uniqueMonths.slice(-limit);

  return selectedMonths.map((monthKey) => {
    const monthExpenses = expenses.filter((item) => getMonthKey(item.date) === monthKey);
    const monthIncomes = incomes.filter((item) => getMonthKey(item.date) === monthKey);
    const expense = sumAmounts(monthExpenses);
    const income = sumAmounts(monthIncomes);

    return {
      monthKey,
      label: formatMonthLabel(monthKey),
      expense,
      income,
      net: income - expense,
    };
  });
}

export function getDailySeries(expenses, incomes, days = 10) {
  const today = new Date();
  const labels = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    labels.push(key);
  }

  return labels.map((dayKey) => {
    const expense = sumAmounts(expenses.filter((item) => String(item.date).slice(0, 10) === dayKey));
    const income = sumAmounts(incomes.filter((item) => String(item.date).slice(0, 10) === dayKey));

    return {
      dayKey,
      label: new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
      }).format(new Date(dayKey)),
      expense,
      income,
    };
  });
}

export function getFinanceSnapshot(expenses, incomes) {
  const totalExpenses = sumAmounts(expenses);
  const totalIncome = sumAmounts(incomes);
  const totalNet = totalIncome - totalExpenses;
  const monthlyExpenses = getMonthlyItems(expenses);
  const monthlyIncomes = getMonthlyItems(incomes);
  const monthlySpend = sumAmounts(monthlyExpenses);
  const monthlyIncome = sumAmounts(monthlyIncomes);
  const monthlyNet = monthlyIncome - monthlySpend;
  const savingsRate = monthlyIncome > 0 ? Math.round((monthlyNet / monthlyIncome) * 100) : 0;
  const spendRatio = monthlyIncome > 0 ? Math.round((monthlySpend / monthlyIncome) * 100) : 0;
  const expenseBreakdown = getBreakdown(expenses, "category", EXPENSE_COLORS);
  const incomeBreakdown = getBreakdown(incomes, "source", INCOME_COLORS);
  const monthlySeries = getMonthlySeries(expenses, incomes, 6);
  const dailySeries = getDailySeries(expenses, incomes, 10);
  const avgMonthlyExpense =
    monthlySeries.length > 0
      ? Math.round(monthlySeries.reduce((sum, item) => sum + item.expense, 0) / monthlySeries.length)
      : 0;

  return {
    totalExpenses,
    totalIncome,
    totalNet,
    monthlySpend,
    monthlyIncome,
    monthlyNet,
    savingsRate,
    spendRatio,
    avgMonthlyExpense,
    transactionCount: expenses.length + incomes.length,
    expenseBreakdown,
    incomeBreakdown,
    monthlySeries,
    dailySeries,
    topExpense: expenseBreakdown[0] || null,
    topIncome: incomeBreakdown[0] || null,
    healthTone:
      monthlyIncome === 0 ? "neutral" : monthlyNet >= 0 ? (savingsRate >= 25 ? "strong" : "steady") : "warning",
  };
}

export function getMergedActivity(expenses, incomes) {
  const normalizedExpenses = expenses.map((expense) => ({
    ...expense,
    entryType: "expense",
    title: expense.category,
    subtitle: expense.note || "Expense logged",
  }));

  const normalizedIncomes = incomes.map((income) => ({
    ...income,
    entryType: "income",
    title: income.source,
    subtitle: income.note || "Income logged",
  }));

  return [...normalizedExpenses, ...normalizedIncomes].sort((left, right) => {
    const leftTimestamp = new Date(left.created_at || left.date).getTime();
    const rightTimestamp = new Date(right.created_at || right.date).getTime();
    return rightTimestamp - leftTimestamp;
  });
}

export function buildEntryPrompt(entry) {
  if (!entry) {
    return "";
  }

  if (entry.entryType === "income") {
    return `I received ${entry.amount} as ${entry.title} on ${entry.date}. How should I think about allocating or saving this income?`;
  }

  return `I spent ${entry.amount} on ${entry.title} on ${entry.date}${entry.subtitle ? ` for "${entry.subtitle}"` : ""}. How should I evaluate and optimize this spending?`;
}

export function getToastSuggestions(snapshot, pathname) {
  const suggestions = [];

  if (snapshot.monthlyIncome > 0 && snapshot.savingsRate < 20) {
    suggestions.push({
      id: "raise-savings-rate",
      title: "Savings rate is below target",
      body: "Ask AI Analysis to build a tighter monthly cap so you can protect more of your income.",
      prompt: "Build me a tighter monthly budget cap that improves my savings rate.",
    });
  }

  if (snapshot.topExpense) {
    suggestions.push({
      id: "top-expense-review",
      title: `${snapshot.topExpense.label} is your biggest pressure point`,
      body: "A quick review here will usually unlock the fastest cash-flow improvement.",
      prompt: `How can I reduce my ${snapshot.topExpense.label} spending without making my month miserable?`,
    });
  }

  if (snapshot.monthlyNet > 0) {
    suggestions.push({
      id: "deploy-surplus",
      title: "You have positive monthly surplus",
      body: "This is a good time to ask whether part of it should go to emergency fund, FD, or SIP.",
      prompt: "I have a positive monthly surplus. How should I split it between emergency fund, FD, and SIP?",
    });
  }

  if (pathname !== "/tracker") {
    suggestions.push({
      id: "tracker-reminder",
      title: "Keep the tracker warm",
      body: "Fresh entries make the dashboard and AI advice much more reliable.",
      prompt: "What should I make sure I log regularly so my financial picture stays accurate?",
    });
  }

  return suggestions.slice(0, 4);
}
