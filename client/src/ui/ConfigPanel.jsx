import React, { useState } from "react";
import { AVATARS, DEFAULT_NPCS, resetNpc } from "../settings.js";

const NPC_IDS = ["ana", "maria", "carlos", "joao"];

export function ConfigPanel({ settings, onChange, onClose }) {
  const [tab, setTab] = useState("player");

  function updatePlayer(patch) {
    onChange({ ...settings, player: { ...settings.player, ...patch } });
  }

  function updateNpc(id, patch) {
    onChange({
      ...settings,
      npcs: { ...settings.npcs, [id]: { ...settings.npcs[id], ...patch } }
    });
  }

  function doResetNpc(id) {
    onChange(resetNpc(settings, id));
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal config" onClick={(e) => e.stopPropagation()}>
        <header className="config-header">
          <h2>Configurações</h2>
          <button className="ghost" onClick={onClose}>✕</button>
        </header>

        <nav className="config-tabs">
          <button className={tab === "player" ? "active" : ""} onClick={() => setTab("player")}>
            Você
          </button>
          {NPC_IDS.map((id) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id)}
            >
              {settings.npcs[id].name}
            </button>
          ))}
        </nav>

        <div className="config-body">
          {tab === "player" && (
            <div className="config-section">
              <label>Seu nome</label>
              <input
                value={settings.player.name}
                onChange={(e) => updatePlayer({ name: e.target.value })}
                maxLength={20}
              />
              <label>Avatar</label>
              <div className="avatar-grid small">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    className={`avatar-opt ${settings.player.avatar === a ? "selected" : ""}`}
                    onClick={() => updatePlayer({ avatar: a })}
                  >
                    <img src={`/assets/Characters_free/${a}_idle_16x16.png`} alt={a} />
                    <span>{a}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {NPC_IDS.includes(tab) && (
            <div className="config-section">
              <label>Nome</label>
              <input
                value={settings.npcs[tab].name}
                onChange={(e) => updateNpc(tab, { name: e.target.value })}
                maxLength={30}
              />
              <label>Cargo</label>
              <input
                value={settings.npcs[tab].role}
                onChange={(e) => updateNpc(tab, { role: e.target.value })}
                maxLength={40}
              />
              <label>
                Personalidade (system prompt)
                <span className="hint">— controla como o NPC responde</span>
              </label>
              <textarea
                value={settings.npcs[tab].system}
                onChange={(e) => updateNpc(tab, { system: e.target.value })}
                rows={8}
              />
              <div className="config-actions">
                <button className="ghost" onClick={() => doResetNpc(tab)}>
                  Restaurar padrão
                </button>
              </div>
            </div>
          )}
        </div>

        <footer className="config-footer">
          <span className="hint">As mudanças salvam automaticamente no seu navegador.</span>
          <button className="primary" onClick={onClose}>Pronto</button>
        </footer>
      </div>
    </div>
  );
}
