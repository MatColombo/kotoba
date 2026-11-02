#!/usr/bin/env python3
"""Check GitHub Pages model and token readiness. Run in Kotoba Drive repo root."""
import argparse,json,sys
from pathlib import Path
PAGES_LIMIT=1024*1024*1024
GITHUB_LIMIT=100*1024*1024
root=Path(__file__).resolve().parent.parent
ap=argparse.ArgumentParser()
ap.add_argument('--root',type=Path,default=root)
args=ap.parse_args();root=args.root.resolve()
issues=[]
manifest_file=root/'onnx'/'manifest.json'
if not manifest_file.is_file():sys.exit('ERRORE: manca onnx/manifest.json: esegui tools/prepare_kotoba_onnx.py')
manifest=json.loads(manifest_file.read_text(encoding='utf-8'))
size=0;largest=(0,None)
for p in root.rglob('*'):
 if not p.is_file() or '.git' in p.parts or '.venv' in p.parts or '__pycache__' in p.parts:continue
 n=p.stat().st_size;size+=n
 if n>largest[0]:largest=(n,p)
 if n>=GITHUB_LIMIT:issues.append(f'File sopra il limite GitHub di 100 MiB: {p} ({n/1048576:.1f} MiB)')
for lang,cfg in manifest.get('languages',{}).items():
 dest=root/cfg['directory']
 for name in list(cfg['modelFiles'].values())+[v['file'] for v in cfg['voices'].values()]+['bundle.json']:
  if not (dest/name).is_file():issues.append(f'Manca {lang}/{name}')
 if lang=='en' and not any('p226' in k or 'male' in k for k in cfg['voices']):
  issues.append('Manca la voce maschile inglese; scarica p226 o passa --male-en-wav PATH')
for deck,entry in manifest.get('tokenIndexes',{}).items():
 for shard in set(entry['shards'].values()):
  if not (root/shard.lstrip('./')).is_file():issues.append(f'Manca token shard {shard}')
print(f'Sito: {size/1048576:.1f} MiB; file massimo: {largest[0]/1048576:.1f} MiB: {largest[1]}')
if size>=PAGES_LIMIT:issues.append('Il sito supera la dimensione consigliata di 1 GiB per GitHub Pages')
print('Deck indicizzati:',', '.join(manifest.get('tokenIndexes',{})))
print('Voci:',{k:list(v['voices']) for k,v in manifest['languages'].items()})
for issue in issues:print('ERRORE:',issue)
if issues:sys.exit(1)
print('OK: distribuzione sotto i limiti e completa per il test Pages')
