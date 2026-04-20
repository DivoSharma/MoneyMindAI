import "dotenv/config";

function readEnv(name, fallbackNames = []) {
  const candidateNames = [name, ...fallbackNames];

  for (const candidateName of candidateNames) {
    const value = process.env[candidateName];

    if (value) {
      return value;
    }
  }

  return "";
}

export const env = {
  PORT: Number(process.env.PORT || 5000),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  SUPABASE_URL: readEnv("SUPABASE_URL"),
  SUPABASE_PUBLISHABLE_KEY: readEnv("SUPABASE_PUBLISHABLE_KEY", ["SUPABASE_KEY"]),
  GROQ_API_KEY: process.env.GROQ_API_KEY || "",
  GROQ_MODEL: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
};

export function getMissingServerEnv() {
  const missing = [];

  if (!env.SUPABASE_URL) {
    missing.push("SUPABASE_URL");
  }

  if (!env.SUPABASE_PUBLISHABLE_KEY) {
    missing.push("SUPABASE_PUBLISHABLE_KEY");
  }

  return missing;
}

export function assertServerEnv() {
  const missing = getMissingServerEnv();

  if (missing.length === 0) {
    return;
  }

  const error = new Error(`Missing required environment variables: ${missing.join(", ")}`);
  error.statusCode = 500;
  throw error;
}
