"""Ricrea index.html auto-contenuto da template.html, vocab.json e bridge.mp3."""
from pathlib import Path
import base64
root=Path(__file__).parent
html=(root/'template.html').read_text(encoding='utf-8')
html=html.replace('__VOCAB_DATA__', (root/'vocab.json').read_text(encoding='utf-8'))
html=html.replace('__AUDIO_BASE64__', base64.b64encode((root/'bridge.mp3').read_bytes()).decode('ascii'))
(root/'index.html').write_text(html, encoding='utf-8')
print('Creato index.html: ', (root/'index.html').stat().st_size, 'bytes')
