# BookFinder Server (Prototype)

This is a small Node.js Express backend that aggregates searches from public book APIs (Open Library, Google Books, Gutendex).

Prereqs

- Node.js 18+ recommended

Install and run

```bash
cd server
npm install
npm start
```

The server listens on `http://localhost:3000` and exposes `/search?q=your+query`.

Use from the frontend by fetching `http://localhost:3000/search?q=...`.

Notes

- This prototype only uses public APIs and is intended for lawful, public-domain or preview content.
- For production use add caching, rate-limiting, API keys and error handling.
