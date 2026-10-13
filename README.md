# Sight AI

A JARVIS-style real-time visual intelligence assistant built with **React Native (Expo + TypeScript)** and a **Node.js / Express** backend. Point your phone camera at anything, start scanning, and Sight AI analyzes each frame with a vision-capable model—updating independent intelligence panels with real observations from the captured image.

> **Cost warning:** Continuous scanning uploads an image on every interval (default 5s) to an external AI provider. That incurs API usage and potentially monetary costs. Pause or stop scanning when you are not actively using the assistant.

## Features

- Live camera preview with futuristic scanning HUD
- Explicit Start / Pause / Resume / Stop scanning controls
- Configurable capture interval (default 5 seconds)
- Overlap-safe analysis pipeline (no concurrent AI requests)
- Structured vision panels: scene, objects, intelligence, OCR, spatial, insights
- Ask Jarvis Q&A about the latest captured frame
- API keys stay on the backend only
- Zod-validated model JSON responses

## Prerequisites

- Node.js **20.19+** or **22.13+** recommended (Expo SDK 57)
- npm 10+
- Expo Go on a physical device **or** iOS Simulator / Android Emulator
- An OpenAI API key (or compatible vision provider) with a vision-capable model

## Project structure

```
/
  app/                 Expo Router screens
  src/                 Mobile UI, hooks, services, types
  backend/             Express vision API
  .env.example         Mobile API URL template
  backend/.env.example AI secrets template
```

## 1. Install dependencies

```bash
# Mobile app
npm install --legacy-peer-deps

# Backend
cd backend
npm install
cd ..
```

## 2. Configure the AI backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
AI_API_KEY=sk-your-real-key
AI_MODEL=gpt-4o-mini
PORT=4000
CLIENT_ORIGIN=*
```

- `AI_API_KEY` is required. Without it the API returns a clear `AI_NOT_CONFIGURED` error (no fake analysis).
- `AI_MODEL` can be any configured vision-capable model (e.g. `gpt-4o-mini`, `gpt-4o`).
- Optional: `AI_BASE_URL` for Azure OpenAI, OpenRouter, or a local proxy.

**Never** put private AI keys in Expo / `EXPO_PUBLIC_*` variables.

## 3. Configure the mobile API URL

```bash
cp .env.example .env
```

| Environment | `EXPO_PUBLIC_API_URL` |
| --- | --- |
| iOS Simulator | `http://localhost:4000` |
| Android Emulator | `http://10.0.2.2:4000` |
| Physical phone | `http://YOUR_LAN_IP:4000` (same Wi-Fi as your computer) |

If unset, the app tries to infer a LAN host from Expo and falls back to localhost / `10.0.2.2`.

Find your LAN IP:

```bash
# macOS
ipconfig getifaddr en0
```

## 4. Start the backend

```bash
npm run backend
# or: cd backend && npm run dev
```

Health check: [http://localhost:4000/api/health](http://localhost:4000/api/health)

## 5. Start the Expo app

```bash
npm start
```

Then press `i` / `a`, or scan the QR code with Expo Go.

### Camera permissions

1. Open the app and read the privacy explanation.
2. Tap **Grant Camera Access**.
3. If denied permanently, enable Camera for Sight AI / Expo Go in system Settings.
4. Tap **Start Scanning** — frames are only captured while scanning is active.

## API endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Service + AI configuration status |
| `POST` | `/api/vision/analyze` | Multipart field `image` → structured analysis |
| `POST` | `/api/vision/ask` | Multipart `image` + `question` → grounded answer |

Images are processed in memory and are **not** persisted on disk.

## Switching models

Set `AI_MODEL` in `backend/.env` and restart the backend. Use a model that accepts image input. Example:

```env
AI_MODEL=gpt-4o
```

## Troubleshooting

### Camera

- Use a physical device for the most reliable camera experience.
- Wait for the preview HUD to show before starting a scan.
- If capture fails on Android, ensure the preview is not paused and permissions are granted.

### Networking

- Phone and computer must be on the same network for LAN URLs.
- Disable VPN / private relay if requests hang.
- Confirm the backend listens on `0.0.0.0:4000` (default).
- Android cleartext HTTP: Expo Go allows LAN HTTP in development; production builds should use HTTPS.

### API / AI errors

- `AI_NOT_CONFIGURED`: missing or placeholder `AI_API_KEY`.
- `RATE_LIMITED`: pause scanning; increase the interval.
- `INVALID_MODEL_RESPONSE`: model returned JSON that failed Zod validation — try another model or retry.
- `NETWORK_ERROR`: backend unreachable — check URL and firewall.

## Privacy

- Scanning is explicit and user-controlled.
- No covert / background capture while scanning is stopped or paused.
- Frames and analysis history are not retained by default.
- Images are transmitted to the configured external AI provider for analysis.
- The backend does not log API keys or raw image payloads.

## Scripts

```bash
npm start                 # Expo
npm run backend           # Express (tsx watch)
npm run typecheck         # Mobile TypeScript
npm run backend:typecheck # Backend TypeScript
```

## Security notes for production

- Serve the backend over **HTTPS**.
- Restrict `CLIENT_ORIGIN`.
- Keep rate limits enabled.
- Rotate API keys if leaked.
- Ensure `.env` files remain gitignored (templates use `.env.example` only).
