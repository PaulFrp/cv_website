"""Serves the built React frontend as a single-page app.

Vite writes the production build to ``frontend/dist``. Any request that does not
match a real file there falls through to ``index.html`` so that client-side
routing keeps working on a hard refresh or a shared link.
"""

import os

from flask import Flask, abort, send_from_directory

DIST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend", "dist")
INDEX_HTML = os.path.join(DIST_DIR, "index.html")

# Vite fingerprints everything it writes to /assets, so those files never change
# under the same name and can be cached indefinitely.
IMMUTABLE_PREFIX = "assets/"
IMMUTABLE_MAX_AGE = 60 * 60 * 24 * 365

app = Flask(__name__, static_folder=DIST_DIR, static_url_path="")


@app.route("/health")
def health():
	built = os.path.isfile(INDEX_HTML)
	payload = {"status": "ok" if built else "missing_frontend", "dist": built}
	return payload, 200 if built else 503


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
	if not os.path.isfile(INDEX_HTML):
		abort(
			503,
			description=(
				"frontend/dist is missing. On Heroku the Node.js buildpack must "
				"run before Python so heroku-postbuild can create it."
			),
		)

	if path and os.path.isfile(os.path.join(DIST_DIR, path)):
		response = send_from_directory(DIST_DIR, path)
		if path.startswith(IMMUTABLE_PREFIX):
			response.headers["Cache-Control"] = (
				f"public, max-age={IMMUTABLE_MAX_AGE}, immutable"
			)
		return response

	return send_from_directory(DIST_DIR, "index.html")


if __name__ == "__main__":
	app.run(host="0.0.0.0", port=5000, debug=True)
