# DART PARTY — stan pracy

Autorska aplikacja dla 2–6 osób przy jednej tarczy. Polski interfejs; 501/301/201 i Cricket. Domyślne imiona zgodne ze zleceniem. Supabase i Vercel mają być oddzielone od DostawaWarzyw pod nazwą DART PARTY.

## Gotowe
- Logika rzutów i replay historii; poprawny bust per gracz; cofanie także po wygranej.
- Zapis lokalny, eksport/import, lista meczów; adapter Supabase REST z anonimową sesją i RLS.
- 24 testy logiki: PASS.
- Test Chrome: sześciu graczy, punktacja, zmiana gracza, cofanie, odświeżenie/wznowienie, Cricket, historia; bez błędów JS. Widoki 1180×820, 820×1180, 390×844 bez poziomego przewijania.
- Konfiguracja publikacji Vercel i schemat bazy do osobnego projektu.

## Trwa
- Organizacja Supabase DART PARTY utworzona w planie Free; projekt i baza w przygotowaniu.
- Publikacja GitHub/Vercel i test rzeczywistego zapisu chmurowego.

## Potwierdzone po integracji
- GitHub: https://github.com/przemyslawkulik10-eng/dart-party (main).
- Supabase: organizacja DART PARTY `qvkkiqpnvsueqwfzmhla`, Free; projekt `ytljwejzcihyxfewrpej`, zdrowy.
- Własna tabela `dart_matches`, RLS, 3 polityki właściciela, anonymous sign-ins włączone.
- Test rzeczywistej bazy: zapis/odczyt PASS; odtworzenie po usunięciu lokalnej kopii PASS; drugi tablet nie może odczytać ani zmienić zapisu pierwszego PASS; brak sesji = odmowa API PASS; wpisywanie offline i ponowienie po powrocie sieci PASS.
- Naprawiono przed publikacją wyścig komunikatu synchronizacji; teraz czeka na najnowszą wersję lokalną i wysyła tylko zmienione mecze.
- Vercel: zgodnie z ostateczną decyzją użytkownika osobny projekt `dart-party` (`prj_rnhWM9JIVuxDURvdhmmAmenv8QSq`) w istniejącym zespole DostawaWarzyw. Nowego płatnego zespołu nie utworzono.
- Sprawdzony tablet 1024×768: przycisk następnego gracza mieści się w widoku.

Testy przeglądarkowe w `tests/browser-smoke.cjs` oraz `tests/cloud-smoke.cjs`. Wymagają Playwright (wyłącznie narzędzie QA, brak zależności runtime): ustaw `PLAYWRIGHT_MODULE` na zainstalowany moduł; opcjonalnie `CHROME_PATH` i `DART_TEST_URL`. Test chmury tworzy wyłącznie mecze testowych anonimowych sesji.

## Publikacja
- Vercel produkcja READY, commit aplikacji `2c3d9c9`.
- Publiczny adres: https://dart-party-alpha.vercel.app
- Test interfejsu na publicznym adresie: PASS, bez błędów JavaScript.
- Test chmury na publicznym adresie: PASS (zapis, odczyt, odtworzenie, izolacja tabletów, odmowa niezalogowanego API, offline/retry).
- Supabase Security Advisor: 0 błędów. Ostrzeżenie o anonimowym dostępie wynika z celowego modelu anonimowych sesji z kontrolą właściciela (sprawdzone dwoma niezależnymi klientami). Ochrona przed wyciekłymi hasłami nie dotyczy aplikacji bez haseł. Publiczne wykonanie technicznego triggera automatycznego RLS ograniczono oddzielnie.

## 2026-10-16 — walka o start i kolory
- Przed każdym nowym meczem i rewanżem: 3 lotki na gracza, suma 0/25/50; remisujący liderzy grają od zera do jednego zwycięzcy.
- Zwycięzca pierwszy, pozostali zachowują kolejność listy. Punkty kwalifikacji nie przechodzą do meczu.
- Cofanie również przez granicę dogrywki; stan kwalifikacji zapisany lokalnie i przywracany po odświeżeniu.
- Kolory zaakceptowane przez użytkownika: zielony, pomarańczowy, czerń.
- 27 testów jednostkowych PASS; test przeglądarkowy kwalifikacji i regresja 501/Cricket PASS; widok 390 px sprawdzony wizualnie.

## 2026-10-16 — graficzne pozostałe lotki
- Pod punktami trzy ukośne lotki skierowane w prawo, znikające 3–2–1–0 po rzutach; cofanie przywraca ikonę, następny gracz otrzymuje trzy. BUST kończy kolejkę, więc pokazuje zero dostępnych lotek.
- Test przeglądarkowy sprawdza wszystkie cztery stany, cofanie, przejście gracza i wznowienie; PASS. Sprawdzono wygląd tabletu.

## 2026-10-16 — pełnoekranowe imię
- Po zmianie kolejki pokazujemy imię następnego gracza wielkimi pomarańczowymi literami na prawie całą szerokość ekranu. Dotknięcie przechodzi do gry; Escape także zamyka ekran. Rozmiar dopasowuje się do imienia i obrotu urządzenia.
- Sprawdzony ekran PRZEMEK w przeglądarce, kliknięcie i regresja rozgrywki PASS.

## 2026-10-16 — automatyczne zamykanie imienia
- Ekran imienia zamyka się sam po 3000 ms. Nie wymaga dotykania; wcześniejsze zamknięcie czyści timer.
- Test przeglądarkowy czeka na automatyczny powrót bez kliknięcia — PASS.

## 2026-10-16 — imiona w walce o start
- Ten sam trzysekundowy ekran imienia przed pierwszym graczem oraz po zmianie rzucającego w kwalifikacji i dogrywkach.
- Test przeglądarkowy sześciu graczy, dogrywki, automatycznego zamykania, cofania i startu meczu PASS.

## 2026-10-16 — zwycięzca i dźwięki
- Wygrana przez rzut w X01/Cricket wyświetla pełnoekranowe imię z WYGRYWA!, po 3 s wraca do wyniku. Cofnięcie i ponowna wygrana ponownie uruchamia ekran.
- Web Audio: sygnał rzutu, zmiany gracza także w kwalifikacji, czterotonowa fanfara. Przycisk Dźwięk WŁ./WYŁ. z lokalnym zapamiętaniem ustawienia.
- Test przeglądarkowy 201 i Cricket: ekran, automatyczne zamknięcie, cztery oscylatory fanfary i wyciszenie PASS. Odsłuch fizycznego tabletu pozostaje po stronie użytkownika.
