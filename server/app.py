from flask import Flask, request, jsonify
from flask_cors import CORS
import book_search

app = Flask(__name__)
CORS(app)

@app.route('/search')
def search():
    title = request.args.get('title')
    author = request.args.get('author')
    try:
        limit = int(request.args.get('limit', 8))
    except ValueError:
        limit = 8

    if not title:
        return jsonify({'error': 'title is required'}), 400

    results = book_search.search_all(title, author)
    # Optionally trim results per-request
    if isinstance(results, list):
        results = results[:limit]
    return jsonify(results)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
