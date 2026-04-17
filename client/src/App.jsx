import React, { useEffect, useRef, useState } from "react";
import { Game } from "./game/Game.js";
import { ChatPanel } from "./ui/ChatPanel.jsx";
import { OnboardingModal } from "./ui/OnboardingModal.jsx";
import { ConfigPanel } from "./ui/ConfigPanel.jsx";
import { loadSettings, saveSettings } from "./settings.js";

const NPC_COLORS = {
  ana: "#e05a7b",
  maria: "#7a2a5a",
  joao: "#d4a017",
  carlos: "#2d7a4a"
};

export default function App() {
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const [settings, setSettings] = useState(() => loadSettings());
  const [zone, setZone] = useState(null);
  const [nearbyId, setNearbyId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [chatFocused, setChatFocused] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  // persist settings on every change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // apply avatar changes live
  useEffect(() => {
    gameRef.current?.setPlayerAvatar(settings.player.avatar);
  }, [settings.player.avatar]);

  // start game once (only after onboarded)
  useEffect(() => {
    if (!settings.onboarded) return;
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const resize = () => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      canvas.width = w;
      canvas.height = h;
      gameRef.current?.resize(w, h);
    };
    resize();

    const game = new Game(canvas, {
      onZoneChange: (z) => setZone(z),
      onNearbyNPCChange: (n) => setNearbyId(n?.id || null),
      onInteract: (n) => setActiveId(n.id)
    });
    game.setPlayerAvatar(settings.player.avatar);
    gameRef.current = game;
    game.start();

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      game.stop();
      gameRef.current = null;
    };
  }, [settings.onboarded]);

  useEffect(() => {
    gameRef.current?.setInputEnabled(!chatFocused && !configOpen);
  }, [chatFocused, configOpen]);

  useEffect(() => {
    if (activeId && nearbyId !== activeId) setActiveId(null);
  }, [nearbyId, activeId]);

  function finishOnboarding({ name, avatar }) {
    setSettings((s) => ({ ...s, onboarded: true, player: { name, avatar } }));
  }

  function npcForChat(id) {
    if (!id) return null;
    const override = settings.npcs[id];
    return {
      id,
      name: override?.name || id,
      role: override?.role || "",
      color: NPC_COLORS[id] || "#888",
      system: override?.system || ""
    };
  }

  const activeNPC = npcForChat(activeId);
  const nearbyNPC = npcForChat(nearbyId);

  if (!settings.onboarded) {
    return <OnboardingModal onDone={finishOnboarding} />;
  }

  return (
    <div className="app">
      <div className="stage" ref={stageRef}>
        <canvas className="game" ref={canvasRef} />
        <div className="topbar">
          <div className="zone-badge">
            📍 <span className="zone-name">{zone?.name || "Saguão"}</span>
            {zone?.private && (
              <span style={{ marginLeft: 8, color: "#7ab8ff" }}>• zona privada</span>
            )}
          </div>
          <div className="topbar-right">
            <div className="help">
              <kbd>WASD</kbd>/setas mover · <kbd>E</kbd> falar
            </div>
            <button
              className="gear"
              onClick={() => setConfigOpen(true)}
              title="Configurações"
              aria-label="Abrir configurações"
            >
              ⚙
            </button>
          </div>
        </div>
        {nearbyNPC && !activeNPC && (
          <div className="proximity-hint">
            Pressione <kbd>E</kbd> para falar com <b>{nearbyNPC.name}</b>
          </div>
        )}
      </div>
      <ChatPanel
        npc={activeNPC}
        playerName={settings.player.name}
        onFocusChange={setChatFocused}
      />
      {configOpen && (
        <ConfigPanel
          settings={settings}
          onChange={setSettings}
          onClose={() => setConfigOpen(false)}
        />
      )}
    </div>
  );
}
