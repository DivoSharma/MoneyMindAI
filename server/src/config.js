import "dotenv/config";

function readRequiredEnv(name, fallbackNames = []) {
  const candidateNames = [name, ...fallbackNames];

  for (const candidateName of candidateNames) {
    const value = process.env[candidateName];

    if (value) {
      return value;
    }
  }

  throw new Error(`Missing required environment variable: ${name}`);
}

export const env = {
  PORT: Number(process.env.PORT || 5000),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  SUPABASE_URL: readRequiredEnv("SUPABASE_URL"),
  SUPABASE_PUBLISHABLE_KEY: readRequiredEnv("SUPABASE_PUBLISHABLE_KEY", ["SUPABASE_KEY"]),
  GROQ_API_KEY: process.env.GROQ_API_KEY || "",
  GROQ_MODEL: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
};
