import os
from pathlib import Path

from flask import Flask, Response, request
import requests
from werkzeug.http import is_hop_by_hop_header

app = Flask(
    __name__,
    static_folder=Path(__file__).parent / "newtab",
    static_url_path="/",
)

@app.route("/")
def index():
    return app.send_static_file("index.html")


UNSPLASH_CLIENT_ID = os.environ.get("UNSPLASH_CLIENT_ID")


@app.route("/unsplash/<path:path>")
def unsplash(path):
    # https://stackoverflow.com/a/36601467
    res = requests.request(
        method=request.method,
        url=f"https://api.unsplash.com/{path}",
        params=request.args,
        headers={
            **{
                k: v
                for k, v in request.headers
                if not is_hop_by_hop_header(k) and k.lower() not in ("content-length", "host")
            },
            "Authorization": f"Client-ID {UNSPLASH_CLIENT_ID}",
        },
        data=request.get_data(),
        cookies=request.cookies,
        stream=True,
    )

    headers = [
        (k, v)
        for k, v in res.headers.items()
        if not is_hop_by_hop_header(k)
    ]

    return Response(res.iter_content(16384), res.status_code, headers)


if __name__ == "__main__":
    app.run(debug=True)
