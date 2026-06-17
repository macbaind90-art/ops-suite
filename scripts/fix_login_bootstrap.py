from pathlib import Path

path = Path('app/index.html')
s = path.read_text(encoding='utf-8')

# Make the lock screen usable even if shared-drive setup or data loading fails.
# The static HTML starts with an empty <select>; this injects a default user and keypad immediately.
static_select_old = '<select id="loginUser" onchange="loginUserId=this.value;pinInput=\'\';renderPin()"></select>'
static_select_new = '<select id="loginUser" onchange="loginUserId=this.value;pinInput=\'\';renderPin()"><option value="admin" selected>David MacBain · Admin</option></select>'
s = s.replace(static_select_old, static_select_new)

static_pin_old = '<div class="pin-pad" id="pinPad"></div>'
static_pin_new = '<div class="pin-pad" id="pinPad"><button onclick="pinPress(\'1\')">1</button><button onclick="pinPress(\'2\')">2</button><button onclick="pinPress(\'3\')">3</button><button onclick="pinPress(\'4\')">4</button><button onclick="pinPress(\'5\')">5</button><button onclick="pinPress(\'6\')">6</button><button onclick="pinPress(\'7\')">7</button><button onclick="pinPress(\'8\')">8</button><button onclick="pinPress(\'9\')">9</button><button onclick="pinPress(\'C\')">C</button><button onclick="pinPress(\'0\')">0</button><button onclick="pinPress(\'⌫\')">⌫</button></div>'
s = s.replace(static_pin_old, static_pin_new)

# Do not let standalone program setup block the login renderer.
s = s.replace(
    "await ensureStandalonePrograms();renderPin();document.getElementById('saveStatus').textContent='Ready';",
    "renderPin();document.getElementById('saveStatus').textContent='Ready';ensureStandalonePrograms().catch(e=>console.warn('Standalone program setup skipped',e));"
)

# Force the login UI to render before the async bootstrap process starts.
s = s.replace(
    "function init(){applyViewportSizing();bootstrap()}",
    "function init(){applyViewportSizing();try{normalizeSettings();loginUserId=(settings.users&&settings.users[0]&&settings.users[0].id)||'admin';renderPin();}catch(e){console.warn('Initial login render skipped',e)}bootstrap()}"
)

# If bootstrap fails, keep the lock screen usable instead of leaving the user dropdown blank.
s = s.replace(
    "}catch(e){showStartupError(e)}}function normalizeAll(){",
    "}catch(e){console.error('Bootstrap failed',e);try{normalizeSettings();renderPin();}catch(_){ }showStartupError(e)}}function normalizeAll(){"
)

if '<option value="admin" selected>David MacBain · Admin</option>' not in s:
    raise SystemExit('Login bootstrap patch failed: static admin option was not injected')
if 'function init(){applyViewportSizing();try{normalizeSettings();' not in s:
    raise SystemExit('Login bootstrap patch failed: init was not hardened')

path.write_text(s, encoding='utf-8')
print('Login bootstrap patch applied: static admin option, keypad, pre-bootstrap render, and bootstrap fallback')
