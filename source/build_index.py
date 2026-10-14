"""Produce index.html self-contained for GitHub Pages and direct local opening."""
from pathlib import Path
import base64
root=Path(__file__).resolve().parent.parent
src=root/'source'
html=(src/'template.html').read_text(encoding='utf-8')
html=html.replace('__AUDIO_BASE64__',base64.b64encode((root/'bridge.mp3').read_bytes()).decode('ascii'))
html=html.replace('__APP_CSS__',(src/'app.css').read_text(encoding='utf-8'))
html=html.replace('__ENGINE_JS__',(src/'engine.js').read_text(encoding='utf-8'))
html=html.replace('__STORAGE_JS__',(src/'storage.js').read_text(encoding='utf-8'))
html=html.replace('__CONTENT_JS__',(src/'content.js').read_text(encoding='utf-8'))
html=html.replace('__SESSIONS_JS__',(src/'sessions.js').read_text(encoding='utf-8'))
html=html.replace('__APP_JS__',(src/'app.js').read_text(encoding='utf-8'))
(root/'index.html').write_text(html,encoding='utf-8')
print(f"Created {root/'index.html'} ({len(html)} characters)")
