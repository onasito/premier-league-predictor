import glob
import os
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from predict import predict_match

### FastAPI app and request model
### py -m uvicorn api:app --reload to run the server
app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class MatchRequest(BaseModel):
    homeTeam: str
    awayTeam: str
    b365H: float
    b365D: float
    b365A: float

@app.get('/health')
def health():
    return {'status': 'ok'}

@app.post('/predict')
def predict(request: MatchRequest):
    try:
        result = predict_match(request.homeTeam, request.awayTeam, request.b365H, request.b365D, request.b365A)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/power-rankings')
def power_rankings():
    files = sorted(glob.glob(os.path.join(BASE_DIR, 'data', '*.csv')))
    if not files:
        raise HTTPException(status_code=500, detail='No data files found')

    df = pd.read_csv(files[-1])
    df = df.dropna(subset=['FTR'])
    df = df[['Date', 'HomeTeam', 'AwayTeam', 'FTHG', 'FTAG', 'FTR']]
    df['Date'] = pd.to_datetime(df['Date'], dayfirst=True)
    df = df.sort_values('Date').reset_index(drop=True)

    teams = sorted(set(df['HomeTeam'].unique()) | set(df['AwayTeam'].unique()))
    rankings = []

    for team in teams:
        home = df[df['HomeTeam'] == team]
        away = df[df['AwayTeam'] == team]

        total_games = len(home) + len(away)
        if total_games == 0:
            continue

        wins = int((home['FTR'] == 'H').sum()) + int((away['FTR'] == 'A').sum())
        draws = int((home['FTR'] == 'D').sum()) + int((away['FTR'] == 'D').sum())
        losses = total_games - wins - draws
        pts = wins * 3 + draws
        ppg = pts / total_games

        gf = int(home['FTHG'].sum() + away['FTAG'].sum())
        ga = int(home['FTAG'].sum() + away['FTHG'].sum())
        gd = gf - ga

        all_games = pd.concat([
            home[['Date', 'FTR']].assign(venue='H'),
            away[['Date', 'FTR']].assign(venue='A')
        ]).sort_values('Date').tail(5)

        form = []
        for _, row in all_games.iterrows():
            if (row['FTR'] == 'H' and row['venue'] == 'H') or (row['FTR'] == 'A' and row['venue'] == 'A'):
                form.append('W')
            elif row['FTR'] == 'D':
                form.append('D')
            else:
                form.append('L')

        form_pts = sum(3 if r == 'W' else (1 if r == 'D' else 0) for r in form)
        power_score = round(ppg * 50 + (gd / total_games) * 30 + (form_pts / 15) * 20, 1)

        rankings.append({
            'team': team,
            'gamesPlayed': total_games,
            'wins': wins,
            'draws': draws,
            'losses': losses,
            'goalsFor': gf,
            'goalsAgainst': ga,
            'goalDiff': gd,
            'ppg': round(float(ppg), 2),
            'form': ''.join(form),
            'powerScore': float(power_score),
        })

    rankings.sort(key=lambda x: x['powerScore'], reverse=True)
    return rankings
