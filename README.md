# Quiz Battle

Multiplayer quiz platform with AI-generated questions. A host creates a game, players join
with a 6-character code on their phones or laptops, everyone answers in real time and competes
for the highest score.

- **Backend:** Java 21 · Spring Boot 4 · Spring WebSocket · Spring Data JPA · PostgreSQL
- **Frontend:** React (Vite) + TypeScript · Tailwind CSS
- **AI:** Google Gemini (free tier) for question generation
- **Live demo:** a single ngrok tunnel

---

## 1. Prerequisites

- **JDK 21+**
- **Node.js 20+** (npm)
- **PostgreSQL** — easiest via Docker (`docker compose up -d`); or a local install
- **Google Gemini API key** — free at https://aistudio.google.com/apikey
- **ngrok** (only for the live multi-device demo) — https://ngrok.com/download

---

## 2. Configuration

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

`.env`:

```
POSTGRES_DB=quizbattle
POSTGRES_USER=quizbattle
POSTGRES_PASSWORD=quizbattle
GOOGLE_API_KEY=your_real_key_here
```

> The backend reads `GOOGLE_API_KEY` from the **process environment** (the google-genai SDK's
> `new Client()` picks it up automatically — not from Spring properties). In IntelliJ set it
> under *Run → Edit Configurations → Environment variables*. From the command line, export it
> before starting the backend (see below).

---

## 3. Run locally

Open three terminals.

**a) Database**

```bash
docker compose up -d        # PostgreSQL on localhost:5432
```

**b) Backend** (port 8080)

```bash
cd backend

# PowerShell:
$env:GOOGLE_API_KEY="your_real_key_here"
./mvnw.cmd spring-boot:run

# macOS/Linux:
export GOOGLE_API_KEY="your_real_key_here"
./mvnw spring-boot:run
```

**c) Frontend** (port 5173)

```bash
cd frontend
npm install      # first time only
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/api` and `/ws` to the backend
on :8080, so you only ever load one URL.

---

## 4. Live demo over ngrok (phones + laptops)

The whole app is reached **through the Vite dev server**, which proxies both REST (`/api`) and
WebSocket (`/ws`) to the backend. So a **single ngrok tunnel pointed at port 5173** is enough —
no second URL, no CORS setup.

**Steps (run these yourself):**

1. One-time, set your ngrok auth token (from your ngrok dashboard):
   ```bash
   ngrok config add-authtoken <YOUR_NGROK_TOKEN>
   ```

2. Start the database, backend, and frontend exactly as in section 3 (all three must be running).

3. Open the tunnel to the **frontend** port:
   ```bash
   ngrok http 5173
   ```

4. ngrok prints a public URL like `https://abcd-1234.ngrok-free.app`. **Share that URL** with
   your players. They open it on their phones, tap **"Visit Site"** on ngrok's one-time warning
   page, and they're in.

   - You (the host) can keep using **http://localhost:5173** on your laptop — faster, no warning page.
   - Players use the **ngrok https URL**. WebSockets upgrade to `wss://` automatically.

> **Free-tier notes:** ngrok shows a one-time browser interstitial per device (just tap *Visit
> Site*); API calls already send `ngrok-skip-browser-warning` so data requests are unaffected.
> The free plan gives one tunnel — which is all this setup needs.

---

## 5. Demo script (~5 min)

1. **Create a game** (host, on laptop): pick a source —
   - *Predefined* (instant, deterministic — safest opener), or
   - *AI Topic* → "Surprise Me" / a custom topic, or
   - *PDF Upload* (drop a lecture PDF), or
   - *Manual* (type your own).
   Choose mode **Classic** for the first round; timer 20s.
2. **Show the lobby** — big game code + the ngrok URL. Players join on their phones; names pop in live.
3. **Start** — everyone gets the same question with a synced timer. Answer; watch the reveal
   (correct answer + answer distribution) and the animated leaderboard between questions.
4. **End screen** — confetti, podium (top 3), and per-player stats (accuracy, avg time, best streak).
5. **Encore (optional):** run a second game in **Survival** (wrong answer = eliminated, spectator
   mode) or **Team Battle** (2–4 teams, cumulative team score + MVP) to show off the modes.

There's also a built-in **"All Question Types — Demo"** quiz (category *Mixed Demo*) under
Predefined that exercises all five question types: MCQ, True/False, Ordering, Estimation,
Fill-in-the-blank.

---

## 6. Project layout

```
backend/    Spring Boot app (REST + WebSocket + Gemini client + in-memory game state)
frontend/   React + Vite app
docs/        plan.md · architecture.md · frontend-design.md · tasks.md · progress.md
```

`docs/progress.md` is the running session log — read it first if you're continuing development.

---

## 7. Troubleshooting

- **Players can't connect / blank page** — confirm all three (DB, backend :8080, frontend :5173)
  are running, and that `ngrok http 5173` points at **5173**, not 8080.
- **"Failed to generate questions" (503)** — Gemini key missing/invalid or rate-limited. Check
  `GOOGLE_API_KEY` is in the backend's environment. Predefined quizzes still work without a key.
- **WebSocket won't open over ngrok** — make sure you opened the tunnel on the frontend port
  (5173). The app derives `wss://` from the page URL automatically.
- **DB connection refused** — `docker compose up -d` and confirm PostgreSQL is on `localhost:5432`.
