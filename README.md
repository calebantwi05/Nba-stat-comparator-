# NBA Stats Hub

Search for NBA players and compare two of them side by side. Each player card shows a headshot and stats, and the better stat in each category is highlighted in green.

## Features

- Search players by name, with a dropdown of matching suggestions
- Side-by-side comparison with a VS divider
- Stats compared: PPG, RPG, APG, SPG, BPG, FG%, 3P%, FT%
- Winner highlighting for each stat
- Loading spinner, Clear buttons, and a "no player found" message

## Tech

- Node.js and Express serve the website and the API
- A Python helper uses the [nba_api](https://github.com/swar/nba_api) library to get player data
- Plain HTML, CSS, and JavaScript on the front end

## Setup

1. Install Node dependencies:
   ```
   npm install
   ```
2. Install the Python library:
   ```
   pip install nba_api
   ```
3. Start the server:
   ```
   npm start
   ```
4. Open http://localhost:3000

## Project layout

```
public/    the website (index.html, scripts/main.js, styles/main.css)
server/    server.js plus the Python helpers (nba_helper.py, nba_suggest.py)
```

## Coming next

- Choose a season or career stats for each player
- Landing page and team colors
- Player profile pages