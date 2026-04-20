export function sumAmounts(items) {
  return items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

export function getCurrentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

export function getBreakdown(items, field) {
  return Object.entries(
    items.reduce((accumulator, item) => {
      const key = String(item[field] || "Other").trim() || "Other";
      accumulator[key] = (accumulator[key] || 0) + Number(item.amount || 0);
      return accumulator;
    }, {})
  )
    .map(([label, total]) => ({ label, total }))
    .sort((left, right) => right.total - left.total);
}

export function getMonthlyItems(items) {
  const monthKey = getCurrentMonthKey();
  return items.filter((item) => String(item.date).startsWith(monthKey));
}

export function getFinanceSnapshot(expenses, incomes) {
  const totalExpenses = sumAmounts(expenses);
  const totalIncome = sumAmounts(incomes);
  const monthlyExpenses = getMonthlyItems(expenses);
  const monthlyIncomes = getMonthlyItems(incomes);
  const monthlySpend = sumAmounts(monthlyExpenses);
  const monthlyIncome = sumAmounts(monthlyIncomes);
  const monthlyNet = monthlyIncome - monthlySpend;
  const savingsRate = monthlyIncome > 0 ? Math.round((monthlyNet / monthlyIncome) * 100) : 0;

  return {
    totalExpenses,
    totalIncome,
    totalNet: totalIncome - totalExpenses,
    monthlySpend,
    monthlyIncome,
    monthlyNet,
    savingsRate,
    expenseBreakdown: getBreakdown(expenses, "category"),
    incomeBreakdown: getBreakdown(incomes, "source"),
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
