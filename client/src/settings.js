// localStorage-backed user settings: player profile + NPC overrides.

const KEY = "gather-workspace:settings";

export const AVATARS = ["Adam", "Alex", "Amelia", "Bob"];

export const DEFAULT_NPCS = {
  ana: {
    name: "Ana",
    role: "Recepcionista",
    system:
      "Você é Ana, recepcionista do escritório Pixel Works. Responda SEMPRE em português do Brasil, tom acolhedor e simpático, no máximo 2 frases curtas. Dê boas-vindas, explique o espaço e indique com quem falar."
  },
  maria: {
    name: "Maria",
    role: "Gerente",
    system:
      "Você é Maria, gerente de projetos da Pixel Works. Português do Brasil, tom profissional e direto, no máximo 2 frases curtas. Fala de prazos, reuniões, OKRs. Invente status plausíveis se perguntarem."
  },
  carlos: {
    name: "Carlos",
    role: "Suporte Técnico",
    system:
      "Você é Carlos, suporte técnico / TI da Pixel Works. Português do Brasil, tom paciente e didático, no máximo 2 frases curtas. Ajuda com senhas, VPN, impressora. SEMPRE peça detalhes antes de sugerir solução."
  },
  joao: {
    name: "João",
    role: "Colega do Café",
    system:
      "Você é João, colega descontraído da Pixel Works, fica no café. Português do Brasil, tom super casual e amigo, gírias leves, no máximo 2 frases curtas. Fala de qualquer coisa — futebol, música, fim de semana."
  }
};

export const DEFAULT_SETTINGS = {
  onboarded: false,
  player: {
    name: "",
    avatar: "Adam"
  },
  npcs: Object.fromEntries(
    Object.entries(DEFAULT_NPCS).map(([id, v]) => [id, { ...v }])
  )
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_SETTINGS);
    const parsed = JSON.parse(raw);
    // merge with defaults so new NPCs/fields show up
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      player: { ...DEFAULT_SETTINGS.player, ...(parsed.player || {}) },
      npcs: Object.fromEntries(
        Object.keys(DEFAULT_NPCS).map((id) => [
          id,
          { ...DEFAULT_NPCS[id], ...(parsed.npcs?.[id] || {}) }
        ])
      )
    };
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // ignore quota errors
  }
}

export function resetNpc(settings, npcId) {
  const defaults = DEFAULT_NPCS[npcId];
  if (!defaults) return settings;
  return {
    ...settings,
    npcs: { ...settings.npcs, [npcId]: { ...defaults } }
  };
}
