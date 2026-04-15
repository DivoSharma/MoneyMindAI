import { createSupabaseClient, getAuthenticatedUser } from "../lib/supabase.js";

function buildAuthError(message = "Authentication required.") {
  const error = new Error(message);
  error.statusCode = 401;
  return error;
}

function extractBearerToken(authorizationHeader) {
  if (!authorizationHeader) {
    return "";
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return "";
  }

  return token.trim();
}

export async function requireRequestContext(request) {
  const accessToken = extractBearerToken(request.headers.authorization);

  if (!accessToken) {
    throw buildAuthError();
  }

  const user = await getAuthenticatedUser(accessToken);
  const email = String(user.email || "").trim().toLowerCase();

  if (!email) {
    throw buildAuthError("Your account is missing an email address.");
  }

  return {
    supabase: createSupabaseClient(accessToken),
    user: {
      id: user.id,
      email,
    },
  };
}
