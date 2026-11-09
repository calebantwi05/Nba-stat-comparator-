const express = require('express');
const cors = require('cors');
const path = require('path');
const { execFile } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

const PYTHON = process.env.PYTHON || 'python';
const HELPER = path.join(__dirname, 'nba_helper.py');

// Run the Python helper and return the JSON it prints.
// execFile passes the name as a plain argument (no shell), so odd input can't run commands.
function lookupPlayer(name) {
  return new Promise((resolve, reject) => {
    execFile(PYTHON, [HELPER, name], { timeout: 45000 }, (err, stdout) => {
      if (err) return reject(err);
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error('Helper returned something that was not JSON'));
      }
    });
  });
}

app.get('/api/players/search/:name', async (req, res) => {
  try {
    const data = await lookupPlayer(req.params.name);

    if (data.error) {
      const status = data.kind === 'not_found' ? 404 : 502;
      return res.status(status).json({ error: data.error });
    }
    res.json(data);
  } catch (err) {
    console.error('Helper failed:', err.message);
    if (err.code === 'ENOENT') {
      return res.status(500).json({ error: 'Python was not found. Check the PYTHON setting.' });
    }
    res.status(500).json({ error: 'Could not look up that player. Try again.' });
  }
});

const SUGGEST = path.join(__dirname, 'nba_suggest.py');

app.get('/api/players/suggest/:query', (req, res) => {
  execFile(PYTHON, [SUGGEST, req.params.query], { timeout: 20000 }, (err, stdout) => {
    if (err) {
      console.error('Suggest failed:', err.message);
      return res.status(500).json({ error: 'Could not load suggestions.' });
    }
    try {
      res.json(JSON.parse(stdout));
    } catch {
      res.status(500).json({ error: 'Suggestions came back in a bad format.' });
    }
  });
});

app.listen(PORT, (err) => {
  if (err) {
    console.error('Could not start server:', err.message);
    process.exit(1);
  }
  console.log(`NBA Stats Server is running  at http://localhost:${PORT}`);
});
