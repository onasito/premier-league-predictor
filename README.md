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

The prediction model is trained on historical Premier League match data from [football-data.co.uk](https://football-data.co.uk/) and predicts match outcomes across three classes: home win (H), draw (D), and away win (A).

**Accuracy: ~55% (5-fold cross-validated)** — compared to a ~45-50% naive baseline of always predicting the home team to win.

### Model

XGBoost classifier, upgraded from an initial logistic regression baseline. XGBoost was chosen for its ability to capture non-linear relationships between features and handle noisy sports data well.

### Features

| Feature | Description |
|---|---|
| `home_win_pct`, `away_win_pct` | Win % over last 5 home/away games |
| `home_win_pct_3`, `away_win_pct_3` | Win % over last 3 games (short-term momentum) |
| `home_win_pct_10`, `away_win_pct_10` | Win % over last 10 games (overall quality) |
| `home_overall_win_pct`, `away_overall_win_pct` | Win % across all games regardless of venue |
| `home_avg_goals_scored`, `away_avg_goals_scored` | Avg goals scored over last 5 games |
| `home_avg_goals_conceded`, `away_avg_goals_conceded` | Avg goals conceded over last 5 games |
| `home_attack_vs_away_defense` | Home goals scored minus away goals conceded |
| `away_attack_vs_home_defense` | Away goals scored minus home goals conceded |
| `h2h_win_pct` | Head-to-head win % over last 5 meetings |
| `draw_pct` | Draw rate over last 38 games (captures team style) |
| `b365_home_prob`, `b365_draw_prob`, `b365_away_prob` | Bet365 implied probabilities (normalized) |

Bookmaker implied probabilities were the single biggest accuracy improvement, encoding information such as injuries, squad depth, and form that isn't captured by raw statistics alone.

### Hyperparameters

```
n_estimators=300, max_depth=3, learning_rate=0.01,
min_child_weight=1, reg_lambda=1, subsample=0.8, colsample_bytree=0.8
```

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
