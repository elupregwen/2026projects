Book search script

This script queries Open Library and Google Books for a given title (and optional author), and prints results with links.

Usage

Run from the workspace root (Windows example):

```bash
python server/book_search.py --title "The Hobbit" --author "Tolkien"
```

To get machine-readable output:

```bash
python server/book_search.py --title "The Hobbit" --json > results.json
```

Notes

- This uses public APIs (Open Library and Google Books). It does not scrape commercial sites like Amazon; scraping may violate terms of service.
- For production or site-specific availability checks, a proper API or affiliate program (when available) is recommended.
