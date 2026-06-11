import pandas as pd
import glob
import joblib
import xgboost as xgb
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import LabelEncoder

def load_data():
    files = glob.glob('data/*.csv')
    df = pd.concat([pd.read_csv(f) for f in files], ignore_index=True)
    df = df.dropna(subset=['FTR'])
    df = df[['Date', 'HomeTeam', 'AwayTeam', 'FTHG', 'FTAG', 'FTR', 'B365H', 'B365D', 'B365A']]
    df['Date'] = pd.to_datetime(df['Date'], dayfirst=True)
    df = df.sort_values('Date').reset_index(drop=True)
    return df

# for each match, calculate each team's win % over their last 5 games
def get_rolling_win_pct(df, team, date, n=5):
    past = df[(df['HomeTeam'] == team) | (df['AwayTeam'] == team)]
    past = past[past['Date'] < date].tail(n)
    if len(past) == 0:
        return 0.5  # no history, assume 50%
    wins = past.apply(lambda row:
        (row['FTR'] == 'H' and row['HomeTeam'] == team) or
        (row['FTR'] == 'A' and row['AwayTeam'] == team), axis=1
    ).sum()
    return wins / len(past)

def get_home_win_pct(df, team, date, n=5):
    past = df[df['HomeTeam'] == team]
    past = past[past['Date'] < date].tail(n)
    if len(past) == 0:
        return 0.5
    wins = past[past['FTR'] == 'H'].shape[0]
    return wins / len(past)

def get_away_win_pct(df, team, date, n=5):
    past = df[df['AwayTeam'] == team]
    past = past[past['Date'] < date].tail(n)
    if len(past) == 0:
        return 0.5
    wins = past[past['FTR'] == 'A'].shape[0]
    return wins / len(past)

def get_avg_goals_scored(df, team, date, venue, n=5):
    if venue == "Home":
        past = df[df['HomeTeam'] == team]
    else:
        past = df[df['AwayTeam'] == team]
    past = past[past['Date'] < date].tail(n)
    if len(past) == 0:
        return 0
    return past['FTHG'].mean() if venue == "Home" else past['FTAG'].mean()

def get_avg_goals_conceded(df, team, date, venue, n=5):
    if venue == "Home":
        past = df[df['HomeTeam']== team]
    else:
        past = df[df['AwayTeam'] == team]
    past = past[past['Date'] < date].tail(n)
    if len(past) == 0:
        return 0
    return past['FTAG'].mean() if venue == "Home" else past['FTHG'].mean()

def h2h_win_pct(df, team1, team2, date, n=5):
    past = df[((df['HomeTeam'] == team1) & (df['AwayTeam'] == team2)) | 
              ((df['HomeTeam'] == team2) & (df['AwayTeam'] == team1))]
    past = past[past['Date'] < date].tail(n)
    if len(past) == 0:
        return 0.5
    wins = past.apply(lambda row:
        (row['FTR'] == 'H' and row['HomeTeam'] == team1) or
        (row['FTR'] == 'A' and row['AwayTeam'] == team1), axis=1
    ).sum()
    return wins / len(past)

def get_form_points(df, team, date, n=5):
    past = df[(df['HomeTeam'] == team) | (df['AwayTeam'] == team)]
    past = past[past['Date'] < date].tail(n)
    if len(past) == 0:
        return 1.0
    pts = past.apply(lambda row:
        3 if (row['FTR'] == 'H' and row['HomeTeam'] == team) or
             (row['FTR'] == 'A' and row['AwayTeam'] == team)
        else (1 if row['FTR'] == 'D' else 0), axis=1
    )
    return pts.mean()

def draw_pct(df, team, date, n=38):
    past = df[(df['HomeTeam'] == team) | (df['AwayTeam'] == team)]
    past = past[past['Date'] < date].tail(n)
    if len(past) == 0:
        return 0.5
    draws = past[past['FTR'] == 'D'].shape[0]
    return draws / len(past)

