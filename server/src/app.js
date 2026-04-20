import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env, getMissingServerEnv } from "./config.js";
import { normalizeMessages } from "./lib/validation.js";
import { generateAnalysis, generateFinanceChatReply } from "./services/analysis-service.js";
import { requireRequestContext } from "./services/auth-service.js";
import { addExpense, listExpenses } from "./services/expense-service.js";
import { addIncome, listIncomes } from "./services/income-service.js";

const app = express();
const api = express.Router();
const vercelAppDomainPattern = /^https:\/\/[a-z0-9-]+(?:-[a-z0-9-]+)*\.vercel\.app$/i;
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 180,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please slow down and try again shortly.",
  },
});
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 24,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "AI analysis is being used too quickly. Please wait a moment and try again.",
  },
});

app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === env.CLIENT_ORIGIN || vercelAppDomainPattern.test(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by MoneyMind AI API."));
    },
  })
);
app.use(express.json({ limit: "24kb" }));
api.use(apiLimiter);

async function withAuth(request, response, handler) {
  try {
    const context = await requireRequestContext(request);
    await handler(context);
  } catch (error) {
    const statusCode = error.statusCode || 500;

    if (statusCode >= 500) {
      console.error("MoneyMind API error", error);
    }

    response.status(statusCode).json({
      error: statusCode >= 500 ? "Something went wrong while handling your request." : error.message,
    });
  }
}

api.get("/health", (_request, response) => {
  const missingEnv = getMissingServerEnv();

  response.json({
    status: missingEnv.length === 0 ? "ok" : "degraded",
    missingEnv,
  });
});

api.get("/expenses", async (request, response) => {
  await withAuth(request, response, async (context) => {
    const expenses = await listExpenses(context);
    response.json({ expenses });
  });
});

api.post("/expenses", async (request, response) => {
  await withAuth(request, response, async (context) => {
    const expense = await addExpense(context, request.body || {});
    response.status(201).json({ expense });
  });
});

api.get("/incomes", async (request, response) => {
  await withAuth(request, response, async (context) => {
    const incomes = await listIncomes(context);
    response.json({ incomes });
  });
});

api.post("/incomes", async (request, response) => {
  await withAuth(request, response, async (context) => {
    const income = await addIncome(context, request.body || {});
    response.status(201).json({ income });
  });
});

api.post("/analyze", aiLimiter, async (request, response) => {
  await withAuth(request, response, async (context) => {
    const expenses = await listExpenses(context);
    const incomes = await listIncomes(context);
    const result = await generateAnalysis(expenses, incomes);
    response.json(result);
  });
});

api.post("/chat", aiLimiter, async (request, response) => {
  await withAuth(request, response, async (context) => {
    const expenses = await listExpenses(context);
    const incomes = await listIncomes(context);
    const messages = normalizeMessages(request.body?.messages || []);
    const result = await generateFinanceChatReply(messages, expenses, incomes);
    response.json(result);
  });
});

app.use(api);
app.use("/api", api);

export default app;
