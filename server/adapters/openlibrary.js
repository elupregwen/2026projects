const axios = require('axios');

module.exports.search = async function (q) {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=30`;
  const res = await axios.get(url, { timeout: 8000 });
  const docs = (res.data && res.data.docs) || [];
  return docs.map(d => ({
    title: d.title || '',
    authors: d.author_name || [],
    year: d.first_publish_year || null,
    description: d.subject ? (Array.isArray(d.subject) ? d.subject.slice(0,3).join(', ') : String(d.subject)) : '',
    link: d.key ? `https://openlibrary.org${d.key}` : null,
    score: d.edition_count || 0
  }));
};
