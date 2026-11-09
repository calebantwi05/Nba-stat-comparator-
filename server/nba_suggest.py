import json
import sys

from nba_api.stats.static import players


def main():
    query = sys.argv[1] if len(sys.argv) > 1 else ""
    q = query.lower().strip()

    matches = players.find_players_by_full_name(q) if q else []
    matches.sort(key=lambda p: (
        p["full_name"].lower() != q,                 
        not p["full_name"].lower().startswith(q),     
        not p["is_active"],                           
        p["full_name"],
    ))

    results = [
        {"id": p["id"], "name": p["full_name"], "active": p["is_active"]}
        for p in matches[:6]
    ]
    print(json.dumps(results))


main()