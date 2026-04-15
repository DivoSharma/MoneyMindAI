import { createClient } from "@supabase/supabase-js";
import { env } from "../config.js";

function createOptions(accessToken) {
  return {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : {},
  };
}

export function createSupabaseClient(accessToken) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, createOptions(accessToken));
}

export async function getAuthenticatedUser(accessToken) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    const authError = new Error("Authentication required.");
    authError.statusCode = 401;
    throw authError;
  }

  return data.user;
}
