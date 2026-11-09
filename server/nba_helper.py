import json
import sys

from nba_api.stats.endpoints import playercareerstats
from nba_api.stats.static import players, teams


def num(value):
    return "0.0" if value is None else f"{float(value):.1f}"


def pct(value):
    return "0.0" if value is None else f"{float(value) * 100:.1f}"


def pick_latest_season(rows):
    """Return (row to use, all rows from that season).

    A player traded mid-season has one 'TOT' row (full season) plus one row
    per team, so prefer the TOT row over a single team's partial stats.
    """
    latest = rows[-1]["SEASON_ID"]
    same = [r for r in rows if r["SEASON_ID"] == latest]
    totals = [r for r in same if r["TEAM_ABBREVIATION"] == "TOT"]
    return (totals or same)[-1], same


def build_result(player, rows):
    row, same = pick_latest_season(rows)

    team = "Not on a roster"
    team_rows = [r for r in same if r["TEAM_ABBREVIATION"] != "TOT"]
    if player["is_active"] and team_rows:
        found = teams.find_team_name_by_id(team_rows[-1]["TEAM_ID"])
        if found:
            team = found["full_name"]

    return {
        "id": player["id"],
        "name": player["full_name"],
        "team": team,
        "season": row["SEASON_ID"],
        "imageUrl": f"https://cdn.nba.com/headshots/nba/latest/1040x760/{player['id']}.png",
        "stats": {
            "ppg": num(row["PTS"]),
            "rpg": num(row["REB"]),
            "apg": num(row["AST"]),
            "spg": num(row["STL"]),
            "bpg": num(row["BLK"]),
            "fg": pct(row["FG_PCT"]),
            "fg3": pct(row["FG3_PCT"]),
            "ft": pct(row["FT_PCT"]),
            "gp": row["GP"] or 0,
            "mpg": num(row["MIN"]),
        },
    }


def find_player(name):
    # a number means "look up this exact player ID"
    if name.isdigit():
        return players.find_player_by_id(int(name))

    matches = players.find_players_by_full_name(name)
    if not matches:
        return None
    matches.sort(key=lambda p: (p["full_name"].lower() != name.lower(), not p["is_active"], len(p["full_name"])))
    return matches[0]

def fetch_rows(player_id):
    career = playercareerstats.PlayerCareerStats(
        player_id=player_id, per_mode36="PerGame", timeout=30
    )
    data = career.get_dict()["resultSets"]
    season_totals = next(
        (s for s in data if s["name"] == "SeasonTotalsRegularSeason"), data[0]
    )
    return [dict(zip(season_totals["headers"], r)) for r in season_totals["rowSet"]]




def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No player name given"}))
        return

    name = sys.argv[1]
    player = find_player(name)
    if player is None:
        print(json.dumps({"error": f'No player found matching "{name}"', "kind": "not_found"}))
        return

    try:
        rows = fetch_rows(player["id"])
        if not rows:
            print(json.dumps({"error": f"No stats found for {player['full_name']}", "kind": "not_found"}))
            return
        print(json.dumps(build_result(player, rows)))
    except Exception as exc:  # network timeouts, NBA.com errors, etc.
        print(json.dumps({"error": f"NBA.com request failed: {exc}", "kind": "upstream"}))


if __name__ == "__main__":
    main()