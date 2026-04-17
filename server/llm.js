// LLM provider abstraction. Supports Ollama (local) and Groq (cloud, free tier).

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export function activeProvider() {
  return (process.env.LLM_PROVIDER || "ollama").toLowerCase();
}

export function providerInfo() {
  const p = activeProvider();
  return p === "groq"
    ? { provider: "groq", model: GROQ_MODEL, hasKey: !!process.env.GROQ_API_KEY }
    : { provider: "ollama", url: OLLAMA_URL, model: OLLAMA_MODEL };
}

export async function chat(messages, { temperature = 0.8, maxTokens = 200 } = {}) {
  const p = activeProvider();
  if (p === "groq") return chatGroq(messages, { temperature, maxTokens });
  return chatOllama(messages, { temperature, maxTokens });
}

async function chatOllama(messages, { temperature, maxTokens }) {
  const r = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      options: { temperature, num_predict: maxTokens }
    })
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Ollama ${r.status}: ${text.slice(0, 200)}`);
  }
  const data = await r.json();
  const reply = (data?.message?.content || "").trim();
  if (!reply) throw new Error("resposta vazia do modelo");
  return reply;
}

async function chatGroq(messages, { temperature, maxTokens }) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY não definida no .env");
  }
  const r = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens
    })
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Groq ${r.status}: ${text.slice(0, 200)}`);
  }
  const data = await r.json();
  const reply = (data?.choices?.[0]?.message?.content || "").trim();
  if (!reply) throw new Error("resposta vazia do modelo");
  return reply;
}

export async function ollamaHealth() {
  try {
    const r = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!r.ok) return { ollamaRunning: false, modelAvailable: false, models: [] };
    const data = await r.json();
    const models = (data.models || []).map((m) => m.name);
    return {
      ollamaRunning: true,
      modelAvailable: models.includes(OLLAMA_MODEL),
      models
    };
  } catch {
    return { ollamaRunning: false, modelAvailable: false, models: [] };
  }
}
