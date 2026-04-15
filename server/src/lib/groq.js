import Groq from "groq-sdk";
import { env } from "../config.js";

export const groqClient = env.GROQ_API_KEY ? new Groq({ apiKey: env.GROQ_API_KEY }) : null;
