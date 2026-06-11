import os
import pandas as pd
import glob
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Map full team names to the abbreviations used in the dataset
TEAM_NAME_MAP = {
    'Arsenal FC' : 'Arsenal',
    'West Ham United FC' : 'West Ham',
    'Brentford FC' : 'Brentford',
    'Wolverhampton Wanderers FC' : 'Wolves',
    'Fulham FC' : 'Fulham',
    'Brighton & Hove Albion FC' : 'Brighton',
    'Crystal Palace FC' : 'Crystal Palace',
    'Aston Villa FC' : 'Aston Villa',
    'Newcastle United FC' : 'Newcastle',
    'Tottenham Hotspur FC' : 'Tottenham',
    'Manchester City FC' : 'Man City',
    'Liverpool FC' : 'Liverpool',
    'Manchester United FC' : 'Man United',
    'Chelsea FC' : 'Chelsea',
    'Leicester City FC' : 'Leicester',
    'Nottingham Forest FC' : 'Nott\'m Forest',
    'Everton FC' : 'Everton',
    'Southampton FC' : 'Southampton',
    'Leeds United FC' : 'Leeds',
    'Bournemouth AFC' : 'Bournemouth',
    'Burnley FC' : 'Burnley',
    'Sunderland AFC' : 'Sunderland',
}

def normalize_team(name):
    return TEAM_NAME_MAP.get(name, name)

# load the trained model and label encoder
model = joblib.load(os.path.join(BASE_DIR, 'model.pkl'))
le = joblib.load(os.path.join(BASE_DIR, 'label_encoder.pkl'))

# load historical data to calculate rolling form
files = glob.glob(os.path.join(BASE_DIR, 'data', '*.csv'))
df = pd.concat([pd.read_csv(f) for f in files], ignore_index=True)
df = df.dropna(subset=['FTR'])
df = df[['Date', 'HomeTeam', 'AwayTeam', 'FTHG', 'FTAG', 'FTR']]
df['Date'] = pd.to_datetime(df['Date'], dayfirst=True)
df = df.sort_values('Date').reset_index(drop=True)

def get_rolling_win_pct(team, n=5):
    past = df[(df['HomeTeam'] == team) | (df['AwayTeam'] == team)].tail(n)
    if len(past) == 0:
        return 0.5
    wins = past.apply(lambda row:
        (row['FTR'] == 'H' and row['HomeTeam'] == team) or
        (row['FTR'] == 'A' and row['AwayTeam'] == team), axis=1
    ).sum()
    return wins / len(past)

def get_home_win_pct(team, n=5):
    past = df[df['HomeTeam'] == team].tail(n)
    if len(past) == 0:
        return 0.5
    return past[past['FTR'] == 'H'].shape[0] / len(past)

def get_away_win_pct(team, n=5):
    past = df[df['AwayTeam'] == team].tail(n)
    if len(past) == 0:
        return 0.5
    return past[past['FTR'] == 'A'].shape[0] / len(past)

def get_avg_goals_scored(team, venue, n=5):
    past = df[df['HomeTeam'] == team].tail(n) if venue == 'Home' else df[df['AwayTeam'] == team].tail(n)
    if len(past) == 0:
        return 0
    return past['FTHG'].mean() if venue == 'Home' else past['FTAG'].mean()

def get_avg_goals_conceded(team, venue, n=5):
    past = df[df['HomeTeam'] == team].tail(n) if venue == 'Home' else df[df['AwayTeam'] == team].tail(n)
    if len(past) == 0:
        return 0
    return past['FTAG'].mean() if venue == 'Home' else past['FTHG'].mean()

def h2h_win_pct(team1, team2, n=5):
    past = df[((df['HomeTeam'] == team1) & (df['AwayTeam'] == team2)) |
              ((df['HomeTeam'] == team2) & (df['AwayTeam'] == team1))].tail(n)
    if len(past) == 0:
        return 0.5
    wins = past.apply(lambda row:
        (row['FTR'] == 'H' and row['HomeTeam'] == team1) or
        (row['FTR'] == 'A' and row['AwayTeam'] == team1), axis=1
    ).sum()
    return wins / len(past)

def get_form_points(team, n=5):
    past = df[(df['HomeTeam'] == team) | (df['AwayTeam'] == team)].tail(n)
    if len(past) == 0:
        return 1.0
    pts = past.apply(lambda row:
        3 if (row['FTR'] == 'H' and row['HomeTeam'] == team) or
             (row['FTR'] == 'A' and row['AwayTeam'] == team)
        else (1 if row['FTR'] == 'D' else 0), axis=1
    )
    return pts.mean()

def draw_pct(team, n=38):
    past = df[(df['HomeTeam'] == team) | (df['AwayTeam'] == team)].tail(n)
    if len(past) == 0:
        return 0.5
    return past[past['FTR'] == 'D'].shape[0] / len(past)

def predict_match(home_team, away_team, b365_h, b365_d, b365_a):
    home_team = normalize_team(home_team)
    away_team = normalize_team(away_team)

    home_goals_scored = get_avg_goals_scored(home_team, 'Home')
    away_goals_scored = get_avg_goals_scored(away_team, 'Away')
    home_goals_conceded = get_avg_goals_conceded(home_team, 'Home')
    away_goals_conceded = get_avg_goals_conceded(away_team, 'Away')

    raw_h = 1 / b365_h
    raw_d = 1 / b365_d
    raw_a = 1 / b365_a
    total = raw_h + raw_d + raw_a

    features = pd.DataFrame([[
        get_home_win_pct(home_team),
        get_away_win_pct(away_team),
        get_home_win_pct(home_team, n=3),
        get_away_win_pct(away_team, n=3),
        get_home_win_pct(home_team, n=10),
        get_away_win_pct(away_team, n=10),
        get_rolling_win_pct(home_team),
        get_rolling_win_pct(away_team),
        home_goals_scored,
        away_goals_scored,
        home_goals_conceded,
        away_goals_conceded,
        h2h_win_pct(home_team, away_team),
        draw_pct(home_team),
        home_goals_scored - away_goals_conceded,
        away_goals_scored - home_goals_conceded,
        raw_h / total,
        raw_d / total,
        raw_a / total,
    ]], columns=[
        'home_win_pct', 'away_win_pct',
        'home_win_pct_3', 'away_win_pct_3',
        'home_win_pct_10', 'away_win_pct_10',
        'home_overall_win_pct', 'away_overall_win_pct',
        'home_avg_goals_scored', 'away_avg_goals_scored',
        'home_avg_goals_conceded', 'away_avg_goals_conceded',
        'h2h_win_pct', 'draw_pct',
        'home_attack_vs_away_defense', 'away_attack_vs_home_defense',
        'b365_home_prob', 'b365_draw_prob', 'b365_away_prob',
    ])
    prediction = le.inverse_transform(model.predict(features))[0]
    probabilities = model.predict_proba(features)[0]
    classes = le.classes_

    prob_dict = {cls: round(float(prob) * 100) for cls, prob in zip(classes, probabilities)}

    return {
        'prediction': prediction,
        'probabilities': prob_dict
    }

# test it
if __name__ == '__main__':
    result = predict_match('Arsenal', 'Chelsea', b365_h=2.1, b365_d=3.4, b365_a=3.6)
    print(f"Prediction: {result['prediction']}")
    print(f"Probabilities: {result['probabilities']}")
