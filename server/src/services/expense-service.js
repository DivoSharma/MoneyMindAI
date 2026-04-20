import { normalizeAmount, normalizeDate, normalizeText } from "../lib/validation.js";

export async function ensureUserProfile(context) {
  const { data, error } = await context.supabase
    .from("users")
    .upsert(
      {
        id: context.user.id,
        email: context.user.email,
      },
      { onConflict: "id" }
    )
    .select("id, email")
    .single();

  if (error) {
    throw new Error(`Unable to prepare user profile: ${error.message}`);
  }

  return data;
}

export async function listExpenses(context) {
  const user = await ensureUserProfile(context);

  const { data, error } = await context.supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to fetch expenses: ${error.message}`);
  }

  return data || [];
}

export async function addExpense(context, payload) {
  const amount = normalizeAmount(payload.amount);
  const category = normalizeText(payload.category, {
    allowEmpty: false,
    field: "Category",
    maxLength: 60,
  });
  const date = normalizeDate(payload.date);
  const note = normalizeText(payload.note, {
    field: "Note",
    maxLength: 240,
  });

  const user = await ensureUserProfile(context);

  const { data, error } = await context.supabase
    .from("expenses")
    .insert({
      user_id: user.id,
      amount,
      category,
      date,
      note: note || null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Unable to save expense: ${error.message}`);
  }

  return data;
}
