import { ensureUserProfile } from "./expense-service.js";

function buildValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function normalizeDate(value) {
  const normalized = String(value || "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw buildValidationError("Date must be in YYYY-MM-DD format.");
  }

  return normalized;
}

export async function listIncomes(context) {
  const user = await ensureUserProfile(context);

  const { data, error } = await context.supabase
    .from("incomes")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to fetch incomes: ${error.message}`);
  }

  return data || [];
}

export async function addIncome(context, payload) {
  const amount = Number(payload.amount);
  const source = String(payload.source || "").trim();
  const date = normalizeDate(payload.date);
  const note = String(payload.note || "").trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    throw buildValidationError("Amount must be a positive number.");
  }

  if (!source) {
    throw buildValidationError("Income source is required.");
  }

  const user = await ensureUserProfile(context);

  const { data, error } = await context.supabase
    .from("incomes")
    .insert({
      user_id: user.id,
      amount,
      source,
      date,
      note: note || null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Unable to save income: ${error.message}`);
  }

  return data;
}
