export default async function handler(req, res) {
  const title = req.query.title || req.query.q || '';
  const author = req.query.author || '';
  const requested = parseInt(req.query.limit || '8', 10) || 8;
  const MAX_LIMIT = 20;
  const limit = Math.min(requested, MAX_LIMIT);

  if (!title) {
    res.status(400).json({ error: 'title is required' });
    return;
  }

  const results = [];

  // Open Library
  try {
    const olUrl = new URL('https://openlibrary.org/search.json');
    olUrl.searchParams.set('title', title);
    if (author) olUrl.searchParams.set('author', author);
    // Open Library supports a limit param; cap per-service requests to `limit`
    olUrl.searchParams.set('limit', String(limit));
    const r = await fetch(olUrl.toString(), { method: 'GET' });
    const data = await r.json();
    for (const doc of (data.docs || []).slice(0, limit)) {
      results.push({
        title: doc.title,
        authors: doc.author_name || [],
        source: 'Open Library',
        link: doc.key ? `https://openlibrary.org${doc.key}` : null,
        availability: doc.has_fulltext ? 'fulltext' : null
      });
    }
  } catch (e) {
    results.push({ source: 'Open Library', error: e.toString() });
  }

  // Google Books
  try {
    const q = `intitle:${title}${author ? `+inauthor:${author}` : ''}`;
    const gbUrl = new URL('https://www.googleapis.com/books/v1/volumes');
    gbUrl.searchParams.set('q', q);
    // Google Books maxResults has limits; request `limit` and slice as needed
    gbUrl.searchParams.set('maxResults', String(limit));
    const r = await fetch(gbUrl.toString(), { method: 'GET' });
    const data = await r.json();
    for (const item of (data.items || []).slice(0, limit)) {
      const vi = item.volumeInfo || {};
      const si = item.saleInfo || {};
      results.push({
        title: vi.title,
        authors: vi.authors || [],
        source: 'Google Books',
        link: si.buyLink || vi.infoLink || null,
        availability: si.saleability || null
      });
    }
  } catch (e) {
    results.push({ source: 'Google Books', error: e.toString() });
  }

  // Gutendex (Project Gutenberg)
  try {
    const gutUrl = new URL('https://gutendex.com/books/');
    gutUrl.searchParams.set('search', title);
    const r = await fetch(gutUrl.toString(), { method: 'GET' });
    const data = await r.json();
    for (const item of (data.results || []).slice(0, limit)) {
      const authors = (item.authors || []).map(a => a.name).filter(Boolean);
      let link = null;
      const formats = item.formats || {};
      const prefer = ['text/html; charset=utf-8','text/html','text/plain; charset=utf-8','text/plain'];
      for (const k of prefer) {
        if (formats[k]) { link = formats[k]; break; }
      }
      if (!link && item.id) link = `https://www.gutenberg.org/ebooks/${item.id}`;
      results.push({
        title: item.title,
        authors,
        source: 'Project Gutenberg',
        link,
        availability: 'public-domain'
      });
    }
  } catch (e) {
    results.push({ source: 'Gutendex', error: e.toString() });
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Results-Limit', String(limit));
  res.setHeader('X-Results-Max', String(MAX_LIMIT));
  res.status(200).json(results.slice(0, limit));
}
