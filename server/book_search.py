#!/usr/bin/env python3
import argparse
import json
import requests


def search_openlibrary(title, author=None, limit=5):
    params = {"title": title, "limit": limit}
    if author:
        params["author"] = author
    resp = requests.get("https://openlibrary.org/search.json", params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    results = []
    for doc in data.get("docs", [])[:limit]:
        r = {
            "title": doc.get("title"),
            "authors": doc.get("author_name", []),
            "source": "Open Library",
        }
        key = doc.get("key")
        if key:
            r["link"] = f"https://openlibrary.org{key}"
        else:
            r["link"] = None
        r["availability"] = "fulltext" if doc.get("has_fulltext") else None
        results.append(r)
    return results


def search_googlebooks(title, author=None, limit=5):
    q = f"intitle:{title}"
    if author:
        q += f"+inauthor:{author}"
    params = {"q": q, "maxResults": limit}
    resp = requests.get("https://www.googleapis.com/books/v1/volumes", params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    results = []
    for item in data.get("items", [])[:limit]:
        vi = item.get("volumeInfo", {})
        si = item.get("saleInfo", {})
        r = {
            "title": vi.get("title"),
            "authors": vi.get("authors", []),
            "source": "Google Books",
        }
        r["link"] = si.get("buyLink") or vi.get("infoLink")
        r["availability"] = si.get("saleability")
        results.append(r)
    return results


def search_all(title, author=None):
    out = []
    try:
        out.extend(search_openlibrary(title, author))
    except Exception as e:
        out.append({"source": "Open Library", "error": str(e)})
    try:
        out.extend(search_googlebooks(title, author))
    except Exception as e:
        out.append({"source": "Google Books", "error": str(e)})
    return out


def main():
    parser = argparse.ArgumentParser(description="Search for books across multiple services and return links.")
    parser.add_argument("--title", required=True, help="Book title to search for")
    parser.add_argument("--author", help="Author name (optional)")
    parser.add_argument("--limit", type=int, default=5, help="Max results per service")
    parser.add_argument("--json", action="store_true", help="Output raw JSON")
    args = parser.parse_args()

    results = search_all(args.title, args.author)
    if args.json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        for r in results:
            if "error" in r:
                print(f"[{r.get('source')}] Error: {r.get('error')}")
                continue
            title = r.get("title") or "(no title)"
            authors = ", ".join(r.get("authors") or [])
            link = r.get("link") or "(no link)"
            avail = r.get("availability") or "(unknown)"
            print(f"[{r.get('source')}] {title} — {authors}\n  Link: {link}\n  Availability: {avail}\n")


if __name__ == "__main__":
    main()
