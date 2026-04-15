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

async function ensureUserProfile(context) {
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
  const amount = Number(payload.amount);
  const category = String(payload.category || "").trim();
  const date = normalizeDate(payload.date);
  const note = String(payload.note || "").trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    throw buildValidationError("Amount must be a positive number.");
  }

  if (!category) {
    throw buildValidationError("Category is required.");
  }

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
