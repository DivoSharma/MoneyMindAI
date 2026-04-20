import { env } from "../config.js";
import { groqClient } from "../lib/groq.js";
import { normalizeMessages } from "../lib/validation.js";

const advisorPrompt = `
You are MoneyMind AI, a personal finance strategist for a young Indian professional.
Use the user's income, expense categories, cash-flow position, and recent transaction notes to give practical advice.

When you respond:
- Use INR amounts.
- Keep the tone warm, polished, and professional.
- Prioritize personalized budgeting and cash-flow guidance over generic finance lectures.
- Give realistic savings ideas and sensible Indian options like emergency fund, FD, and SIP.
- Avoid making up facts that are not supported by the transaction data.
`.trim();

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function sumAmounts(items) {
  return items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function getCurrentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

function getBreakdown(items, field) {
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

function buildFinanceDigest(expenses, incomes) {
  const currentMonthKey = getCurrentMonthKey();
  const totalSpent = sumAmounts(expenses);
  const totalIncome = sumAmounts(incomes);
  const monthlyExpenses = expenses.filter((expense) => String(expense.date).startsWith(currentMonthKey));
  const monthlyIncomes = incomes.filter((income) => String(income.date).startsWith(currentMonthKey));
  const monthlySpend = sumAmounts(monthlyExpenses);
  const monthlyIncome = sumAmounts(monthlyIncomes);
  const netWorthFlow = totalIncome - totalSpent;
  const monthlyNet = monthlyIncome - monthlySpend;
  const savingsRate = monthlyIncome > 0 ? Math.round((monthlyNet / monthlyIncome) * 100) : 0;
  const expenseBreakdown = getBreakdown(expenses, "category");
  const incomeBreakdown = getBreakdown(incomes, "source");

  return {
    totalSpent,
    totalIncome,
    netWorthFlow,
    monthlyIncome,
    monthlySpend,
    monthlyNet,
    savingsRate,
    expenseBreakdown,
    incomeBreakdown,
    transactions: {
      expenseCount: expenses.length,
      incomeCount: incomes.length,
    },
    expenses: expenses.map((expense) => ({
      amount: Number(expense.amount || 0),
      category: expense.category,
      date: expense.date,
      note: expense.note || "",
    })),
    incomes: incomes.map((income) => ({
      amount: Number(income.amount || 0),
      source: income.source,
      date: income.date,
      note: income.note || "",
    })),
  };
}

function buildFallbackAnalysis(expenses, incomes) {
  const digest = buildFinanceDigest(expenses, incomes);
  const topExpense = digest.expenseBreakdown[0];
  const topIncome = digest.incomeBreakdown[0];
  const flexibleSpend = digest.expenseBreakdown
    .filter((item) => ["Food", "Shopping", "Entertainment", "Travel"].includes(item.label))
    .reduce((sum, item) => sum + item.total, 0);
  const suggestedCut = flexibleSpend * 0.15;
  const sipSuggestion = digest.monthlyNet > 0 ? Math.max(1000, Math.round(digest.monthlyNet * 0.25 / 500) * 500) : 0;

  return [
    "Income and cash-flow snapshot",
    `- You have logged income of ${formatCurrency(digest.totalIncome)} and expenses of ${formatCurrency(digest.totalSpent)} overall.`,
    `- This month looks like ${formatCurrency(digest.monthlyIncome)} in income, ${formatCurrency(digest.monthlySpend)} in spend, and ${formatCurrency(digest.monthlyNet)} in net cash flow.`,
    topIncome
      ? `- Your strongest income source is ${topIncome.label} at ${formatCurrency(topIncome.total)}.`
      : "- Add at least one income source to personalize savings and investment advice.",
    "",
    "Spending pressure points",
    topExpense
      ? `- The largest expense category is ${topExpense.label} at ${formatCurrency(topExpense.total)}.`
      : "- Add more expense entries to surface category patterns.",
    digest.savingsRate >= 20
      ? `- Your current monthly savings rate is about ${digest.savingsRate}%, which is healthy if it stays consistent.`
      : `- Your current monthly savings rate is about ${digest.savingsRate}%, so tightening flexible spend would improve your buffer.`,
    "",
    "Personalized next moves",
    `- A realistic short-term saving target is ${formatCurrency(Math.max(suggestedCut, digest.monthlyNet > 0 ? digest.monthlyNet * 0.2 : 1500))} per month.`,
    sipSuggestion > 0
      ? `- If your current cash flow stays stable, a SIP of around ${formatCurrency(sipSuggestion)} could be reasonable after keeping 1-2 months of expenses liquid.`
      : "- Focus on stabilizing monthly surplus first, then start with a small SIP once your cash flow turns positive.",
    "- Keep emergency money in a high-interest savings account or short FD before committing more to investing.",
  ].join("\n");
}

function buildFinanceContext(expenses, incomes) {
  return JSON.stringify(buildFinanceDigest(expenses, incomes), null, 2);
}

function buildFallbackChatReply(messages, expenses, incomes) {
  const latestQuestion =
    [...normalizeMessages(messages)].reverse().find((message) => message.role === "user")?.content || "";
  const summary = buildFallbackAnalysis(expenses, incomes);

  return [
    latestQuestion
      ? `Here is a practical reply based on your latest question: "${latestQuestion}".`
      : "Here is a practical snapshot of your current money system.",
    "",
    summary,
    "",
    "Useful follow-ups:",
    "- What should my ideal monthly split be between spending, saving, and SIP?",
    "- Which category should I cap first to improve cash flow?",
    "- How much emergency fund should I build before investing more?",
  ].join("\n");
}

export async function generateAnalysis(expenses, incomes) {
  if ((!Array.isArray(expenses) || expenses.length === 0) && (!Array.isArray(incomes) || incomes.length === 0)) {
    return {
      analysis: "Add income and expense entries first so MoneyMind AI can generate useful financial guidance.",
      source: "fallback",
    };
  }

  if (!groqClient) {
    return {
      analysis: buildFallbackAnalysis(expenses, incomes),
      source: "fallback",
    };
  }

  try {
    const completion = await groqClient.chat.completions.create({
      model: env.GROQ_MODEL,
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content: advisorPrompt,
        },
        {
          role: "user",
          content: `Here is the user's finance digest in JSON:\n${buildFinanceContext(expenses, incomes)}`,
        },
      ],
    });

    const analysis = completion.choices?.[0]?.message?.content?.trim();

    if (!analysis) {
      return {
        analysis: buildFallbackAnalysis(expenses, incomes),
        source: "fallback",
      };
    }

    return {
      analysis,
      source: "groq",
    };
  } catch {
    return {
      analysis: buildFallbackAnalysis(expenses, incomes),
      source: "fallback",
    };
  }
}

