import { env } from "./config.js";
import app from "./app.js";

app.listen(env.PORT, () => {
  console.log(`MoneyMind AI server listening on http://localhost:${env.PORT}`);
});
