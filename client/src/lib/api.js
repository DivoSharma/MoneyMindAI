import { supabase } from "./supabase";

const defaultApiBaseUrl = import.meta.env.DEV ? "http://localhost:5000/api" : "/api";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl).replace(/\/$/, "");

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token
        ? {
            Authorization: `Bearer ${session.access_token}`,
          }
        : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await safeJson(response);

  if (!response.ok) {
    throw new Error(data?.error || "Something went wrong while talking to the server.");
  }

  return data;
}

export function getExpenses() {
  return request("/expenses");
}

export function createExpense(payload) {
  return request("/expenses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function analyzeExpenses() {
  return request("/analyze", {
    method: "POST",
    body: JSON.stringify({}),
  });
}
