from pathlib import Path
import base64

html_path = Path('app/index.html')
shim_path = Path('scripts/bridge_shim_v2.b64')
s = html_path.read_text(encoding='utf-8')
shim = base64.b64decode(shim_path.read_text(encoding='utf-8').strip()).decode('utf-8')
marker = 'window.SuiteBridge=SuiteBridge;'
if marker not in s:
    raise SystemExit('SuiteBridge marker not found')
if 'const orig=S.send.bind(S);' not in s:
    s = s.replace(marker, marker + shim, 1)
html_path.write_text(s, encoding='utf-8')
print('bridge shim applied')
