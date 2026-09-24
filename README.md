# Experimental LiveKit Voice App

A minimalist, high-quality experimental voice app built with **React + Vite** and **Node.js + Express** using LiveKit.

---

## Architecture & Permissions

The application connects to a single fixed room: `voice-test`.

### Roles & Security
1. **USER**:
   - `roomJoin: true`
   - `canPublish: true`
   - `canPublishSources: ["microphone"]`
   - `canSubscribe: true`
   - Can speak into their microphone and hear other participants.
2. **ADMIN**:
   - `roomJoin: true`
   - `canPublish: false`
   - `canSubscribe: true`
   - `canPublishData: false`
   - Listen-only. Strictly prohibited from publishing audio or microphone tracks.
3. **Security**:
   - `LIVEKIT_API_SECRET` resides **only** in the backend `.env` file and is never exposed to the frontend.
   - The backend exposes a single endpoint `POST /api/token` which validates role and mints a short-lived scoped JWT.

---

## Project Structure

```
testing/
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
└── README.md
```

---

## Getting Started

### 1. Backend Setup

1. Open a terminal and navigate to `backend`:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Check `backend/.env`. Ensure your LiveKit credentials are set:
   ```env
   PORT=3001
   LIVEKIT_URL=wss://new1-agga51vd.livekit.cloud
   LIVEKIT_API_KEY=APIsY9kVGfrrufm
   LIVEKIT_API_SECRET=MuRv7RE0uP0Q8hLueG2AwvyJt5G Hu0Ty8IU0Cp1qpfP
   ```
4. Start the backend server:
   ```bash
   npm start
   ```
   *The server runs on `http://localhost:3001`.*

---

### 2. Frontend Setup

1. Open a second terminal and navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   *The frontend runs on `http://localhost:5173`.*

---

## Testing the Voice Connection

To verify audio transmission between USER and ADMIN:

1. **Open Window 1 (USER)**:
   - Navigate to `http://localhost:5173`.
   - Select **USER**.
   - Click **Connect as USER**.
   - Grant microphone permission when prompted by your browser.
   - You should see the green **Microphone Active** indicator. You can click it anytime to mute/unmute.

2. **Open Window 2 (ADMIN) (e.g. in Incognito / another browser window)**:
   - Navigate to `http://localhost:5173`.
   - Select **ADMIN**.
   - Click **Connect as ADMIN**.
   - Notice that ADMIN has **no microphone button**, only a **Listen-Only Mode** indicator.
   - Speak into your microphone on Window 1 — you will hear the clear audio in Window 2!
