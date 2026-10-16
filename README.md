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

### Cricket + / − i Szanghaj
Przed nowym meczem Cricket wybierz **+ Dla siebie** albo **− Na przeciwników** (Cut-Throat). W drugim wariancie każde nadmiarowe trafienie daje pełną wartość wszystkim przeciwnikom, którzy nie zamknęli pola. Wygrywa zamknięcie wszystkich pól z najniższym (również równym najniższemu) wynikiem. Podsumowanie kolejki pokazuje łączną sumę punktów dopisanych rywalom. Zapis, rewanż i eksport zachowują wariant; starsze zapisy bez wariantu pozostają standardowe.
Reguły Cut-Throat: [instrukcja Echowell, 2–16 graczy](https://www.echowell.com.tw/Product/Download/Dart_1016/1016_EN.pdf).

Pojedyncza, podwójna i potrójna tego samego numeru 1–20 w jednej kolejce (dowolna kolejność) uruchamiają **SZANGHAJ!**, fanfarę i energiczną zapowiedź. Punktacja pozostaje zgodna z trybem: 17 × (3+1+2) to 102 w X01, a w Cricket nadmiar ponad zamknięcie pola. BUST nadal zeruje kolejkę; Szanghaj nie jest automatycznym zwycięstwem.

### Niebieski widok, domowy Cricket i legi
- 301 domyślnie do 3 wygranych legów, bez setów. Po legu przycisk NASTĘPNY LEG zeruje stan rozgrywki do wartości startowej i rotuje rozpoczynającego, zachowując wynik legów. W ustawieniach można wybrać pojedynczy leg lub do2/do3.
- Nowe Cricket mają zaznaczone NASZE ZASADY: dwie różne potrójne 15–19 odblokowują20 osobno każdemu graczowi. Zamknięcie trzema pojedynczymi nie zalicza potrójnej. Bull służy do walki o start; brak dodatkowej blokady Bull.
- Zachowana zgodność starych zapisów: brak nowych ustawień oznacza pojedynczy leg i standardowe otwarcie.
- `/#nowe-301`: ekran przygotowania nowego301 do3 legów, zachowuje stare zapisy.
