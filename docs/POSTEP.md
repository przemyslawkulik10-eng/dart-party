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

## 2026-10-16 — polskie zapowiedzi głosowe
- Przy zmianie gracza (również kwalifikacja) synteza mowy czyta „Teraz rzuca [imię]”; zwycięstwo: „Wygrywa [imię]! Brawo!”. Preferowany lokalny polski głos, język pl-PL.
- Głos respektuje wspólny przełącznik dźwięku; wyciszenie przerywa mowę, nowa zapowiedź usuwa poprzednią z kolejki. Brak obsługi syntezy nie blokuje gry.
- Test Chrome: zweryfikowane żądania polskiej mowy (mock speech engine), zwycięstwo 201/Cricket, wyciszenie i automatyczny powrót PASS. Rzeczywista barwa/wymowa zależą od głosów na urządzeniu; odsłuch na tablecie niesprawdzony.

## 2026-10-16 — głosowy wynik następnego gracza
- Zapowiedź zmiany kolejki w 501/301/201 zawiera aktualny wynik następnego gracza do zera, z odmianą punkt/punkty/punktów. Cricket, kwalifikacja i zwycięstwo nie dodają punktów do zera.
- Test przeglądarkowy: rzeczywista zmiana na Przemka z 226 punktami, automatyczny powrót, odmiany 1/2/12/22/101 i komunikaty bez wyniku PASS (sprawdzone żądania syntezy).

## 2026-10-16 — głosowy wynik zakończonej kolejki
- Po trzecim rzucie X01/Cricket: „[imię]. Wynik kolejki: [punkty]”. W Cricket podaje rzeczywiście zdobyte punkty, nie wartość zamykanych pól.
- BUST także przed trzecią lotką ogłasza przekroczenie i kolejkę za zero. Zwycięstwo zachowuje pierwszeństwo. Wspólne wyciszanie działa.
- Test przeglądarkowy: brak zapowiedzi po 1/2 lotkach; 180 X01, 120 Cricket, zero, wcześniejszy bust i mute PASS. Regresja zapowiedzi pozostałych punktów PASS.

## 2026-10-16 — Szanghaj i Cricket na przeciwników
- Wybór Cricket standard/cutthroat przed walką o start. Wariant przechodzi przez kwalifikację, rewanż, zapis JSON/chmurę bez zmiany schematu. Stare zapisy domyślnie standard.
- Cutthroat: nadmiar pola daje punkty każdemu rywalowi z otwartym polem; zamknięte chronią; wygrywa zamknięcie wszystkich z najniższym/równym wynikiem. Podsumowanie i głos podają łączną sumę dopisaną rywalom.
- Szanghaj S/D/T tego samego 1–20: pełny ekran, fanfara 6 tonów, żywsze tempo/ton głosu i „Ale petarda!”. Wynik zgodny z grą, BUST i wygrana uwzględnione.
- 34 testy logiki PASS. Przeglądarka: wybór wariantu przez kwalifikację i reload, 6 graczy (T17/S17/D17 daje każdemu otwartemu rywalowi 51, łącznie 255), undo, zapis, klasyczny Cricket 51 oraz X01 102 PASS. Widoki sprawdzone; głos testowany przez żądania syntezy, barwa zależy od urządzenia.
