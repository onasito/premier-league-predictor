# Premier League Match Predictor

A full-stack web application where users predict Premier League match outcomes, track their accuracy, and compete on a leaderboard. Predictions are scored against real results once matches are completed.

**Live Demo:** [premier-league-predictor-livid.vercel.app](https://premier-league-predictor-livid.vercel.app/)

---

## Features

- JWT-based user authentication (register, login, account management)
- Browse upcoming and recent Premier League fixtures with live standings
- Submit match predictions and track personal prediction history
- Leaderboard ranked by prediction accuracy across all users
- ML-powered match outcome predictions via a dedicated Python service

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7, Axios |
| Backend | Node.js, Express 5, Prisma ORM, PostgreSQL |
| Auth | JSON Web Tokens (JWT), bcrypt |
| ML Service | Python, FastAPI, scikit-learn, XGBoost |
| Deployment | Vercel (frontend), Render (backend + ML) |

---

## Architecture

The application is split into three independently deployed services:

```
Client (Vercel)
    │
    ├──▶ Express API (Render)  ──▶ PostgreSQL
    │
    └──▶ FastAPI ML Service (Render)
```

The React frontend communicates with the Express backend for all user, match, and prediction data. Match outcome predictions are handled separately by a FastAPI service that serves a trained ML model.

---

## ML Model

The prediction model is trained on historical Premier League match data from [football-data.co.uk](https://football-data.co.uk/). It uses rolling team performance statistics as features to predict match outcomes (home win / draw / away win).

> Model details and accuracy metrics will be updated once current improvements are complete.

---

## Local Setup

### Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL

### Backend

```bash
cd server
npm install
# Set up .env with DATABASE_URL, JWT_SECRET, and any external API keys
npx prisma migrate dev
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

### ML Service

```bash
cd ml
pip install -r requirements.txt
python train.py        # generates model.pkl
uvicorn api:app --reload
```
