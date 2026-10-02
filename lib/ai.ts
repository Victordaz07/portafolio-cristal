import Anthropic from "@anthropic-ai/sdk";

// Modelo de Claude para las funciones de IA del panel (captions, sugerencias).
export const AI_MODEL = "claude-opus-5-5";

export function isAiConfigured() {
  return !!process.env.ANTHROPIC_API_KEY;
}

let client: Anthropic | null = null;

export function getAiClient() {
  client ??= new Anthropic(); // lee ANTHROPIC_API_KEY del entorno
  return client;
}
