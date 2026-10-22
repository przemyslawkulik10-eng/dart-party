# Układ wszystkich gier na telefonie — 22.10.2026

Lokalna kontynuacja po wydaniu 53e25c1 (trener na telefonie i nazwa gry w historii 180/170). Po zakończeniu audytu użytkownik zlecił commit, push na main i wdrożenie tych zmian. Potwierdzenie konkretnego wydania jest zapisywane osobno po publikacji.

## Zmiany
- X01 201/301/501: dwie kolumny wyników, klawiatura 48 px, mniej powielonych informacji i odstępów; wynik aktywnego gracza pozostaje w karcie, podpowiedź zejścia zachowana.
- Cricket dwóch graczy i trener: mnożnik przed planszą, pionowe BULL 25/50 o rozmiarze dotykowym, czytelny kontrast aktualnego wyniku. Większy skład zachowuje własną planszę.
- Cyferki: zawijanie rzędu z lotkami, pięć kolumn celów i kompaktowe wyniki. Usunięte przepełnienie dokumentu na telefonie.
- Mnożnik solo/sparing: mniejsze odstępy, czytelne fazy trafień/punktów, klawiatura, historia i zachowana dobrowolność przy ×0.
- JDC: mniejszy cel i liczniki, brak pustego miejsca na komunikat, akcje nie zasłaniają planszy; poziomy wyników w dwóch kolumnach. Shanghai, Double, pojedynek i podsumowanie sprawdzone.
- Celność sektora/BULL: mniejsze elementy dekoracyjne i odstępy, czytelne przyciski trafień.
- Safe-area i naturalne pionowe przewijanie. Reguły CSS tylko do 740 px. Bez zmian silników, profili, zapisów i zasad meczów.

## Dowody
99 wariantów w przeglądarce: 48 (16 scen × 320×568, 390×844, 402×874, długie nazwy), 18 (6 gier × 320×568, 390×844, 844×390, 6 graczy), 9 (trener 501/201 i pojedynek JDC × 3 rozmiary), 24 (6 scen × 1920×1080, 1180×820, 1024×768, 820×1180). Bez poziomego przepełnienia dokumentu i aktywnych przycisków poniżej 44×44 CSS px w zmierzonych scenach. Tabele historii mają własne przewijanie. Nie oznacza to testu każdej możliwej sytuacji meczu.

Kliknięcia w prawdziwych komponentach, na danych w pamięci: 301 T20 daje 241, cofnięcie wraca do 301; Cricket BULL 50 daje 2 znaczniki, cofnięcie 0; Cyferki T20 zamyka pole i daje 3 pkt, cofnięcie przywraca cel; JDC S10/D10/T10 daje Shanghai 160 i automatycznie cel 11, cofnięcie przywraca 10 i 0 pkt; celność T20 daje 1/1, cofnięcie 0/0; Mnożnik ×0 pozwala pominąć 3 lotki i przekazać grę kolejnej osobie, cofnięcie przywraca wcześniejszego gracza.

201/201 testów jednostkowych, build i diff check: sukces. Testy i build w czystej kopii /tmp/dart-phone-qa-20261022. Źródła zachowano w trwałym release-phone-20261022. Snapshoty emulują rozmiar CSS; fizyczny iPhone, notch/safe-area PWA, odsłuch i dwa urządzenia pozostają niezweryfikowane.

Fixture: npm ci → npm run build → node tests/all-games-phone-fixture.mjs → SERVE_DIR=dist PORT=43829 npm run dev. Otwórz /public/games-phone-qa.html na odrębnym originie. Parametry: scenes=301,cricket,cyferki; sizes=390x844; players=6; long; scale=0.65 (skala tylko galerii, viewport ramki pozostaje rzeczywisty). Produkcyjny build nie generuje fixture. Nie używaj rzeczywistych danych graczy.
