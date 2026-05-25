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

# load the trained model
model = joblib.load(os.path.join(BASE_DIR, 'model.pkl'))

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

def predict_match(home_team, away_team):
    home_team = normalize_team(home_team)
    away_team = normalize_team(away_team)
    home_win_pct = get_rolling_win_pct(home_team)
    away_win_pct = get_rolling_win_pct(away_team)

    features = pd.DataFrame([[home_win_pct, away_win_pct]], columns=['home_win_pct', 'away_win_pct'])
    prediction = model.predict(features)[0]
    probabilities = model.predict_proba(features)[0]
    classes = model.classes_

    prob_dict = {cls: round(float(prob) * 100) for cls, prob in zip(classes, probabilities)}

    return {
        'prediction': prediction,
        'probabilities': prob_dict
    }

# test it
if __name__ == '__main__':
    result = predict_match('Arsenal', 'Chelsea')
    print(f"Prediction: {result['prediction']}")
    print(f"Probabilities: {result['probabilities']}")
