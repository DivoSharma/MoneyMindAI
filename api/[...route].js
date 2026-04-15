import app from "../server/src/app.js";

export default function handler(request, response) {
  const originalUrl = request.url || "/";
  request.url = originalUrl.replace(/^\/api/, "") || "/";
  return app(request, response);
}
