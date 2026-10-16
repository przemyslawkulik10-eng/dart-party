# DART PARTY

Polski licznik darta na wspólny tablet dla 2–6 graczy. Autorski kod, bez kopiowania gotowych projektów.

## Gra

- 501, 301, 201: Straight In, zwykłe zakończenie lub Double Out.
- Standardowy Cricket (15–20, bull), pojedyncza, podwójna i potrójna punktacja.
- Domyślna ekipa: MACIEK, PRZEMEK, MANIEK, DAWID, JAREK, BEKO.
- Trzy lotki, jawne przekazanie kolejki, cofanie także po zmianie gracza i zwycięstwie.
- Automatyczny zapis na urządzeniu, historia meczów, eksport/import JSON.
- Kopia w Supabase przypisana do anonimowej sesji tabletu, chroniona RLS.

## Uruchomienie

Node 22 lub nowszy. Aplikacja nie ma zależności wykonawczych.

```sh
npm ci
npm test
npm run dev
npm run build
```

Podgląd: http://127.0.0.1:4173. Wersja do publikacji: `dist/`.

## Vercel / Supabase

Ustaw w Vercel `PUBLIC_SUPABASE_URL` i `PUBLIC_SUPABASE_PUBLISHABLE_KEY` (wyłącznie publiczny klucz). Build wstawia konfigurację do `dist/src/config.js`. Nigdy nie używaj service_role ani secret key.

W osobnym projekcie Supabase włącz Anonymous Sign-ins i zastosuj `database/schema.sql`. Każdy tablet otrzymuje osobną sesję i dostęp tylko do własnych meczów. Serwer odrzuca zmianę właściciela zapisu. Zapis lokalny działa niezależnie od chmury. Po powrocie internetu następuje ponowna próba synchronizacji.

Skasowanie danych przeglądarki usuwa także anonimową sesję. Aby przenieść mecz na inne urządzenie, pobierz plik JSON i wczytaj go tam. Nie ma kont użytkowników ani współdzielonego pokoju online. Wspólna gra odbywa się na jednym tablecie, w jednej karcie.

## Weryfikacja

`npm test` obejmuje punktację, bust, Double Out, bull, sześciu graczy, Cricket, undo i odtwarzanie z JSON. Testy przeglądarkowe i stan publikacji opisuje `docs/POSTEP.md`.
