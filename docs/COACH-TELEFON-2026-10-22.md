# Trener na telefonie — 22.10.2026

Poprawka CSS i opisu historii 180/170. Po testach lokalnych użytkownik 22.10.2026 zlecił push na main i wdrożenie obu zmian.

Historia „Moje 180” i „Moje 170” podaje nazwę gry lub treningu zamiast numeru kolejki. Data, godzina, rzuty i liczniki pozostają bez zmian.

- Do 740 px: mniejsze odstępy, kafelki wyników, komunikat trenera i wizualizacja lotek; przyciski dźwięku mieszczą się obok siebie, gdy jest miejsce.
- Przyciski klawiatury mają minimum 48 px, pozostałe aktywne kontrolki minimum 44 px. Wyniki i wszystkie pola 1–20 oraz BULL/pudło mieszczą się razem na ekranie gry 402×874 i 390×844. Na najmniejszych ekranach pozostaje pionowe przewijanie.
- Dodano obsługę safe-area telefonu: góra, dół i boki oraz tło pod paskiem statusu. Nie blokujemy zoomu.
- Reguły mobilne nie zmieniają rozmiarów na tabletach i monitorach ani zasad meczów.

Testy przeglądarkowe: 27 wariantów (320/360/390/402 px, obrót 844×390 oraz 1920×1080, 1180×820, 1024×768, 820×1180), krótka/długa nazwa i zakończony leg. Brak poziomego przepełnienia i kontrolek poniżej 44 px. T20 zmienia 301 na 241, cofnięcie przywraca 301. Zrzut porównania i pomiary: evidence/coach-phone-*20261022.*. To emulacja przeglądarkowa, nie test fizycznego iPhone ani odsłuchu.

Część oryginalnego checkoutu (m.in. index.html, engine.js, skrypt build oraz obiekty Git) macOS oznaczył compressed,dataless. Ich odczyt zatrzymywał się. Do testów pobrano czystą kopię main do /tmp/dart-phone-qa-20261022 i nałożono lokalne styles.css oraz player-milestones.js. Build i 201/201 testów przeszły w tej kopii; oryginalnych plików dataless nie nadpisywano.

Powtórzenie podglądu: po build uruchomić node tests/coach-phone-layout-fixture.mjs [ścieżka-do-dist] i otworzyć /public/phone-qa.html na oddzielnym serwerze lokalnym. Fixture używa pamięci zamiast danych użytkownika. Kolejny build usuwa strony QA z dist.

Próba budowania oryginalnego katalogu zwróciła spawn ENOEXEC dla binarnego esbuild z zależności w iCloud. Git zgłosił również niepełny plik pack. Nie naprawiano ani nie nadpisywano obiektów Git. Do ponownej próby build użyto ESBUILD_BINARY_PATH wskazującego działający esbuild 0.28.2 z kopii testowej.

Ponowny build oryginału zatrzymał się na pobieraniu źródeł z iCloud; przerwano go. Katalog wynikowy dist odtworzono ze zweryfikowanego buildu kopii testowej (bez stron QA), więc lokalny podgląd zawiera poprawkę. Nie zmieniono node_modules, danych użytkownika ani konfiguracji produkcji.