export async function generateFinanceChatReply(messages, expenses, incomes) {
  if ((!Array.isArray(expenses) || expenses.length === 0) && (!Array.isArray(incomes) || incomes.length === 0)) {
    return {
      reply:
        "Add your income and expense entries first, then ask me anything about budgeting, savings, cash flow, SIP, or FD planning.",
      source: "fallback",
    };
  }

  const normalizedMessages = normalizeMessages(messages);

  if (!groqClient) {
    return {
      reply: buildFallbackChatReply(normalizedMessages, expenses, incomes),
      source: "fallback",
    };
  }

  try {
    const completion = await groqClient.chat.completions.create({
      model: env.GROQ_MODEL,
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content: `${advisorPrompt}\nYou are in an interactive coaching chat. Give personalized, concrete answers using the current finance digest. Prefer actionable numbers and trade-offs over generic advice.`,
        },
        {
          role: "system",
          content: `Current finance digest:\n${buildFinanceContext(expenses, incomes)}`,
        },
        ...normalizedMessages,
      ],
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return {
        reply: buildFallbackChatReply(normalizedMessages, expenses, incomes),
        source: "fallback",
      };
    }

    return {
      reply,
      source: "groq",
    };
  } catch {
    return {
      reply: buildFallbackChatReply(normalizedMessages, expenses, incomes),
      source: "fallback",
    };
  }
}
