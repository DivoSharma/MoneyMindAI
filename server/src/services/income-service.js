import { ensureUserProfile } from "./expense-service.js";
import { normalizeAmount, normalizeDate, normalizeText } from "../lib/validation.js";

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
  const amount = normalizeAmount(payload.amount);
  const source = normalizeText(payload.source, {
    allowEmpty: false,
    field: "Income source",
    maxLength: 60,
  });
  const date = normalizeDate(payload.date);
  const note = normalizeText(payload.note, {
    field: "Note",
    maxLength: 240,
  });

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
