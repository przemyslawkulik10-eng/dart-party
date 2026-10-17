# DART PARTY — checkpoint przed wieczornym testem

Stan: 17 października 2026, Europe/Warsaw. Użytkownik potwierdził „jest ok” po uproszczeniu ekranu, następnie odłożył grę do wieczora i poprosił o zapis.

## Gdzie kontynuować
Repo: /Users/przemyslawkulik/Documents/dart-party
Gałąź: codex/checkout-ui-20261017
Ostatni commit kodu: c0053bf. Lokalny adres użytkownika: http://127.0.0.1:4174.
Brak pusha/publikacji tej serii zmian. Produkcja nie sprawdzona.

## Gotowe lokalnie
JDC solo i pojedynek dwóch osób przy jednej tarczy. Osobne profile, po 57 lotek, zmiana co trzy lotki, wynik zwycięzca/remis. Osobne historie i wyniki, zapis/wznowienie i cofanie kolejki.
Shanghai: S/D/T, zaznaczane pudło każdej lotki, zbiorcze zero, jawne zatwierdzenie. Draft zapisuje się przy klikaniu. Pole nietrafione może być nieznane; nie udajemy lokalizacji poza tarczą.
Historia rzutów, bonusy, maksimum możliwego wyniku, kolorowe poziomy i porównanie z wcześniejszymi próbami. Mowa po zatwierdzeniu, fanfara Shanghai. Lotki SVG znajdują się przy poprzedniej kolejce w historii.
Zwarty ekran: trafienia/pudła/zatwierdzenie razem, poziomy i historia pod Szczegóły. Użytkownik zaakceptował bieżącą obsługę.

## Wieczorem
1. Odświeżyć stronę i wejść do JDC. Wybrać „We dwoje przy jednej tarczy”, Przemek i Mikołaj. Stara próba solo nie staje się automatycznie pojedynkiem.
2. Sprawdzić zmianę gracza, etap podwójnych i zakończenie pełnego pojedynku. Nie wpisywać sztucznych wyników do ich profili.
3. Ocenić dźwięk i wygodę bez przewijania na rzeczywistym urządzeniu. Nie ma potwierdzonej pełnej macierzy rozmiarów ekranu.

## Dowody i ograniczenia
91/91 testów Node PASS oraz npm run build PASS przed checkpointem. Obejmują logikę 38 kolejek pojedynku, JSON, remis/zwycięzcę i izolację zapisów. Nie oznacza to zakończenia pełnego testu dwóch osób na urządzeniu. CUA potwierdziło wcześniej wyświetlanie trzech ikon SVG; późniejsza próba odświeżenia została przerwana zmianą okna użytkownika.
Kont, synchronizacji historii w chmurze, kamer i nowego katalogu gier nadal brak. AI wymaga konfiguracji, nie potwierdzono działania na żywo. Kolejne prace wynikają z PLATFORMA-PLAN.md, nie zaczynać projektu od zera.

## Zabezpieczenie
Kopia obejmuje kod, testy i dokumentację, nie localStorage ani .env. Wyniki są w używanej przeglądarce; widoczne okno jest incognito, więc przed zamknięciem całej sesji incognito trzeba zachować dane gry inną metodą. Pełny backup/restore historii to otwarte zadanie.
Archiwum: checkpoints/2026-10-17-jdc/source.zip. Manifest SHA256SUMS oraz changes.patch obok. Odtwarzać do nowego katalogu przez rozpakowanie, nie nadpisywać istniejącego repo. Uruchomienie: PORT=4174 npm run dev (gdy port nie jest zajęty). Nie wykonywać migracji SQL ani publikacji z archiwum.
