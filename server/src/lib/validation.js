const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

export function buildValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

export function normalizeAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw buildValidationError("Amount must be a positive number.");
  }

  return Math.round(amount * 100) / 100;
}

export function normalizeDate(value) {
  const normalized = String(value || "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw buildValidationError("Date must be in YYYY-MM-DD format.");
  }

  return normalized;
}

export function normalizeText(value, options = {}) {
  const {
    allowEmpty = true,
    field = "Text",
    maxLength = 240,
  } = options;

  const normalized = String(value || "")
    .replace(CONTROL_CHARS, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!allowEmpty && !normalized) {
    throw buildValidationError(`${field} is required.`);
  }

  if (normalized.length > maxLength) {
    throw buildValidationError(`${field} must be ${maxLength} characters or fewer.`);
  }

  return normalized;
}

export function normalizeMessages(messages) {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter((message) => ["user", "assistant"].includes(message?.role))
    .map((message) => ({
      role: message.role,
      content: normalizeText(message.content, {
        allowEmpty: false,
        field: "Message",
        maxLength: 1200,
      }),
    }))
    .slice(-12);
}
