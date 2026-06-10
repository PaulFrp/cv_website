import os

from flask import Flask, send_from_directory

app = Flask(__name__, static_folder="frontend/dist", static_url_path="")


@app.route("/health")
def health():
	return {"status": "ok"}


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
	if path and os.path.exists(os.path.join(app.static_folder, path)):
		return send_from_directory(app.static_folder, path)
	return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
	app.run(host="0.0.0.0", port=5000, debug=True)
