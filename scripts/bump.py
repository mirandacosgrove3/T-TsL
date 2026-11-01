"""Stamp a new build id into index.html and version.json. Run before each commit
so installed copies of the app notice the update and swap it in."""
import re, json, time, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
b = time.strftime('%Y%m%d%H%M%S')
p = root / 'index.html'
s = p.read_text()
s = re.sub(r"const BUILD='[^']*';", f"const BUILD='{b}';", s, count=1)
p.write_text(s)
(root / 'version.json').write_text(json.dumps({'v': b}) + '\n')
print(b)
