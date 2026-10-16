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
