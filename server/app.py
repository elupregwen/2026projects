from flask import Flask, request, jsonify, send_from_directory, redirect
from flask_cors import CORS
import os
import book_search

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

app = Flask(__name__, static_folder=BASE_DIR)
CORS(app)


@app.route('/')
def index():
    # redirect to the bookfinder page
    return redirect('/intermediate/bookfinder.html')


@app.route('/intermediate/<path:filename>')
def serve_intermediate(filename):
    return send_from_directory(os.path.join(BASE_DIR, 'intermediate'), filename)


@app.route('/search')
def search():
    title = request.args.get('title')
    author = request.args.get('author')
    try:
        limit = int(request.args.get('limit', 20))
    except ValueError:
        limit = 20

    if not title:
        return jsonify({'error': 'title is required'}), 400

    results = book_search.search_all(title, author)
    if isinstance(results, list):
        results = results[:limit]
    return jsonify(results)


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
