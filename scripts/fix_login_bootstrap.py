from pathlib import Path

path = Path('app/index.html')
s = path.read_text(encoding='utf-8')

old = "await ensureStandalonePrograms();renderPin();document.getElementById('saveStatus').textContent='Ready';"
new = "renderPin();document.getElementById('saveStatus').textContent='Ready';ensureStandalonePrograms().catch(e=>console.warn('Standalone program setup skipped',e));"

if old not in s and new not in s:
    raise SystemExit('Login bootstrap patch target not found')

s = s.replace(old, new)
path.write_text(s, encoding='utf-8')
print('Login bootstrap patch applied: PIN UI renders before standalone program setup')
