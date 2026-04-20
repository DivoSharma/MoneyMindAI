import { env } from "../config.js";
import { groqClient } from "../lib/groq.js";

const advisorPrompt =
  "You are a personal finance advisor for a young Indian user.\nAnalyze their expenses and provide:\n1. Spending breakdown\n2. Bad habits\n3. Monthly savings potential\n4. Investment suggestions (FD, SIP)\n\nKeep it simple, actionable, and friendly.";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function buildExpenseDigest(expenses) {
  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const categoryTotals = expenses.reduce((accumulator, expense) => {
    accumulator[expense.category] = (accumulator[expense.category] || 0) + Number(expense.amount || 0);
    return accumulator;
  }, {});

  return {
    totalSpent,
    transactions: expenses.length,
    categoryTotals,
    expenses: expenses.map((expense) => ({
      amount: Number(expense.amount || 0),
      category: expense.category,
      date: expense.date,
      note: expense.note || "",
    })),
  };
}

function buildFallbackAnalysis(expenses) {
  const digest = buildExpenseDigest(expenses);
  const categoryEntries = Object.entries(digest.categoryTotals).sort((left, right) => right[1] - left[1]);
  const topCategory = categoryEntries[0];
  const discretionarySpend = categoryEntries
    .filter(([category]) => ["Food", "Shopping", "Entertainment", "Travel"].includes(category))
    .reduce((sum, [, total]) => sum + total, 0);
  const savingsPotential = discretionarySpend * 0.2;

  return [
    "Spending breakdown",
    `- You logged ${digest.transactions} expenses totaling ${formatCurrency(digest.totalSpent)}.`,
    topCategory
      ? `- Your highest spend category is ${topCategory[0]} at ${formatCurrency(topCategory[1])}.`
      : "- Add more expenses to identify your top category.",
    "",
    "Bad habits",
    discretionarySpend > digest.totalSpent * 0.4
      ? "- Discretionary spending is quite high. Dining out, shopping, or entertainment may be eating into savings."
      : "- Your spend looks fairly balanced, but watch repeat small purchases that quietly add up.",
    "",
    "Monthly savings potential",
    `- If you trim just 20% from flexible categories, you could save around ${formatCurrency(savingsPotential)} per month.`,
    "",
    "Investment suggestions (FD, SIP)",
    savingsPotential >= 5000
      ? "- Keep 1-2 months of expenses in a high-yield savings account or FD, then start a SIP in a broad index mutual fund."
      : "- Start with a small emergency fund in a short FD, then begin a modest SIP once your savings habit feels steady.",
  ].join("\n");
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter((message) => ["user", "assistant"].includes(message?.role))
    .map((message) => ({
      role: message.role,
      content: String(message.content || "").trim(),
    }))
    .filter((message) => message.content)
    .slice(-12);
}

function buildExpenseContext(expenses) {
  return JSON.stringify(buildExpenseDigest(expenses), null, 2);
}

function buildFallbackChatReply(messages, expenses) {
  const latestQuestion =
    [...normalizeMessages(messages)].reverse().find((message) => message.role === "user")?.content || "";
  const summary = buildFallbackAnalysis(expenses);

  return [
    latestQuestion
      ? `Here is a practical answer based on your latest question: "${latestQuestion}".`
      : "Here is a practical snapshot of your current money flow.",
    "",
    summary,
    "",
    "Ask follow-up questions like:",
    "- How can I reduce food spending without feeling restricted?",
    "- What SIP amount looks realistic for my current budget?",
    "- Build me a weekly spending limit for the rest of this month.",
  ].join("\n");
}

export async function generateAnalysis(expenses) {
  if (!Array.isArray(expenses) || expenses.length === 0) {
    return {
      analysis: "Add a few expenses first so MoneyMind AI can generate useful financial guidance.",
      source: "fallback",
    };
  }

  if (!groqClient) {
    return {
      analysis: buildFallbackAnalysis(expenses),
      source: "fallback",
    };
  }

  try {
    const completion = await groqClient.chat.completions.create({
      model: env.GROQ_MODEL,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: advisorPrompt,
        },
        {
          role: "user",
          content: `Here are the user's expenses in JSON:\n${JSON.stringify(buildExpenseDigest(expenses), null, 2)}`,
        },
      ],
    });

    const analysis = completion.choices?.[0]?.message?.content?.trim();

    if (!analysis) {
      return {
        analysis: buildFallbackAnalysis(expenses),
        source: "fallback",
      };
    }

    return {
      analysis,
      source: "groq",
    };
  } catch {
    return {
      analysis: buildFallbackAnalysis(expenses),
      source: "fallback",
    };
  }
}

export async function generateFinanceChatReply(messages, expenses) {
  if (!Array.isArray(expenses) || expenses.length === 0) {
    return {
      reply:
        "Add a few expenses first, then ask me anything about budgeting, savings, or SIP and FD planning.",
      source: "fallback",
    };
  }

  const normalizedMessages = normalizeMessages(messages);

  if (!groqClient) {
    return {
      reply: buildFallbackChatReply(normalizedMessages, expenses),
      source: "fallback",
    };
  }

  try {
    const completion = await groqClient.chat.completions.create({
      model: env.GROQ_MODEL,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: `${advisorPrompt}\nYou are now in an interactive chat. Answer follow-up questions using the current expense context, use INR, and keep the advice concrete and concise.`,
        },
        {
          role: "system",
          content: `Current expense digest:\n${buildExpenseContext(expenses)}`,
        },
        ...normalizedMessages,
      ],
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return {
        reply: buildFallbackChatReply(normalizedMessages, expenses),
        source: "fallback",
      };
    }

    return {
      reply,
      source: "groq",
    };
  } catch {
    return {
      reply: buildFallbackChatReply(normalizedMessages, expenses),
      source: "fallback",
    };
  }
}
