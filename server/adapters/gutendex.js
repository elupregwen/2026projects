const axios = require('axios');

module.exports.search = async function (q) {
  const url = `https://gutendex.com/books?search=${encodeURIComponent(q)}`;
  const res = await axios.get(url, { timeout: 8000 });
  const results = (res.data && res.data.results) || [];
  return results.map(r => ({
    title: r.title || '',
    authors: (r.authors || []).map(a => a.name),
    year: r.download_count ? null : null,
    description: r.bookshelves ? (Array.isArray(r.bookshelves) ? r.bookshelves.slice(0,3).join(', ') : String(r.bookshelves)) : '',
    link: r.id ? `https://www.gutenberg.org/ebooks/${r.id}` : null,
    score: r.download_count || 0
  }));
};
