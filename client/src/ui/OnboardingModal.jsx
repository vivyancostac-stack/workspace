import React, { useState } from "react";
import { AVATARS } from "../settings.js";

export function OnboardingModal({ onDone }) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("Adam");

  function submit(e) {
    e.preventDefault();
    const clean = name.trim() || "Visitante";
    onDone({ name: clean, avatar });
  }

  return (
    <div className="modal-bg">
      <form className="modal onboarding" onSubmit={submit}>
        <h1>Bem-vindo(a) à Pixel Works</h1>
        <p className="subtitle">Como podemos te chamar?</p>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome"
          maxLength={20}
        />
        <p className="subtitle" style={{ marginTop: 18 }}>Escolha seu avatar:</p>
        <div className="avatar-grid">
          {AVATARS.map((a) => (
            <button
              type="button"
              key={a}
              className={`avatar-opt ${avatar === a ? "selected" : ""}`}
              onClick={() => setAvatar(a)}
            >
              <img src={`/assets/Characters_free/${a}_idle_16x16.png`} alt={a} />
              <span>{a}</span>
            </button>
          ))}
        </div>
        <button className="primary" type="submit">Entrar no escritório</button>
      </form>
    </div>
  );
}
