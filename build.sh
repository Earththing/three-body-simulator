#!/usr/bin/env bash
# Inlines src/physics.js into src/page.html.
#   index.html          standalone page (open in any browser)
#   dist/fragment.html  same page without the document wrapper (for hosts that add their own)
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p dist
python3 - <<'PY'
page = open("src/page.html").read()
phys = open("src/physics.js").read()
body = page.replace("/*PHYSICS*/", phys)
open("dist/fragment.html", "w").write(body)
head_end = body.index("<style>")
doc = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
       '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
       + body[:head_end] + body[head_end:body.index("</style>") + 8]
       + '\n</head>\n<body>\n' + body[body.index("</style>") + 8:] + '\n</body>\n</html>\n')
open("index.html", "w").write(doc)
PY
echo "built index.html and dist/fragment.html"
