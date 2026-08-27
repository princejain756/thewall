#!/usr/bin/env python3
"""Download Google Drive folder images one-by-one with rate-limit backoff."""

import json
import os
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request

FOLDER_URL = "https://drive.google.com/drive/folders/1puo1V-kYKk5l4-0YCXJg2-aSL890K6DN"
OUT_DIR = "/root/websites/thewall/public/images"
GDOWN = "/tmp/gdown-venv/bin/gdown"
DELAY_SEC = 3
MAX_RETRIES = 6
USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def get_manifest():
    result = subprocess.run(
        [GDOWN, "--folder", "--json", FOLDER_URL],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0 and not result.stdout.strip():
        raise RuntimeError(result.stderr or "Failed to list Drive folder")
    return json.loads(result.stdout)


def extract_file_id(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    query = urllib.parse.parse_qs(parsed.query)
    if "id" in query:
        return query["id"][0]
    return url.rstrip("/").split("/")[-1]


def get_confirm_token(html: str) -> str | None:
    match = re.search(r"confirm=([0-9A-Za-z_]+)", html)
    return match.group(1) if match else None


def download_file(url: str, dest: str) -> bool:
    file_id = extract_file_id(url)
    os.makedirs(os.path.dirname(dest), exist_ok=True)

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            session_headers = {"User-Agent": USER_AGENT}
            base_url = "https://drive.google.com/uc?export=download&id=" + file_id
            req = urllib.request.Request(base_url, headers=session_headers)
            with urllib.request.urlopen(req, timeout=60) as resp:
                content = resp.read()
                content_type = resp.headers.get("Content-Type", "")

            if b"text/html" in content_type.encode() or content[:15].lower().startswith(b"<!doctype"):
                token = get_confirm_token(content.decode("utf-8", errors="ignore"))
                if token:
                    confirm_url = (
                        "https://drive.google.com/uc?export=download"
                        f"&confirm={token}&id={file_id}"
                    )
                    req = urllib.request.Request(confirm_url, headers=session_headers)
                    with urllib.request.urlopen(req, timeout=120) as resp:
                        content = resp.read()

            if len(content) < 1000 and b"Too many users" in content:
                raise RuntimeError("rate limited")

            with open(dest, "wb") as f:
                f.write(content)

            if os.path.getsize(dest) > 500:
                return True
            raise RuntimeError("file too small")
        except Exception as exc:
            if os.path.exists(dest):
                os.remove(dest)
            wait = DELAY_SEC * attempt * 4
            print(f"  retry {attempt}/{MAX_RETRIES} ({exc}) in {wait}s...", flush=True)
            time.sleep(wait)

    return False


def main():
    print("Fetching file manifest from Google Drive...", flush=True)
    manifest = get_manifest()
    total = len(manifest)
    print(f"Found {total} files", flush=True)

    ok = skipped = failed = 0
    for i, item in enumerate(manifest, 1):
        dest = os.path.join(OUT_DIR, item["path"])
        if os.path.isfile(dest) and os.path.getsize(dest) > 500:
            skipped += 1
            continue

        print(f"[{i}/{total}] {item['path']}", flush=True)
        if download_file(item["url"], dest):
            ok += 1
        else:
            failed += 1
            print(f"  FAILED: {item['path']}", flush=True)
        time.sleep(DELAY_SEC)

    print(f"\nDone: {ok} downloaded, {skipped} skipped, {failed} failed", flush=True)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
