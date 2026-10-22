# Liczniki na górze panelu i mnożnik ×0 — 22.10.2026

Przygotowanie lokalne zakończone. Użytkownik następnie zlecił commit na main, push i publikację obu poprawek. Status wdrożenia wymaga osobnego potwierdzenia po pushu.

- Strona główna zachowuje przyciski MOJE 180 / MOJE 170 obok GRAJ, TRENING i TWÓJ PANEL.
- Panel konkretnego gracza pokazuje oba liczniki jako pierwszą sekcję, przed nawigacją i ostatnim wynikiem. Wejście do panelu przewija do jego początku; kliknięcie licznika otwiera daty, godziny, grę i lotki.
- Liczniki nadal wynikają z zapisów tego profilu, bez drugiej kopii wartości. Historia na dole pozostaje szczegółowym archiwum.
- W Mnożniku solo i sparingu przy ×0 można pominąć nierozpoczęte rzuty na punkty. Zapis `skip-score` kończy tę fazę bez fikcyjnych pudeł i bez zmiany punktacji. Cofnięcie przywraca możliwość rzutu lub pominięcia. Trener pomija własną zerową kolejkę.
- Opcjonalne trzy rzuty treningowe nadal mogą zapisać 180/170. Pominięcia nie zmieniają liczników ani liczby faktycznie rzuconych lotek; następne rundy mają prawidłowe numery i godziny.

Weryfikacja: 201/201 testów, build i git diff --check. Test przeglądarkowy na danych w pamięci, oddzielony od danych użytkownika: kliknięcie obu liczników, data/godzina, pominięcie ×0 i cofnięcie. Układ 1920×1080, 1180×820, 1024×768, 820×1180, 390×844; panel i sparingi 2/6 osób z długimi nazwami: 15 wariantów, bez poziomego przepełnienia, liczniki panelu widoczne w pierwszym ekranie. Nie sprawdzano fizycznego tabletu/TV ani odsłuchu.

Powtarzalny lokalny podgląd: po build uruchomić `node tests/panel-zero-layout-fixture.mjs`; strony testowe w dist/public używają tylko pamięci, nie localStorage użytkownika. Kolejny build usuwa te strony z dist.
