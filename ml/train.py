import pandas as pd
import glob
import joblib
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

files = glob.glob('data/*.csv')
df = pd.concat([pd.read_csv(f) for f in files], ignore_index=True)

df = df.dropna(subset=['FTR'])

df = df[['Date', 'HomeTeam', 'AwayTeam', 'FTHG', 'FTAG', 'FTR']]

# sort by date so rolling calculations go in the right order
df['Date'] = pd.to_datetime(df['Date'], dayfirst=True)
df = df.sort_values('Date').reset_index(drop=True)

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

df['home_win_pct'] = df.apply(lambda row: get_rolling_win_pct(df, row['HomeTeam'], row['Date']), axis=1)
df['away_win_pct'] = df.apply(lambda row: get_rolling_win_pct(df, row['AwayTeam'], row['Date']), axis=1)

# Define the target variable: 1 if home team wins, 0 otherwise
df['target'] = df['FTR'].map({'H': 1, 'A': 0, 'D': 0})

# Split into features (x) and target (y)
x = df[['home_win_pct', 'away_win_pct']]
y = df['target']

# Train/test split
x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42)

# Train a logistic regression model
model = LogisticRegression()
model.fit(x_train, y_train)

# Predict and evaluate
y_pred = model.predict(x_test)
accuracy = accuracy_score(y_test, y_pred)

print("Accuracy:", accuracy)

joblib.dump(model, 'model.pkl')
print("Model saved to model.pkl")
