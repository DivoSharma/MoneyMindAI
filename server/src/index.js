import cors from "cors";
import express from "express";
import { env } from "./config.js";
import { generateAnalysis } from "./services/analysis-service.js";
import { requireRequestContext } from "./services/auth-service.js";
import { addExpense, listExpenses } from "./services/expense-service.js";

const app = express();

app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
  })
);
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

async function withAuth(request, response, handler) {
  try {
    const context = await requireRequestContext(request);
    await handler(context);
  } catch (error) {
    response.status(error.statusCode || 500).json({
      error: error.message || "Something went wrong while handling your request.",
    });
  }
}

app.get("/expenses", async (request, response) => {
  await withAuth(request, response, async (context) => {
    const expenses = await listExpenses(context);
    response.json({ expenses });
  });
});

app.post("/expenses", async (request, response) => {
  await withAuth(request, response, async (context) => {
    const expense = await addExpense(context, request.body || {});
    response.status(201).json({ expense });
  });
});

app.post("/analyze", async (request, response) => {
  await withAuth(request, response, async (context) => {
    const expenses = await listExpenses(context);
    const result = await generateAnalysis(expenses);
    response.json(result);
  });
});

app.listen(env.PORT, () => {
  console.log(`MoneyMind AI server listening on http://localhost:${env.PORT}`);
});
