# Pixel Works — Workspace 2D

Espaço de trabalho estilo Gather Town, só com chat (sem vídeo). Personagens 2D andam pelo mapa e conversam com NPCs "funcionários" movidos pela Claude API.

## Estrutura

```
gather-workspace/
├── server/   # Node/Express — proxy para Claude API
└── client/   # Vite + React + Canvas — jogo 2D + UI de chat
```

## Pré-requisitos

- Node.js 18+ (testado em 24)
- [Ollama](https://ollama.com/) rodando localmente com o modelo baixado:
  ```bash
  ollama pull llama3.2:3b
  ```

## Instalação

```bash
cd server && npm install
cd ../client && npm install
```

## Configurar (opcional)

Se quiser mudar URL/modelo do Ollama:

```bash
cd server
copy .env.example .env
# edite se precisar trocar OLLAMA_MODEL ou OLLAMA_URL
```

Se deixar tudo default (Ollama em `localhost:11434`, modelo `llama3.2:3b`), nem precisa de `.env`.

## Rodar

Em três terminais:

```bash
# terminal 0 — Ollama (se ainda não estiver rodando)
ollama serve

# terminal 1 — servidor Node (porta 3001)
cd server && npm run dev

# terminal 2 — cliente (porta 5173)
cd client && npm run dev
```

Abra http://localhost:5173

## Controles

- `WASD` ou `setas` — mover
- `E` — falar com o NPC mais próximo
- `Enter` — enviar mensagem no chat
- `Esc` — tirar foco do chat para voltar a mover

## NPCs atuais

| Nome  | Papel              | Onde fica            |
|-------|--------------------|-----------------------|
| Ana   | Recepcionista     | Recepção (topo)       |
| Bruno | Gerente de Projetos | Sala de Reunião     |
| Carla | Dev Sênior         | Área Dev (bullpen)   |
| Diego | Suporte / TI       | Cantinho do suporte  |

Personalidade e prompts em `server/npcs.js`.

## Trocar por sprites LPC (opcional)

Os personagens são desenhados por código em `client/src/game/SpriteGen.js`. Para usar sprites LPC de verdade:

1. Baixe um spritesheet LPC (ex.: https://opengameart.org/content/lpc-medieval-fantasy-character-sprites)
2. Coloque em `client/public/assets/sprites/`
3. Substitua `drawCharacter` por um `ctx.drawImage` com o frame correto baseado em `dir` e `phase`

## Zonas

Definidas em `client/src/game/Map.js` em `ZONES`. Algumas marcadas como `private: true` aparecem com indicador azul no badge.

## Modelo usado

Por padrão `llama3.2:3b` via Ollama local (grátis, roda na sua máquina). Troque em `server/.env` via `OLLAMA_MODEL` — qualquer modelo que você já tenha baixado com `ollama pull`.

Verifique saúde em http://localhost:3001/api/health — mostra se Ollama está rodando e se o modelo está disponível.
