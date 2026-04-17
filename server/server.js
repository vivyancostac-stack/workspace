import "dotenv/config";
import express from "express";
import cors from "cors";
import { getNPC, listNPCs } from "./npcs.js";
import { chat, providerInfo, ollamaHealth, activeProvider } from "./llm.js";

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", async (_req, res) => {
  const info = providerInfo();
  const extra = info.provider === "ollama" ? await ollamaHealth() : {};
  res.json({ ok: true, ...info, ...extra });
});

app.get("/api/npcs", (_req, res) => {
  res.json(listNPCs());
});

app.post("/api/npc/chat", async (req, res) => {
  const { npcId, history = [], message, system: systemOverride } = req.body || {};
  const npc = getNPC(npcId);
  if (!npc) return res.status(404).json({ error: "NPC não encontrado" });
  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "message obrigatório" });
  }

  const systemPrompt = (typeof systemOverride === "string" && systemOverride.trim())
    ? systemOverride.trim()
    : npc.system;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: message }
  ];

  try {
    const reply = await chat(messages);
    res.json({ npcId, reply });
  } catch (err) {
    console.error("[server] chat error:", err?.message || err);
    res.status(500).json({ error: err?.message || "erro desconhecido" });
  }
});

app.listen(PORT, () => {
  const info = providerInfo();
  console.log(`[server] rodando em http://localhost:${PORT}`);
  console.log(`[server] provider: ${info.provider} modelo: ${info.model}`);
  if (info.provider === "groq" && !info.hasKey) {
    console.warn("[server] AVISO: GROQ_API_KEY não definida em .env — chamadas vão falhar.");
  }
});
