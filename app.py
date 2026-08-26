"""Serves the built React frontend as a single-page app.

Vite writes the production build to ``frontend/dist``. Any request that does not
match a real file there falls through to ``index.html`` so that client-side
routing keeps working on a hard refresh or a shared link.
"""

import os

from flask import Flask, send_from_directory

DIST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend", "dist")

# Vite fingerprints everything it writes to /assets, so those files never change
# under the same name and can be cached indefinitely.
IMMUTABLE_PREFIX = "assets/"
IMMUTABLE_MAX_AGE = 60 * 60 * 24 * 365

app = Flask(__name__, static_folder=DIST_DIR, static_url_path="")


@app.route("/health")
def health():
	return {"status": "ok"}


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
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
