import os
import sys
import pytest
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from train import (
    load_data,
    get_rolling_win_pct,
    get_home_win_pct,
    get_away_win_pct,
    get_avg_goals_scored,
    get_avg_goals_conceded,
    h2h_win_pct,
)

ML_DIR = os.path.dirname(os.path.abspath(__file__))
DATE = pd.Timestamp('2026-04-04')
HOME = 'Arsenal'
AWAY = 'Chelsea'


@pytest.fixture(scope="module")
def df():
    os.chdir(ML_DIR)
    return load_data()


class TestWinPercentages:
    def test_rolling_win_pct_in_range(self, df):
        result = get_rolling_win_pct(df, HOME, DATE)
        assert 0.0 <= result <= 1.0

    def test_rolling_win_pct_unknown_team_returns_fallback(self, df):
        assert get_rolling_win_pct(df, 'UnknownFC', DATE) == 0.5

    def test_home_win_pct_in_range(self, df):
        result = get_home_win_pct(df, HOME, DATE)
        assert 0.0 <= result <= 1.0

    def test_home_win_pct_unknown_team_returns_fallback(self, df):
        assert get_home_win_pct(df, 'UnknownFC', DATE) == 0.5

    def test_away_win_pct_in_range(self, df):
        result = get_away_win_pct(df, AWAY, DATE)
        assert 0.0 <= result <= 1.0

    def test_away_win_pct_unknown_team_returns_fallback(self, df):
        assert get_away_win_pct(df, 'UnknownFC', DATE) == 0.5


class TestGoals:
    def test_avg_goals_scored_home_non_negative(self, df):
        assert get_avg_goals_scored(df, HOME, DATE, 'Home') >= 0

    def test_avg_goals_scored_away_non_negative(self, df):
        assert get_avg_goals_scored(df, AWAY, DATE, 'Away') >= 0

    def test_avg_goals_conceded_home_non_negative(self, df):
        assert get_avg_goals_conceded(df, HOME, DATE, 'Home') >= 0

    def test_avg_goals_conceded_away_non_negative(self, df):
        assert get_avg_goals_conceded(df, AWAY, DATE, 'Away') >= 0

    def test_avg_goals_scored_unknown_team_returns_zero(self, df):
        assert get_avg_goals_scored(df, 'UnknownFC', DATE, 'Home') == 0


class TestH2H:
    def test_h2h_win_pct_in_range(self, df):
        result = h2h_win_pct(df, HOME, AWAY, DATE)
        assert 0.0 <= result <= 1.0

    def test_h2h_win_pct_unknown_teams_returns_fallback(self, df):
        assert h2h_win_pct(df, 'UnknownFC', 'AnotherFC', DATE) == 0.5
