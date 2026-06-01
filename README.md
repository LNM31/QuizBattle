<div align="center">

# Quiz Battle

**Multiplayer quiz platform with AI generated questions, played in real time.**

A host creates a game, players join with a 6 character code on their phones or laptops,
everyone answers the same question at the same time, and the fastest correct answers climb
the leaderboard.

![Java](https://img.shields.io/badge/Java-21-007396?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4-6DB33F?logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Gemini](https://img.shields.io/badge/Google%20Gemini-AI-8E75B2?logo=googlegemini&logoColor=white)

</div>

---

## Highlights

- **Real time play.** A persistent WebSocket connection delivers the same question to everyone
  simultaneously, so the speed bonus is fair.
- **AI generated content, built in.** Generate a quiz from a topic, a random domain, or even a
  PDF you upload. No premium tier, no add on.
- **Five question types.** Multiple choice, True/False, Ordering, Estimation, and
  Fill in the blank.
- **Four game modes.** Classic, Survival, Solo, and Team Battle.
- **Transparent scoring.** Points reward correctness, speed, and a consecutive answer streak.
- **Mobile first UI.** A minimalist, modern interface with light and dark themes, animated
  leaderboards, and a confetti finish.

### Game modes

| Mode | What it does |
| :--- | :--- |
| **Classic** | Everyone plays to the end; highest score wins. |
| **Survival** | One wrong answer eliminates you; eliminated players watch as spectators. |
| **Solo** | A single player session with personal stats at the end. |
| **Team Battle** | Players are auto balanced into 2 to 4 teams; team score is the sum of its members. |

### Question types

| Type | How you answer |
| :--- | :--- |
| **Multiple choice** | Pick one option. |
| **True / False** | Two large buttons. |
| **Ordering** | Drag (or use arrows) to arrange items, then submit. |
| **Estimation** | Enter a number; score scales with how close you are. |
| **Fill in the blank** | Type the missing word; a list of accepted answers is matched. |

---

## Tech stack

- **Backend:** Java 21 · Spring Boot · Spring WebSocket · Spring Data JPA · PostgreSQL · Lombok
- **Frontend:** React (Vite) · TypeScript · Tailwind CSS · React Router · lucide-react
- **AI:** Google Gemini (free tier), model `gemini-2.5-flash`
- **Real time:** WebSocket with JSON messages
- **Live demo:** a single ngrok tunnel

---

## 1. Prerequisites

- **JDK 21+**
- **Node.js 20+** (with npm)
- **PostgreSQL**, easiest via Docker (`docker compose up -d`), or a local install
- **Google Gemini API key**, free at https://aistudio.google.com/apikey
- **ngrok** (only for the live multi device demo), https://ngrok.com/download

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

> The backend reads `GOOGLE_API_KEY` from the **process environment**. The google-genai SDK's
> `new Client()` picks it up automatically, not from Spring properties. In IntelliJ, set it under
> *Run, Edit Configurations, Environment variables*. From the command line, export it before
> starting the backend (see below).

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

# macOS / Linux:
export GOOGLE_API_KEY="your_real_key_here"
./mvnw spring-boot:run
```

**c) Frontend** (port 5173)

```bash
cd frontend
npm install      # first time only
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/api` and `/ws` to the backend on
port 8080, so you only ever load one URL.

---

## 4. Live demo over ngrok (phones and laptops)

The whole app is reached **through the Vite dev server**, which proxies both REST (`/api`) and
WebSocket (`/ws`) to the backend. That means a **single ngrok tunnel pointed at port 5173** is
enough: no second URL, no CORS setup.

**Steps (run these yourself):**

1. One time, set your ngrok auth token (from your ngrok dashboard):
   ```bash
   ngrok config add-authtoken <YOUR_NGROK_TOKEN>
   ```

2. Start the database, backend, and frontend exactly as in section 3 (all three must be running).

3. Open the tunnel to the **frontend** port:
   ```bash
   ngrok http 5173
   ```

4. ngrok prints a public URL like `https://abcd-1234.ngrok-free.app`. **Share that URL** with your
   players. They open it on their phones, tap **"Visit Site"** on ngrok's one time warning page,
   and they are in.

   - You (the host) can keep using **http://localhost:5173** on your laptop: faster, no warning page.
   - Players use the **ngrok https URL**. WebSockets upgrade to `wss://` automatically.

> **Free tier notes:** ngrok shows a one time browser interstitial per device (just tap *Visit
> Site*). API calls already send `ngrok-skip-browser-warning`, so data requests are unaffected.
> The free plan gives one tunnel, which is all this setup needs.

---

## 5. Demo script (about 5 minutes)

1. **Create a game** (host, on laptop). Pick a source:
   - *Predefined* (instant and deterministic, the safest opener), or
   - *AI Topic*, then "Surprise Me" or a custom topic, or
   - *PDF Upload* (drop a lecture PDF), or
   - *Manual* (type your own).

   Choose mode **Classic** for the first round, timer 20s.
2. **Show the lobby.** Big game code plus the ngrok URL. Players join on their phones; names pop in live.
3. **Start.** Everyone gets the same question with a synced timer. Answer, then watch the reveal
   (correct answer plus answer distribution) and the animated leaderboard between questions.
4. **End screen.** Confetti, podium (top 3), and per player stats (accuracy, average time, best streak).
5. **Encore (optional).** Run a second game in **Survival** (wrong answer eliminates you, spectator
   mode) or **Team Battle** (2 to 4 teams, cumulative score plus an MVP) to show off the modes.

There is also a built in **"All Question Types - Demo"** quiz (category *Mixed Demo*) under
Predefined that exercises all five question types: Multiple choice, True/False, Ordering,
Estimation, and Fill in the blank.

---

## 6. Project layout

```
backend/    Spring Boot app (REST + WebSocket + Gemini client + in-memory game state)
frontend/   React + Vite app
docs/       plan.md, architecture.md, frontend-design.md, tasks.md, progress.md
sources/    project documentation (.docx), UML diagrams, and helper tools
```

`docs/progress.md` is the running session log: read it first if you are continuing development.
The full project documentation lives in `sources/quiz_battle_documentatie_full.docx`.

---

## 7. Troubleshooting

- **Players cannot connect, or a blank page.** Confirm all three (database, backend on 8080,
  frontend on 5173) are running, and that `ngrok http 5173` points at 5173, not 8080.
- **"Failed to generate questions" (503).** The Gemini key is missing, invalid, or rate limited.
  Check that `GOOGLE_API_KEY` is in the backend's environment. Predefined quizzes still work
  without a key.
- **WebSocket will not open over ngrok.** Make sure you opened the tunnel on the frontend port
  (5173). The app derives `wss://` from the page URL automatically.
- **Database connection refused.** Run `docker compose up -d` and confirm PostgreSQL is on
  `localhost:5432`.
