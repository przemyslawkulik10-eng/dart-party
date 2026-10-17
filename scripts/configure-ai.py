#!/usr/bin/env python3
"""Configure the hobby project's server key locally, without echoing it."""
from pathlib import Path
from getpass import getpass
import os
import re
import socket

root = Path(__file__).resolve().parent.parent
path = root / '.env.local'
for port in {4173, int(os.environ.get('PORT', '4173'))}:
    with socket.socket() as probe:
        probe.settimeout(0.3)
        if probe.connect_ex(('127.0.0.1', port)) == 0:
            raise SystemExit(f'Najpierw zatrzymaj serwer na porcie {port} (Ctrl+C w jego terminalu). Dopiero potem zapisz klucz.')
print('DART PARTY — prywatny projekt hobbystyczny. Użyj klucza z osobnego projektu API.')
key = getpass('Klucz OpenAI API (niewidoczny podczas wpisywania): ').strip()
model = input('Model dostępny na Twoim koncie API: ').strip()
if not key or not re.fullmatch(r'[A-Za-z0-9_-]+', key):
    raise SystemExit('Nieprawidłowy format klucza. Nic nie zapisano.')
if not re.fullmatch(r'[A-Za-z0-9_.:-]+', model):
    raise SystemExit('Nieprawidłowa nazwa modelu. Nic nie zapisano.')
lines = path.read_text().splitlines() if path.exists() else []
lines = [line for line in lines if not re.match(r'^\s*(?:export\s+)?OPENAI_(API_KEY|MODEL)\s*=', line)]
lines += ['OPENAI_API_KEY=' + key, 'OPENAI_MODEL=' + model]
fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
try:
    os.fchmod(fd, 0o600)
    with os.fdopen(fd, 'w') as stream:
        stream.write('\n'.join(lines) + '\n')
except Exception:
    raise SystemExit('Nie udało się zapisać konfiguracji. Sprawdź uprawnienia pliku.')
print('Zapisano konfigurację lokalnie. Klucz nie jest częścią aplikacji ani repozytorium.')
print('Uruchom ponownie serwer: w jego terminalu Ctrl+C, następnie npm run dev.')
