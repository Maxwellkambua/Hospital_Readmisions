"""
Download the Kenya readmissions dataset from Figshare via API.
No browser interaction required.

Usage:
    python download_data.py

Output:
    data/kenya_readmissions.csv  (or .xlsx if that's the source format)
"""

import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

# ------------------------------------------------------------
# CONFIG
# ------------------------------------------------------------
ARTICLE_ID = 28568381
API_BASE = "https://api.figshare.com/v2"
OUTPUT_DIR = Path("data")
OUTPUT_DIR.mkdir(exist_ok=True)

# Preferred output filename (dashboard expects this exact name)
TARGET_NAME = "kenya_readmissions.csv"

# ------------------------------------------------------------
# HELPERS
# ------------------------------------------------------------
def fetch_json(url):
    """GET a JSON endpoint."""
    req = urllib.request.Request(url, headers={"User-Agent": "Dashboard-Loader/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

def download_file(url, dest):
    """Stream a file to disk with progress."""
    req = urllib.request.Request(url, headers={"User-Agent": "Dashboard-Loader/1.0"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        total = int(resp.headers.get("Content-Length", 0))
        chunk = 64 * 1024
        downloaded = 0
        with open(dest, "wb") as f:
            while True:
                buf = resp.read(chunk)
                if not buf:
                    break
                f.write(buf)
                downloaded += len(buf)
                if total > 0:
                    pct = downloaded / total * 100
                    sys.stdout.write(f"\r  → {downloaded/1024:.0f} KB / {total/1024:.0f} KB ({pct:.0f}%)")
                    sys.stdout.flush()
    print()

# ------------------------------------------------------------
# MAIN
# ------------------------------------------------------------
def main():
    print(f"Fetching metadata for Figshare article {ARTICLE_ID}...")

    try:
        # 1. Get the article metadata
        meta = fetch_json(f"{API_BASE}/articles/{ARTICLE_ID}")
        title = meta.get("title", "(untitled)")
        print(f"  Title: {title}")

        # 2. Get the file list
        files = fetch_json(f"{API_BASE}/articles/{ARTICLE_ID}/files")
        if not files:
            print("ERROR: No files attached to this article.")
            sys.exit(1)

        print(f"\nFound {len(files)} file(s):")
        for i, f in enumerate(files):
            size_kb = f.get("size", 0) / 1024
            print(f"  [{i}] {f['name']}  ({size_kb:.1f} KB)")

        # 3. Pick the file to download
        # Strategy: prefer CSV, then Excel, then anything
        pick = None
        for f in files:
            if f["name"].lower().endswith(".csv"):
                pick = f
                break
        if not pick:
            for f in files:
                if f["name"].lower().endswith((".xlsx", ".xls")):
                    pick = f
                    break
        if not pick:
            pick = files[0]

        print(f"\nDownloading: {pick['name']}")

        # 4. Download it
        ext = Path(pick["name"]).suffix.lower()
        out_path = OUTPUT_DIR / (TARGET_NAME if ext == ".csv" else pick["name"])
        download_file(pick["download_url"], out_path)

        # 5. If we downloaded a CSV, rename to the target name
        if ext == ".csv" and out_path.name != TARGET_NAME:
            final = OUTPUT_DIR / TARGET_NAME
            out_path.rename(final)
            out_path = final

        print(f"\n✓ Saved to: {out_path.resolve()}")

        # 6. If it was Excel, tell the user to convert
        if ext in (".xlsx", ".xls"):
            print("\n" + "=" * 60)
            print("NOTE: The source file is Excel (.xlsx), not CSV.")
            print("The dashboard's loader expects CSV. Convert it with:")
            print(f"  pip install openpyxl pandas")
            print(f"  python -c \"import pandas as pd; pd.read_excel('{out_path}').to_csv('data/{TARGET_NAME}', index=False)\"")
            print("=" * 60)

    except urllib.error.HTTPError as e:
        print(f"ERROR: HTTP {e.code} — {e.reason}")
        print("The article may be private, or the ID may be wrong.")
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"ERROR: Network failure — {e.reason}")
        print("Check your internet connection.")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {type(e).__name__} — {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()