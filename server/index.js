const express = require('express');
const cors = require('cors');
const openlibrary = require('./adapters/openlibrary');
const googlebooks = require('./adapters/googlebooks');
const gutendex = require('./adapters/gutendex');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/search', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: 'missing query parameter q' });

  try {
    const promises = [
      openlibrary.search(q),
      googlebooks.search(q),
      gutendex.search(q)
    ];

    const settled = await Promise.allSettled(promises);
    const combined = [];
    const sourceCounts = {};
    const names = ['OpenLibrary', 'GoogleBooks', 'Gutendex'];

    settled.forEach((r, i) => {
      const name = names[i];
      if (r.status === 'fulfilled') {
        const arr = r.value || [];
        sourceCounts[name] = arr.length;
        combined.push(...arr.map(item => ({ ...item, source: name })));
      } else {
        sourceCounts[name] = 0;
      }
    });

    // Basic de-dup + limit
    const seen = new Set();
    const deduped = [];
    for (const it of combined) {
      const key = (it.title || '') + '|' + (it.authors ? it.authors.join(',') : '') + '|' + (it.link || '');
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(it);
      }
    }

    res.json({ query: q, results: deduped.slice(0, 200), sourceCounts });
  } catch (err) {
    console.error('Search error', err);
    res.status(500).json({ error: 'server error' });
  }
});

app.listen(PORT, () => {
  console.log(`BookFinder server listening on http://localhost:${PORT}`);
});
