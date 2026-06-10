# Extremamente Calmo 🧘

O gerador de mantras inspirado no podcast **Extremamente Desagradável** de Joana Marques.

---

## Deploy no Vercel (5 minutos)

### 1. Instala dependências localmente (opcional, só para testar)
```bash
npm install
npm run dev
```

### 2. Faz upload para GitHub
- Cria um repo no GitHub
- Faz push deste projeto

### 3. Liga ao Vercel
- Vai a [vercel.com](https://vercel.com)
- "Add New Project" → importa o repo do GitHub
- Vercel deteta automaticamente que é Next.js

### 4. Adiciona as variáveis de ambiente
No dashboard do Vercel, vai a **Settings → Environment Variables** e adiciona:

| Nome | Valor |
|------|-------|
| `ANTHROPIC_API_KEY` | A tua chave da Anthropic |
| `GOOGLE_TTS_API_KEY` | A tua chave do Google Cloud TTS |

### 5. Deploy
Clica **Deploy**. Em 2 minutos tens o site live em `https://extremamente-calmo.vercel.app` (ou nome à tua escolha).

---

## Estrutura

```
extremamente-calmo-next/
├── pages/
│   ├── _app.js          # App wrapper
│   ├── index.js         # Frontend completo (3 ecrãs)
│   └── api/
│       ├── mantra.js    # Gera o mantra via Anthropic (server-side)
│       └── speak.js     # Google WaveNet TTS (server-side)
├── styles/
│   └── globals.css
├── .env.example         # Template das variáveis de ambiente
└── package.json
```

## Como funciona

- As API keys **nunca chegam ao browser** — ficam apenas nos servidores da Vercel
- `/api/mantra` recebe a situação → chama Claude → devolve JSON com título e mantra
- `/api/speak` recebe o texto → chama Google WaveNet pt-BR-Wavenet-A → devolve MP3 em base64
- O frontend toca o MP3 com animação de onda estilo Siri e letras estilo Apple Music

## Voz
`pt-BR-Wavenet-A` — voz feminina do Google WaveNet, velocidade 0.85, pitch -1.0.
É a mesma família de vozes usada no podcast.
