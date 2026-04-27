import pandas as pd
import glob

files = glob.glob('data/*.csv')
df = pd.concat([pd.read_csv(f) for f in files], ignore_index=True)

df = df.dropna(subset=['FTR'])

df = df[['Date', 'HomeTeam', 'AwayTeam', 'FTHG', 'FTAG', 'FTR']]

# print(df.shape)
# print(df.head())

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

pd.set_option('display.max_rows', None)
pd.set_option('display.max_columns', None)
pd.set_option('display.width', None)

print(df[df['HomeTeam'] == 'Arsenal'][['Date', 'HomeTeam', 'AwayTeam', 'home_win_pct', 'away_win_pct', 'FTR']])

# print(df[['HomeTeam', 'AwayTeam', 'home_win_pct', 'away_win_pct', 'FTR']].head(10))