if __name__ == '__main__':
    df = load_data()

    # n=5 form features
    df['home_win_pct'] = df.apply(lambda row: get_home_win_pct(df, row['HomeTeam'], row['Date']), axis=1)
    df['away_win_pct'] = df.apply(lambda row: get_away_win_pct(df, row['AwayTeam'], row['Date']), axis=1)
    df['home_avg_goals_scored'] = df.apply(lambda row: get_avg_goals_scored(df, row['HomeTeam'], row['Date'], "Home"), axis=1)
    df['away_avg_goals_scored'] = df.apply(lambda row: get_avg_goals_scored(df, row['AwayTeam'], row['Date'], "Away"), axis=1)
    df['home_avg_goals_conceded'] = df.apply(lambda row: get_avg_goals_conceded(df, row['HomeTeam'], row['Date'], "Home"), axis=1)
    df['away_avg_goals_conceded'] = df.apply(lambda row: get_avg_goals_conceded(df, row['AwayTeam'], row['Date'], "Away"), axis=1)
    df['h2h_win_pct'] = df.apply(lambda row: h2h_win_pct(df, row['HomeTeam'], row['AwayTeam'], row['Date']), axis=1)
    df['draw_pct'] = df.apply(lambda row: draw_pct(df, row['HomeTeam'], row['Date']), axis=1)
    df['home_attack_vs_away_defense'] = df['home_avg_goals_scored'] - df['away_avg_goals_conceded']
    df['away_attack_vs_home_defense'] = df['away_avg_goals_scored'] - df['home_avg_goals_conceded']

    # short-term form (n=3) — captures momentum
    df['home_win_pct_3'] = df.apply(lambda row: get_home_win_pct(df, row['HomeTeam'], row['Date'], n=3), axis=1)
    df['away_win_pct_3'] = df.apply(lambda row: get_away_win_pct(df, row['AwayTeam'], row['Date'], n=3), axis=1)

    # long-term form (n=10) — captures overall quality
    df['home_win_pct_10'] = df.apply(lambda row: get_home_win_pct(df, row['HomeTeam'], row['Date'], n=10), axis=1)
    df['away_win_pct_10'] = df.apply(lambda row: get_away_win_pct(df, row['AwayTeam'], row['Date'], n=10), axis=1)

    # overall win % regardless of venue
    df['home_overall_win_pct'] = df.apply(lambda row: get_rolling_win_pct(df, row['HomeTeam'], row['Date']), axis=1)
    df['away_overall_win_pct'] = df.apply(lambda row: get_rolling_win_pct(df, row['AwayTeam'], row['Date']), axis=1)

    # bookmaker implied probabilities (normalized to remove the margin)
    raw_h = 1 / df['B365H']
    raw_d = 1 / df['B365D']
    raw_a = 1 / df['B365A']
    total = raw_h + raw_d + raw_a
    df['b365_home_prob'] = raw_h / total
    df['b365_draw_prob'] = raw_d / total
    df['b365_away_prob'] = raw_a / total

    # Split into features (x) and target (y) — keep all three classes H/A/D
    x = df[[
        'home_win_pct', 'away_win_pct',
        'home_win_pct_3', 'away_win_pct_3',
        'home_win_pct_10', 'away_win_pct_10',
        'home_overall_win_pct', 'away_overall_win_pct',
        'home_avg_goals_scored', 'away_avg_goals_scored',
        'home_avg_goals_conceded', 'away_avg_goals_conceded',
        'h2h_win_pct', 'draw_pct',
        'home_attack_vs_away_defense', 'away_attack_vs_home_defense',
        'b365_home_prob', 'b365_draw_prob', 'b365_away_prob',
    ]]
    y = df['FTR']

    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    # Train/test split
    x_train, x_test, y_train, y_test = train_test_split(x, y_encoded, test_size=0.2, random_state=42)

    model = xgb.XGBClassifier(
        n_estimators=300,
        max_depth=3,
        learning_rate=0.01,
        min_child_weight=1,
        reg_lambda=1,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric='mlogloss',
        random_state=42
    )
    model.fit(x_train, y_train)

    # Predict and evaluate
    y_pred = model.predict(x_test)
    accuracy = accuracy_score(y_test, y_pred)
    print("Test accuracy:", accuracy)

    cv_scores = cross_val_score(model, x, y_encoded, cv=5, scoring='accuracy')
    print(f"CV Accuracy: {cv_scores.mean():.3f} (+/- {cv_scores.std():.3f})")

    joblib.dump(model, 'model.pkl')
    joblib.dump(le, 'label_encoder.pkl')
    print("Model saved to model.pkl")

    xgb.plot_importance(model, importance_type='gain', max_num_features=20)
    plt.tight_layout()
    plt.savefig('feature_importance.png')
    print("Feature importance saved to feature_importance.png")
