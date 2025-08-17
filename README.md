<div align="center">
	<img src="client/public/edvanta-logo.png" alt="Edvanta" height="90" />
</div>
  
# Edvanta
**AI‑powered personalised learning & career acceleration platform**

## Overview

Edvanta combines generative AI + assistive tooling to help learners:

- Convert dense study material into concise visual storyboards
- Ask contextual doubts via an intelligent chatbot
- Auto‑generate and evaluate quizzes for active recall
- Interact with an AI tutor (text + future voice via ElevenLabs)
- Build tailored learning roadmaps toward a goal role/skill
- Improve resumes against job descriptions with actionable feedback

The repository is a monorepo containing a React (Vite + Tailwind) client and a modular Flask backend.

## High‑Level Architecture

Client (React) <-> REST API (Flask) <-> External Services (Vertex AI, Cloudinary, ElevenLabs, Future Vector Store)

## Features (Current Skeleton)

Backend endpoints are placeholders with clear comments indicating where integrations will be implemented.

| Domain            | Purpose                                | Example Endpoint                                     |
| ----------------- | -------------------------------------- | ---------------------------------------------------- |
| Health            | Service status                         | GET `/api/health`                                    |
| Visual Generation | Summaries + visual assets storyboard   | POST `/api/visual/summarize`, `/api/visual/generate` |
| Doubt Chatbot     | Q&A over learner questions             | POST `/api/chat/ask`                                 |
| Quizzes           | Create & score quizzes                 | POST `/api/quizzes/generate`, `/api/quizzes/submit`  |
| AI Tutor          | Conversational guidance + (future) TTS | POST `/api/tutor/ask`                                |
| Roadmap           | Learning path generation               | POST `/api/roadmap/generate`                         |
| Resume            | Upload + JD analysis                   | POST `/api/resume/upload`, `/api/resume/analyze`     |

## Repository Structure

```
Edvanta/
├── client/                # React + Vite frontend
│   ├── src/
│   │   ├── components/    # UI + layout
│   │   ├── pages/         # Route pages (Dashboard, Tools)
│   │   ├── hooks/         # Custom hooks (e.g., auth)
│   │   └── lib/           # Firebase + utilities
│   ├── public/
│   └── package.json
└── server/                # Flask backend
		├── app/
		│   ├── __init__.py    # App factory + CORS + blueprint registration
		│   ├── config.py      # Central config (env vars)
		│   ├── routes/        # Modular blueprints (placeholders only)
		│   └── utils/         # External service helper placeholders
		├── .env.example       # Required environment variables (template)
		├── requirements.txt   # Python dependencies
		└── run.py             # Entrypoint
```

## Backend (Flask) Setup

1. Create & activate a Python virtual environment.
2. Install dependencies.
3. Copy `.env.example` to `.env` and fill in values.
4. Run the development server.

```bash
cd server
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env  # then edit .env
python run.py
```

Health check: http://localhost:5000/api/health

### Server Environment Variables

Defined in `server/.env.example`:
| Key | Description |
|-----|-------------|
| FLASK_ENV | Flask environment (development/production) |
| SECRET_KEY | Session / security key |
| VERTEX_PROJECT_ID | GCP project for Vertex AI |
| VERTEX_LOCATION | Region (e.g. us-central1) |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud name |
| CLOUDINARY_API_KEY | Cloudinary API key |
| CLOUDINARY_API_SECRET | Cloudinary secret |
| ELEVENLABS_API_KEY | ElevenLabs TTS key |
| ALLOWED_ORIGINS | Comma separated CORS origins ("\*" for all in dev) |

## Frontend (React) Setup

```bash
cd client
npm install
npm run dev
```

Dev server usually runs at: http://localhost:5173

### Frontend Environment Variables

The client `.env` (already present) likely contains Firebase config. Typical keys (do NOT commit real values):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Add any future API base override:

```
VITE_API_BASE=http://localhost:5000
```

## API Summary (All Placeholder)

All endpoints currently return JSON with a basic placeholder `message`. Logic will be added in phases:
| Method | Endpoint | Intent |
|--------|----------|--------|
| GET | /api/health | Service heartbeat |
| POST | /api/visual/summarize | Summarize topic / document |
| POST | /api/visual/generate | Generate visual assets |
| POST | /api/chat/ask | Answer a user question |
| POST | /api/quizzes/generate | Create quiz questions |
| POST | /api/quizzes/submit | Evaluate quiz results |
| POST | /api/tutor/ask | Tutor guidance + future TTS |
| POST | /api/roadmap/generate | Build learning roadmap |
| POST | /api/resume/upload | Upload resume (Cloudinary) |
| POST | /api/resume/analyze | Analyze resume vs job description |

## Planned Integrations

| Service                     | Usage                                                 |
| --------------------------- | ----------------------------------------------------- |
| Vertex AI (Gemini / Imagen) | Summaries, quizzes, tutor responses, image generation |
| Cloudinary                  | Media & resume storage                                |
| ElevenLabs                  | Text-to-speech for tutor                              |
| Vector Store (future)       | Context retrieval for chatbot                         |
| Auth Provider (Firebase)    | User auth on frontend                                 |

## Development Workflow Suggestions

- Keep backend pure placeholders until integration branch per feature.
- Add unit tests once logic introduced (pytest + requests style client).
- Use feature flags / environment toggles for expensive external calls.
- Introduce OpenAPI (Flask-Smorest / drf-spectacular alternative) later for docs.

## Contributing

1. Create a feature branch: `feat/<short-feature-name>`
2. Commit small, descriptive changes.
3. Open PR; include a short summary & screenshots (if UI).
4. Avoid committing real secrets (.env is ignored).

## Security & Secrets

Never commit actual API keys. Use `.env` locally and (later) a secret manager in deployment (e.g., GCP Secret Manager or GitHub Actions secrets). Rotate keys periodically.

## License

TBD (Add MIT / Apache 2.0 or chosen license here).

## Status

Early scaffold • Backlog: implement integrations, persistence layer, and auth gating.

---

Made with a focus on modularity so each vertical (visuals, quizzes, tutor, roadmap, resume) can evolve independently.

Testing Discord Webhook