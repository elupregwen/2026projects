const axios = require('axios');

module.exports.search = async function (q) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=20`;
  const res = await axios.get(url, { timeout: 8000 });
  const items = (res.data && res.data.items) || [];
  return items.map(it => {
    const v = it.volumeInfo || {};
    return {
      title: v.title || '',
      authors: v.authors || [],
      year: v.publishedDate ? v.publishedDate.split('-')[0] : null,
      description: v.description || v.subtitle || '',
      link: v.infoLink || (it.selfLink || null),
      score: (it.saleInfo && it.saleInfo.buyLink) ? 1 : 0
    };
  });
};
