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

## 2026-10-16 — czytelna tabela Cricket
- Punkty i imiona graczy przeniesione do prawego panelu nad klawiaturą, dwa szerokie kafelki przy 2 graczach, siatka 3 kolumn przy większym składzie.
- Lewy panel powiększony: nagłówki tabeli 18–28 px zamiast 8 px, numery 22–32 px, znaki 32–46 px. Większe imię rzucającego, wyraźne kolumny i zielone zamknięcia.
- Dla 4–6 graczy tabela przewijana poziomo, z automatycznym pokazaniem kolumny rzucającego i przypiętym numerem pola. Na telefonie panele jeden pod drugim.
- Test Chrome: 2 i 6 graczy przy 1180/1024/820/390 px, pozycja wyników nad klawiaturą, brak poziomego wyjścia strony, nienaruszony zapis meczu, scoring i undo PASS. Screenshoty tabletowe obejrzane.

## 2026-10-16 — niebieski styl, pełna tabela, zasady domowe i legi
- Paleta inspirowana wzorcem MÓZG HALA: granat/niebieski/turkus/biel, większe napisy, CSS uppercase w całym UI.
- Cricket: tabela wypełnia lewy panel w dostępnej wysokości, szczegóły lotek przeniesione na prawo; brak przewijania tabeli i całej strony w 1180x820,1024x768,820x1180 (2/6 graczy). Telefon zachowuje pionowy układ. BULL nie wychodzi z kolumny.
- Opcja domowa domyślnie w nowych Cricket: 20 dopiero po dwóch różnych potrójnych 15–19, osobno dla gracza. Wczesne 20 wpisujemy jako pudło. Bull tylko walka o start, nie wymaga zamknięcia przed innymi. Stare mecze nie zmieniają zasad.
- Mecze do 1/2/3 wygranych legów, bez setów. 301 domyślnie3. Kolejny leg resetuje punkty/pola, zachowuje wynik legów i rotuje start. Wygrana meczu dopiero przy wymaganej liczbie. Undo/JSON/cloud przechowują cały strumień zdarzeń; nie ma migracji bazy.
- Link /#nowe-301 otwiera ustawienia nowego301 do3 legów ze składem ostatniego lokalnego meczu; stare wyniki zachowane. Nie potwierdzono zdalnego restartu użytkownikowej karty: bridge nie znalazł jej, dlatego przygotowany bezpośredni link.
- 39 testów silnika PASS. Test przeglądarkowy legs-opening PASS. Dwaj agenci niezależnie: QA tabletu i QA legów PASS; poprawiono zgłoszone BULL. Głos rozróżnia leg od całego meczu.

## 2026-10-16 — pełny ekran gry X01
- Usunięto limit szerokości 1360px i puste kolumny wyników: liczba kolumn odpowiada liczbie graczy.
- 301/501/201 wypełniają dostępną szerokość i wysokość. Wynik główny do290px, przyciski skalują się w wolnej przestrzeni, większe imiona/wyniki/legi. Historia pozostaje w zapisach, dolny pasek nie zajmuje miejsca podczas gry.
- Test2/6 graczy: 1920x1080,1440x900,1180x820,1024x768,820x1180; brak scrolla, następny gracz w kadrze, scoring/undo PASS. Obejrzano screenshot1920.


## 2026-10-17 — wznowienie i przeniesienie katalogu roboczego
- Aktualny katalog pracy: `/Users/przemyslawkulik/Documents/dart-party`.
- Za zgodą użytkownika skopiowano całe istniejące repo z `.codex/visualizations/2026/10/16/01a14538-ffcf-76a1-8a49-4fb18c07c1e1/dart-tablet`; źródło pozostawiono jako kopię. Zgodność SHA-256 wszystkich 247 plików potwierdzona przed buildem.
- Zachowano Git (HEAD `4d35201a14b8852d0e4896b5a0ce70fedc8077e9`) i wszystkie niezacommitowane zmiany podpowiedzi: src/app.js, src/sound.js, styles.css, src/checkout.js, tests/checkout-browser.cjs, tests/checkout.test.mjs.
- W nowym katalogu: 42/42 testy PASS, build PASS. Usunięta przeszkoda pracy: build w źródłowym katalogu kończył się EPERM przy unlink dist/index.html.
- Testów przeglądarkowych w tej sesji nie wykonano; rzeczywisty głos na tablecie niesprawdzony. Produkcji ani bazy nie zmieniano. Bez commitu/pusha.
- Następne: sprawdzić podpowiedzi w przeglądarce (2/6 graczy, długie imiona, rozmiary ze skilla). Wyjaśnić próg 100 punktów: lektor czy mikrofon. Aktualne podpowiedzi mają próg 170 double out / 180 straight out. Mikrofon nadal niezaimplementowany.
- Nie zmieniać zapisanych meczów ani localStorage użytkownika. Publikacja wymaga wyraźnej zgody.

## 2026-10-17 — próg podpowiedzi potwierdzony: 170
- Użytkownik doprecyzował „próg od 170”. Ekran i lektor podpowiadają przy 170 punktach lub mniej, zarówno straight out, jak i double out. Wspólna stała CHECKOUT_HINT_THRESHOLD w src/checkout.js.
- Silnik nadal poprawnie oblicza możliwe zejście 180 straight out; próg ogranicza prezentowanie podpowiedzi, nie zasady gry.
- 43/43 testy PASS, build PASS. Dodany test granicy głosu 170/171/180 dla obu trybów i podglądu kolejki. Test przeglądarkowy nadal do wykonania.
- Zmiany lokalne, bez commitu/pusha i publikacji. Mikrofon nadal niezaimplementowany.

## 2026-10-17 — radość za 100+ punktów
- W X01 po zakończonej kolejce za co najmniej 100 punktów lektor mówi „Ale setka! Brawo! Świetna kolejka!” i gra czterotonowa fanfara. Za 180: „Sto osiemdziesiąt! Maksimum! Ale petarda! Brawo!” i sześć tonów. Żywszy głos.
- BUST nie uruchamia celebracji, wyciszenie obejmuje głos i fanfarę. Wygrana i Szanghaj zachowują własne komunikaty z pierwszeństwem. Cricket bez nowego progu (suma dopisana wielu rywalom nie odpowiada wynikowi X01). Podpowiedź zejścia pozostaje w tej samej wypowiedzi po okrzyku.
- Testy 44/44 PASS, build PASS, git diff --check PASS. Test dźwięku sprawdza żądania syntezy i liczbę tonów; odsłuch na urządzeniu i QA przeglądarkowe niewykonane. Lokalny serwer wcześniej zablokowany EPERM listen 127.0.0.1:4173.
- Bez publikacji i commitu. Następne: uruchomienie lokalne po stronie użytkownika i odsłuch; test turn-speech-browser.cjs ma historyczne oczekiwania sprzed podpowiedzi i wymaga aktualizacji przed uruchomieniem.

## 2026-10-17 — publikacja autoryzowana, zatrzymana przez DNS
- Użytkownik odpowiedział TAK na publikację; zakres: lokalne podpowiedzi od 170 i celebracja 100+/180.
- Sprawdzenie zdalnego main przez git ls-remote origin refs/heads/main zakończone kodem 128: Could not resolve host: github.com. Zgodnie z zasadą STOP nie obchodzono blokady.
- Nie wykonano commitu, pusha ani wdrożenia. Produkcja pozostaje niezweryfikowana. Lokalnie ostatnie testy 44/44 i build PASS.
- Następne: po przywróceniu dostępu sprawdzić zdalny main, dokończyć QA przeglądarkowe, commit i push przez istniejącą integrację Git/Vercel, potwierdzić wdrożony commit i działanie strony.

## 2026-10-17 — ponowna próba wznowienia publikacji
- Użytkownik ponownie potwierdził wznowienie sprawdzenia i publikacji podpowiedzi od 170 oraz celebracji 100+/180.
- Odczyt `git ls-remote origin refs/heads/main` ponownie zakończył się kodem 128: `fatal: unable to access 'https://github.com/przemyslawkulik10-eng/dart-party.git/': Could not resolve host: github.com`.
- STOP zgodnie z zasadą użytkownika; bez obejść, commitu, pusha i wdrożenia. Testów w tej próbie nie uruchamiano. Zmiany aplikacji pozostawione bez modyfikacji.
- Punkt wznowienia: po przywróceniu DNS sprawdzić zdalny main, zweryfikować lokalne zmiany i dokończyć QA, następnie publikować w zaakceptowanym zakresie przez istniejącą integrację Git/Vercel i potwierdzić wdrożenie.

## 2026-10-17 — GitHub dostępny w przeglądarce według użytkownika
- Po potwierdzeniu użytkownika ponowiono wyłącznie `git ls-remote origin refs/heads/main`.
- Środowisko agenta nadal zwraca kod 128: `Could not resolve host: github.com`. Dostęp przeglądarkowy nie potwierdza dostępu Git w tym środowisku.
- Bez commitu, pusha, wdrożenia i nowych testów. Następny krok diagnostyczny: uruchomić to samo polecenie w Terminalu użytkownika; nie obchodzić blokady środowiska agenta.

## 2026-10-17 — zdalny HEAD potwierdzony przez Terminal użytkownika
- Użytkownik dostarczył wynik `git ls-remote`: zdalny main = `4d35201a14b8852d0e4896b5a0ce70fedc8077e9`, zgodny z lokalnym HEAD. To wynik z Terminala użytkownika, nie z sieci agenta.
- Ponownie wykonano lokalnie: npm test = 44/44 PASS; npm run build = PASS.
- Próba npm run dev zakończyła się kodem 1: `Error: listen EPERM: operation not permitted 127.0.0.1:4173`. Zatrzymano próby uruchomienia serwera; bez obejść.
- QA przeglądarkowe nadal niewykonane. Historyczny tests/turn-speech-browser.cjs wymaga aktualizacji oczekiwań dla podpowiedzi i celebracji przed użyciem. Kod aplikacji i testów w tej próbie bez zmian; bez commitu i publikacji.
- Następny krok: użytkownik uruchamia `cd /Users/przemyslawkulik/Documents/dart-party && npm run dev` w swoim Terminalu i pozostawia proces aktywny; potem można kontynuować QA istniejącego serwera.

## 2026-10-17 — port 4173 zajęty przez istniejący serwer
- Użytkownik otrzymał EADDRINUSE. Odczyt lsof potwierdził proces node PID 14269 nasłuchujący na 127.0.0.1:4173, cwd=/Users/przemyslawkulik/Documents/dart-party. Nie zatrzymywano procesu.
- Próba otwarcia strony narzędziem przeglądarkowym: `Browser is not available: iab`; lista dostępnych przeglądarek pusta. Nie potwierdzono widoku strony ani QA.
- Następny krok: udostępnić Chrome narzędziu przeglądarkowemu, aby wykonać QA istniejącego serwera. Użytkownik może otworzyć http://127.0.0.1:4173 bez ponownego uruchamiania serwera. Publikacja nadal niewykonana.

## 2026-10-17 — natywne QA Chrome, poprawki układu i pulsowanie
- Dostęp do Chrome uzyskano przez natywne CUA (brak konektora przeglądarkowego). Testy w osobnym oknie incognito; oryginalnego meczu nie edytowano. Użytkownik równolegle wykonywał rzuty w oknie testowym, co kilkukrotnie przerywało działania CUA.
- Import testowego JSON 301 / 6 graczy / Double Out: 170 pokazuje T20, T20, BULL 50 z oznaczeniem NA NASTĘPNĄ KOLEJKĘ. Cofnięcie ostatniego rzutu przywróciło 181 i ukryło podpowiedź; ponowne 11 przywróciło 170 oraz podpowiedź. Odświeżenie i wznowienie zachowało stan.
- QA wykryło nakładanie panelu podpowiedzi na duży wynik oraz w pionie nachodzenie wyniku na lotki. Poprawiono styles.css: rozmiar wyniku zależy od szerokości jego kontenera, mniejszy w pionie z podpowiedzią.
- Obejrzano 6 graczy przy 1920x1080, 1180x820, 1024x768 i 820x1180 w Chrome DevTools. Po poprawkach wynik i podpowiedź są rozdzielone; w pionie wynik nie nachodzi na lotki. Pełna macierz 2 graczy i długich imion nadal DO WYKONANIA (fixture /private/tmp/dart-qa-two.json przygotowane, niewczytane).
- Na polecenie użytkownika przycisk #next z imieniem następnego gracza pulsuje po zakończeniu kolejki (jasność i poświata, 1.4 s). Przy reduced motion stałe obramowanie. Wizualnie potwierdzono podświetlenie PRZEMEK oraz przejście po kliknięciu do ekranu Teraz rzuca PRZEMEK. Nie potwierdzono osobnym testem animacji po przejściu.

## 2026-10-17 — poprawa celebracji po odsłuchu użytkownika
- Użytkownik uznał wcześniejsze Ale setka! Brawo! Świetna kolejka! za bezuczuciowe; zaakceptował zmianę.
- Za dokładnie 100: Jeeest! Setka! Brawo, [imię]!; za 101–179: Ooo, pięknie! [punkty] punktów! Brawo, [imię]! (odmiana punktów wg istniejącej funkcji); za 180: Jeeest! Sto osiemdziesiąt! Maksimum! Brawo, [imię]!
- Celebracja zastępuje formalny odczyt wyniku, zamiast być doklejana do niego. Podpowiedź pozostaje na końcu. Tempo celebracji 1.02, pitch 1.12; inne zapowiedzi zachowane. Zmieniono melodię czterotonowej fanfary 100+.
- Po ostatnich zmianach npm test = 44/44 PASS, npm run build = PASS, git diff --check = PASS. Test celebracji sprawdza nowe teksty i tempo. Brzmienie nowej wersji wymaga odsłuchu użytkownika po odświeżeniu.
- Nadal do wykonania: pełne QA 2 graczy/długich imion, aktualizacja historycznego tests/turn-speech-browser.cjs, publikacja przez Git/Vercel i weryfikacja zdalnego commitu. Dostęp Git z agenta nadal ostatnio blokował DNS; bez obchodzenia blokady. Nie uznawać lokalnego QA za publikację.
- Checkpoint kodu zapisany lokalnie w commicie `379c7b6` na własnej gałęzi `codex/checkout-ui-20261017`. Main nie zmieniony, bez pusha. Ten dopisek po commicie pozostaje w drzewie roboczym; dalsze zadania opisane powyżej.

## 2026-10-17 — użytkownik nie słyszał nowej celebracji
- Potwierdzono nowy tekst Jeeest w src/sound.js i dist/src/sound.js. Otwarta karta była lokalna 127.0.0.1:4173 w incognito.
- Wykonano twarde odświeżenie Chrome i Wznów mecz. Zachowana testowa kolejka Mańka: T20, 20, 20 = 100, pozostaje 201.
- Cofnięto i powtórzono ostatnie pojedyncze 20 w testowym meczu, aby ponownie wywołać celebrację. Końcowy wynik odtworzony: MANIEK 201 / 100 w kolejce. Chrome pokazał odtwarzanie dźwięku. Dokładna słyszalna treść i jakość głosu wymagają potwierdzenia użytkownika; nie ustalono jednoznacznie przyczyny wcześniejszego braku zmiany.

## 2026-10-17 — zgłoszenie 180 odczytanego jako 100
- Odczyt bieżącej testowej karty Chrome: JAREK, LOTKA 1 T20, LOTKA 2 20, LOTKA 3 20; suma wyświetlana 100.
- Przyczyna potwierdzona w src/app.js: update(next) resetuje multiplier=1 po każdym rzucie. Jednorazowe wybranie x3 i trzykrotne 20 daje 60+20+20, nie 180. src/sound.js rozróżnia osobno 100 i 180.
- Nie zmieniano punktacji, zapisanych rzutów ani zachowania mnożnika. Do wpisania 180 w aktualnym UI trzeba wybierać x3 przed każdą z trzech dwudziestek. Ewentualne utrzymywanie mnożnika przez kolejkę wymaga uzgodnienia z użytkownikiem.

## 2026-10-17 — utrzymanie mnożnika przez kolejkę (zaakceptowane)
- Użytkownik potwierdził: x3 pozostaje aktywne do ręcznej zmiany lub końca kolejki. update(next) zachowuje mnożnik, jeśli id meczu, gracz, runda i leg pozostają takie same; zmiana kolejki/lega/meczu resetuje x1. Cofanie w tej samej kolejce zachowuje wybór, przekroczenie granicy kolejki resetuje. Wznowienie po przeładowaniu nadal zaczyna od x1.
- Natywny test Chrome w incognito po twardym odświeżeniu: BEKO, jeden wybór x3 i trzy kliknięcia 20 = T20/T20/T20, KOLEJKA ZAKOŃCZONA 180 PKT W KOLEJCE. Następnie MACIEK: puste trzy lotki i aktywne x1 (x2/x3 nieaktywne). PASS.
- npm test 44/44 PASS, npm run build PASS, git diff --check PASS. Zmiana dotyczy wejścia UI; nie przelicza wcześniejszych zapisów. Brak publikacji; wcześniejsze zadania QA/publikacji pozostają otwarte.
- Poprawka mnożnika zapisana w lokalnym commicie `581c101` na `codex/checkout-ui-20261017`, bez pusha. Ten dopisek aktualizuje checkpoint po commicie.

## 2026-10-17 — podpowiedź przy podejściu do tarczy, nie na końcu kolejki
- Użytkownik zgłosił, że podpowiedź na końcu jest za wcześnie względem następnego podejścia zawodnika. Usunięto głosową i ekranową podpowiedź po zakończeniu kolejki (również BUST). finishAdvice zwraca pusty tekst dla state.ready; panel pojawia się wyłącznie w aktywnej kolejce przy <=170.
- Zapowiedź zmiany gracza nadal dołącza finishAdvice dla nowego zawodnika: imię, pozostałe punkty, zejście z 3 lotek. Podczas aktywnej kolejki podpowiedź aktualizuje się po rzutach; przycisk powtórzenia pozostaje.
- Natywne Chrome po twardym odświeżeniu i wznowieniu: MACIEK 156, zakończona kolejka 14 punktów, panel podpowiedzi nieobecny. Zapis meczu zachowany. W tym etapie nie wykonano pełnego cyklu powrotu do zawodnika ani osobnego odsłuchu nowej zapowiedzi.
- Zaktualizowano tests/checkout-browser.cjs: brak podpowiedzi po końcowym rzucie, podpowiedź po powrocie zawodnika, powtórzenie głosu i widoki z aktywną podpowiedzią. Zweryfikowano składnię skryptu; samego skryptu Playwright nie uruchamiano.
- npm test 44/44 PASS; npm run build PASS; git diff --check PASS. Brak publikacji; wcześniejsze otwarte zadania QA nadal obowiązują.
- Checkpoint tej poprawki: lokalny commit `664eaf7` na `codex/checkout-ui-20261017`, bez pusha; niniejszy dopisek po commicie pozostaje niezacommitowany.

## 2026-10-17 — pomarańczowe cele rzutu i zmiana kierunku projektu
- Na prośbę użytkownika dodano pomarańczowy #ffa447 do panelu zejścia: nagłówek, obramowanie, T/D/S/BULL, strzałki i przycisk powtórzenia. Ciepłe ciemne tło odróżnia cel rzutu od niebieskich wyników. Zmiana wyłącznie styles.css.
- Build PASS, git diff --check PASS. Potwierdzone wizualnie w Chrome na zaimportowanym osobnym fixture 301 / 2 graczy z długimi imionami / aktywne 170 double out: pomarańczowe T20, T20, BULL 50 czytelne i oddzielone od wyniku. Fixture wczytany w incognito, poprzedni mecz pozostaje w zapisach.
- NOWY KIERUNEK od użytkownika: aplikacja ma docelowo trafić do App Store i być dostępna na iOS i Androidzie. Przerwano dalsze przygotowanie publikacji dotychczasowej wersji web; najpierw ustalić architekturę i zakres wersji mobilnej. Nie tworzono jeszcze projektów natywnych, nie zakładano kont sklepowych, nie wysyłano aplikacji do sklepów.
- Checkpoint dotychczasowych zmian: `90be114`, własna gałąź, bez publikacji. Wstępnie rekomendowany do oceny Capacitor: istniejący JavaScript plus projekty iOS/Android (źródło: https://capacitorjs.com/docs). To rekomendacja, nie wykonana migracja. Przed wyborem architektury ustalić, czy podstawowy mecz odbywa się na jednym wspólnym urządzeniu, czy każdy gracz ma własny telefon.

## 2026-10-17 — dalsze QA i odrzucenie ramki podpowiedzi
- Zaktualizowano historyczny tests/turn-speech-browser.cjs do nowych celebracji, podpowiedzi w aktywnej kolejce i utrzymywania x3. Sprawdzono składnię, bez wykonania Playwright.
- Przygotowano /private/tmp/dart-qa-301-legs.json: 2 długie imiona, 301 Double Out, do 3 legów. Podczas wspólnego testowania użytkownik wykonywał działania równolegle. Zaobserwowano ekran ALEKSANDER-KONSTANTY WYGRYWA LEG z przyciskiem NASTĘPNY LEG; nie traktować tego jako pełnego testu wykonanego przez agenta. Test przejścia do drugiego lega został przerwany zmianą okna przez użytkownika.
- Użytkownik odrzucił pomarańczowy kontener. Usunięto ciemne brązowe tło, ramkę i pomarańczowe wypełnienie przycisku powtórzenia. Pomarańczowe cele i nagłówek pozostały na zwykłym tle. Build i diff-check PASS. Nie potwierdzono jeszcze wizualnie końcowego wariantu po tej zmianie.
- Pytanie o prezentację celu pozostaje bez odpowiedzi: jeden wielki następny cel vs cała sekwencja bez ramki. Nie wdrożono dodatkowej przebudowy układu na podstawie domysłu.
- Użytkownik zapytał, gdzie inne gry. Otwarto + NOWY MECZ i potwierdzono w Chrome widoczne 501, 301, 201, CRICKET oraz WZNÓW MECZ. Aktualny mecz zachowany. Dalsze nowe gry dopiero po zakończeniu 301, zgodnie z wcześniejszym ustaleniem.
- Publikacja oraz pełne QA wciąż nieukończone. Przed ogłoszeniem 301 gotowym dokończyć testy legów, podpowiedzi przy zmianie gracza i docelowego układu.
- Checkpoint `aedfe60` lokalnie, bez pusha; powyższy stan QA pozostaje aktualny. Dopisek po commicie niezacommitowany.

## 2026-10-17 — INNA GRA i Cricket na 2 graczy
- Dodano przycisk INNA GRA obok ZAPISANE MECZE w górnym pasku. Otwiera wybór gier, bez kasowania zapisanych meczów. Na ekranie ustawień nie resetuje edytowanego formularza. Build i diff-check PASS.
- Potwierdzono przycisk w Chrome po odświeżeniu. Użytkownik równolegle zmienił grę; po poleceniu CRICKET NA 2 GRACZY odczytano już aktywny Cricket: MACIEK i PRZEMEK, obaj 0, runda 1, teraz MACIEK, punktacja + dla siebie. Agent nie tworzył dodatkowego meczu ani nie zmieniał rzutów.
- Widoczna obecna zasada domowa: 20 zablokowana do dwóch różnych potrójnych 15–19. Zachowano konfigurację. Dalsze QA 301 pozostaje otwarte; nie ogłaszać całej przebudowy zakończoną.

## 2026-10-17 — Cricket: środkowe pola i punkty przeciwnikom
- Dla dwóch graczy kolumny: pierwszy gracz | POLE | drugi gracz. Numery 20–15 i BULL w środku, pomarańczowe #ffa447. Większe składy zachowują pole po lewej. Układ dwóch graczy potwierdzono wcześniej w Chrome; kolor zmieniony później.
- Użytkownik określił wariant: wszystkie pola zamknięte i najmniejszy wynik; nadmiarowe trafienia dopisują punkty przeciwnikom. Istniejący cutthroat realizuje tę regułę. Ustawiono go domyślnie w formularzu nowych gier i poprawiono etykiety. Zapisane mecze zachowują swoją punktację, bez przeliczania historii.
- Poprzedni checkpoint nawigacji: 6973a86. Pełne QA 301 i publikacja nadal otwarte.
- Weryfikacja: 44/44 testy PASS (w tym dopisywanie rywalom, zamknięte pola, najniższy wynik, undo i zapis), build PASS, diff-check PASS. Bez publikacji.

## 2026-10-17 — celebracja trzech potrójnych w Cricket
- Powód braku gratulacji: Cricket miał celebrację Shanghai (S/D/T tego samego pola), ale nie trzech potrójnych. Dodano rozpoznanie trzech potrójnych 15–20 w jednej kolejce, również różnych pól.
- Po trzeciej lotce: ekran TRZY POTRÓJNE z imieniem, fanfara i głos „Jeeest! Trzy potrójne! Ale petarda! Brawo…”. Wygrana leg/mecz zachowuje pierwszeństwo i jest dołączona do wypowiedzi. Wyciszenie nadal obowiązuje.
- 45/45 testów PASS, składnia app.js, build i diff-check PASS. Odsłuch i ekran celebracji po tej zmianie jeszcze nie sprawdzone w Chrome. Użytkownik testuje równolegle, nie dopisywano mu sztucznych rzutów.
- Przed rozpoczęciem tego testu Chrome pokazywał poprzedni zapis Cricket + dla siebie; nie potwierdzono jeszcze przejścia na punkty przeciwnikom. Poprzedni checkpoint: fb00646. Bez publikacji.

## 2026-10-17 — audyt konkurencji i kierunek trenera
- Raport: docs/AUDYT-KONKURENCJI-2026-10-17.md. Audyt publicznych źródeł, bez instalacji, zakupów i testów konkurencyjnych aplikacji przy tarczy.
- Potwierdzono polski produkt AstroDarts, polski interfejs DartsOn, personalizację GoDartsPro i trenera AI z planem tygodnia All-Round. Nie używać tezy o braku konkurencji.
- Znaleziono oficjalne https://scoliadarts.com/api/ — zdarzenia trafień, XY, kąty i wyjmowanie lotek. Warunki dostępu nieustalone; bez kontaktu z producentem.
- Wizja użytkownika: profile i historia lotek; TRENING wspierany przez AI, ZAWODY bez komentarza i podpowiedzi; trening tygodniowy na podstawie weekendowych sparingów. To plan produktu, nie wykonane funkcje.
- Nie zmieniono kodu. Poprzedni commit celebracji: 11be6ee. QA przy tarczy i wcześniejsze QA 301 pozostają otwarte.

## 2026-10-17 — dwa tryby, pierwszy trening solo i aktywna kolumna Cricket
- Ekran wejścia: TRENING / ZAWODY. TRENING to pierwsze ćwiczenie sektor 20, faktyczny zapis lotek i zamierzonego celu, procent celności, wybór 5/10/15 minut, pauza, cofnięcie, zakończenie i wznowienie po przeładowaniu. Historia lokalna w osobnym kluczu dart-party-training-v1; brak kont, synchronizacji treningu, AI i odblokowywania poziomów na tym etapie.
- Nowe mecze z ekranu ZAWODY otrzymują sessionType=competition: brak podpowiedzi checkout, mowy, dźwięków rzutów i dialogów celebracji. Stare mecze bez flagi zachowują dotychczasowe zachowanie. Zapis/metadane przechodzą przez JSON i undo.
- Użytkownik zaproponował pomarańczową kolumnę aktywnego zawodnika. Dodano pomarańczowe imię, symbole i ciemne ciepłe tło aktywnej kolumny. Neutralne cyfry środkowe znów jasne. Zmiana zależy od state.current.
- Pytanie użytkownika o blokadę 20: odczyt Chrome pokazał Przemek 1/2 różnych potrójnych. Aktywny mecz nadal Cricket + dla siebie, runda 7, Maciek 199 / Przemek 414. Nie przeliczono reguł ani nie dopisano rzutów do tego meczu. Wyjaśniono domową opcję otwarcia.
- QA: 49/49 testów PASS, build i syntax PASS, diff-check PASS. Nowe testy sprawdzają cel vs trafienie, pauzę/deadline po JSON, blokadę rzutów po końcu, ochronę uszkodzonego zapisu i flagę zawodów.
- Chrome, osobna karta: utworzono test treningu pod nazwą TEST TRENINGU; 20 -> 1/1 i 100%, następnie 1 -> 1/2 i 50%, undo -> 100%; pauza blokuje keypad; odświeżenie zachowuje 14:47 i 1 lotkę; wznowienie i zakończenie daje zapisany wynik. Sesja TEST TRENINGU pozostaje osobno w historii.
- Wizualnie potwierdzona pomarańczowa kolumna Przemka w istniejącym meczu, bez zmiany wyników. Nie wykonano jeszcze pełnego UI testu nowych zawodów ani nowej macierzy 2/6 graczy i czterech rozmiarów. Nie ogłaszać pełnego QA.
- Ustalenia poziomów i krótkich sesji zapisano w docs/KIERUNEK-ROZWOJU.md; progi awansu pozostają do ustalenia. Brak publikacji.

## 2026-10-17 — korekta: pomarańczowy licznik, nie kolumna
- Użytkownik doprecyzował, że pomarańczowy ma być licznik punktów rzucającego. Usunięto pomarańczowe tło i symbole kolumny Cricket; wróciły wcześniejsze kolory tabeli. Aktywna karta wyniku (imię + punkty) jest teraz pomarańczowa z ciemnym tekstem. Wskazanie przechodzi za klasą active przy zmianie gracza.
- Wyłącznie CSS; logika meczu i zapisy bez zmian. Build i diff-check PASS. Bez odświeżania trwającej gry użytkownika i bez publikacji.

## 2026-10-17 — dobrowolny wirtualny trener
- W formularzu i podczas treningu dodano checkbox „Wirtualny trener — chcę wskazówki”, domyślnie wyłączony. Bez zaznaczenia zostają cel ćwiczenia, wyniki i zapis; brak porad po rzucie. Można zmieniać wybór w trakcie sesji, jest zapisywany z treningiem. Starsze sesje bez flagi pozostają bez trenera.
- Włączony trener pokazuje podstawowe wskazówki dla sektora 20 i podsumowanie ostatnich 3 lotek. UI jawnie informuje, że AI będzie dostępne później; nie podłączono modelu ani usług zewnętrznych.
- 50/50 testów PASS, build, syntax i diff-check PASS. Nowy test: opt-in, stare zapisy, wyłączenie, seria 2/3 i JSON. Nie przeprowadzono jeszcze wizualnego QA nowego checkboxa. Bez publikacji.

## 2026-10-17 — fundament profili/AI i potwierdzenie oddzielenia hobby
- Lokalne profile UUID, przypisanie nowych treningów i meczów, agregacja statystyk bez nazw i adapter OpenAI. Szczegóły i uruchomienie: docs/ARCHITEKTURA-AI.md.
- Backend wyłącznie lokalny, klucz po stronie serwera; brak publicznego API, kont i synchronizacji profili. Nie wykonano rzeczywistego wywołania AI ani QA nowego UI. Potrzebna konfiguracja klucza/modelu i restart dotychczasowego serwera przed zapisaniem sekretów.
- Użytkownik zatwierdził osobne projekty na obecnych kontach oraz przyszłą opcjonalną subskrypcję produktu. Nie tworzyć nowych kont tylko dla hobby.
- Read-only konektory potwierdziły osobne repo GitHub i projekt Vercel. Supabase pokazuje tylko Magazyn; nie podłączono do niego gry. Tworzenie dedykowanej bazy i koszt pozostają nierozstrzygnięte. Bez pusha, publikacji, migracji i zakupów.
- Użytkownik wskazał DJC jako najważniejszą grę przygotowującą do zawodów. Skrót i zasady wymagają doprecyzowania; nie implementować domysłu.
- Weryfikacja końcowa: 57/57 testów PASS, build PASS, diff-check PASS, parser configure-ai.py PASS. Transport AI w testach jest atrapą; brak potwierdzenia działania usługi na żywo.

## 2026-10-17 — JDC Challenge zbudowane lokalnie
- Zatwierdzone przez użytkownika zasady i polecenie BUDUJ. GoDartsPro punktem odniesienia dla rutyny i historii wyników; własny interfejs DART PARTY.
- src/jdc.js: 57 lotek (18/21/18), Shanghai 10–15 i 15–20: wartość trafionego celu i +100 za S/D/T; runda D1–D20 po jednej próbie: 50 za poprawne D, BULL D25 = 100, S25 = 0. Maksimum 3380 (1050+1100+1230). Pudła zużywają próbę. Osiem progów koloru wyniku.
- src/jdc-ui.js i wejście w Trening: duży pomarańczowy cel, faktyczne trafienia, cofanie, automatyczne zakończenie, korekta 57. lotki, zapis/wznowienie, osobna historia, poprzedni wynik/rekord/średnia pełnych prób własnego profilu. Liczba zawodników nie dotyczy JDC solo; istniejące mecze 2–6 pozostają osobno.
- Trener domyślnie wyłączony. W trakcie wskazówki zasad; po pełnej próbie opcjonalne wywołanie AI. Kontekst poszerzony o do 30 pełnych prób JDC bez nazw i ID. Brak konfiguracji usługi daje błąd, nie atrapę porady.
- 64/64 testy PASS, build PASS i diff-check PASS. Testy obejmują granice etapów, sześć permutacji Shanghai, zewnętrzny/środkowy BULL, perfekcyjny wynik, undo zakończenia, JSON, izolację profili i ochronę uszkodzonych zapisów.
- QA przeglądarkowe i macierz 1920×1080, 1180×820, 1024×768, 820×1180 nieprzeprowadzone. curl: (7) Failed to connect to 127.0.0.1 port 4173. Lokalnie brak modułu Playwright. Nie potwierdzono wyglądu ani działającego API AI. Nie obchodzono blokady połączenia. Następnie: uruchomić aktualny serwer npm run dev w terminalu użytkownika i przetestować Trening → JDC.
- Bez pusha, deploy, zmian bazy i opłat. Checkpoint lokalny na gałęzi codex/checkout-ui-20261017.
- Źródła zasad: https://www.godartspro.com/app/jdc-practice-routine/ oraz https://dartson.app/nl/rules/jdc-challenge/ (sprawdzone w rozmowie 17.10.2026).

## 2026-10-17 — panel gracza i dane rozwoju
- Poprzedni checkpoint JDC: 4e32fdc, lokalny, bez publikacji.
- Dodano Profile i statystyki na ekranie głównym. Tworzenie lokalnego profilu, historia JDC/treningów/meczów, rekord, średnia i zmiana JDC, trafienia/próby/% dla D1–D20/BULL, ważona celność sektora 20, zakończone mecze i zwycięstwa. Eksport JSON własnych treningów i podsumowań meczów, bez tokenów i surowej historii przeciwników.
- Profile lokalne jawnie opisane jako lokalne, bez logowania. Użytkownik poprosił o prawdziwe konta i zaakceptował rekomendację logowania linkiem na e-mail. Konta i synchronizacja nie są jeszcze wdrożone.
- Supabase get_cost dla obecnej organizacji DostawaWarzyw zwrócił 10 USD miesięcznie. Zadano konkretne pytanie o zgodę na osobny DART PARTY w eu-central-1; oczekiwanie na odpowiedź, bez kupna i tworzenia projektu. Szczegóły: docs/KONTA-GRACZY.md.
- 66/66 testów PASS, build PASS, diff-check PASS. Nowe testy: ważona celność, ukończone próby vs aktywne, izolacja profili i eksport bez danych przeciwników. QA przeglądarkowe nadal nieprzeprowadzone z powodu niedostępnego serwera 4173 dla narzędzi. Bez migracji/pusha/deploy/wysyłki wiadomości.

## 2026-10-17 — bez logowania i wybór drogi gracza
- Poprzedni checkpoint panelu gracza: 6ab8475.
- Użytkownik wymaga stałej opcji gry bez logowania oraz wyboru między samymi sparingami a dobrowolnym trenerem. Ekran wejścia ma teraz jawne „Graj bez logowania”, bez konta/e-maila/AI; trening opisuje opcjonalność trenera. Zmieniono teksty, nie logikę gry i zapisów.
- Zapisano pełne wymaganie wielojęzyczności w docs/KIERUNEK-ROZWOJU.md i granicę kont w docs/KONTA-GRACZY.md. Obecnie tylko polski; brak gotowego selektora innych języków. Nie twierdzić, że wszystkie języki działają.
- Pytanie o koszt nowego projektu Supabase 10 USD/mies. nadal bez wyraźnej odpowiedzi. Wypowiedź o gościu i językach nie jest akceptacją zakupu.
- Weryfikacja: składnia app.js, build i diff-check. Zmiana tekstów nie wymaga nowych testów logiki. QA wizualne nieprzeprowadzone. Bez publikacji i zmian chmury.

## 2026-10-17 — zasady przy wybranej grze
- Dodano rozwijane „Zasady gry” pod ustawieniami wybranego X01/Cricket. Opis uwzględnia bieżący Double Out, punktację Cricket, domową blokadę 20 i liczbę wygranych legów.
- JDC i sektor 20 mają własne zasady przed rozpoczęciem i na dole aktywnego treningu. Panel details/summary obsługuje klawiaturę, nie przerywa sesji i jest niezależny od trenera.
- Źródło opisów: src/game-rules.js. Zasady silnika i zapisane mecze bez zmian. Składnia JS, sprawdzenie wybranych wariantów opisów, build i diff-check PASS. QA wizualne nadal niewykonane. Bez pusha/deploy.

## 2026-10-17 — spokojny powrót do tarczy
- Profil gracza zawiera „Twój rytm”: ostatnia zapisana lotka treningowa, podsumowanie 30 dni, dobrowolny prosty plan oraz przejścia do JDC, krótkiego treningu i sparingu.
- Prosty plan oparty na jawnych regułach, nie udaje AI. Preferencja osobna dla profilu, domyślnie wyłączona. Brak historii nie oznacza przerwy; pusta sesja nie zmienia ostatniej aktywności. Daty przyszłe wykluczone z 30-dniowej analizy.
- Przejście do treningu/JDC przekazuje imię gracza bez uruchamiania sesji automatycznie. JDC można wznowić; plan nie wymusza nowej próby. Brak kar, zaległości i serii do odrabiania.
- 70/70 testów PASS, build, składnia JS i diff-check PASS. QA przeglądarkowe nadal oczekuje; poprzednio serwer 4173 niedostępny dla narzędzi. Nie potwierdzono wyglądu ani rzeczywistego wywołania AI.
- Zrzuty GoDartsPro zapisano jako kierunek katalogu w KIERUNEK-ROZWOJU.md; nie importowano wyników użytkownika ze zdjęć.
- Bez publikacji, zakupu bazy i zmian chmury. Akceptacja konkretnego kosztu Supabase pozostaje nierozstrzygnięta.

## 2026-10-17 — analiza JDC z okresem i liczebnością prób
- Dodano w profilu okres analizy: 30/90/180/365 dni lub cała historia. Zakres jest jawnie opisany w dniach i datach; uwzględnia ukończenie pełnej próby, wyklucza przyszłe daty i niepełne sesje.
- Średnia i liczba prób wybranego okresu, poprzedni równy okres i różnica średnich; rekord całej historii wyraźnie oddzielony. Brak wyników = brak danych, a rzeczywisty brak trafień przy oddanych lotkach = 0%.
- D1–D20/BULL: trafienia, próby i procent. Shanghai: średnia kolejki z bonusem, liczba kolejek, trafienia i bonusy. Numer 15 liczony w obu etapach z właściwym mianownikiem.
- Wskazówki tylko przy włączonym prostym planie. Nie wyróżniamy pól przed 20 próbami na pole; to jawna ostrożna reguła produktu, nie próg pewności statystycznej. Przy remisach pokazujemy wszystkie najniższe pola; przy równych wszystkich brak arbitralnego wyboru. Brak diagnoz trwałych słabości.
- Kontekst AI rozszerzono o obliczoną analizę ostatnich 30 dni z tej samej ograniczonej historii (do 30 pełnych prób); instrukcja wymaga odróżnienia historycznych wyników od obecnej formy i małej próby od diagnozy. Usługa AI nadal nieprzetestowana na żywo.
- 75/75 testów PASS, build i diff-check PASS. Nowe testy: 13 prób bez wskazywania słabości, granice dat i poprzedni okres, rekord historyczny, dwie kolejki 15, remisy i odrzucenie mieszanych profili. QA przeglądarkowe pozostaje otwarte — nie deklarować sprawdzonego wyglądu.
- Bez migracji, pusha, deploy i zakupów. Następny krok: test profilu i przełączania okresów w działającej przeglądarce.

## 2026-10-17 — projekt platformy i lokalna droga gracza
- PLATFORMA-PLAN.md: pięć obszarów produktu, katalog istniejących i proponowanych gier, warunki odblokowania, plan 4 krótkich sesji, nagrody, model danych i kolejność budowy kont/AI/kamer/aplikacji mobilnych. Progi jawnie eksperymentalne, nie oficjalne normy sportowe.
- Profil: panel „Twoja droga”, cztery kamienie milowe i odznaki z rzeczywistej historii. Opcjonalny tygodniowy plan pod istniejącym przełącznikiem planu. Przyciski kierują tylko do działających JDC/sektora20/sparingów. Nie ma jeszcze silnika nowych gier ani ich blokad/odblokowań.
- Odznaki wyliczane z pełnej zachowanej historii; sama nieaktywność ich nie odbiera. Nie ma osobnej trwałej księgi nagród. Plan tygodnia jest propozycją, nie harmonogramem z odhaczaniem i kalendarzem. Aktualny plan ograniczony do istniejących ćwiczeń; analiza double służy obserwacji.
- 79/79 testów PASS, build PASS, składnia players-ui.js i git diff --check PASS. Testy granic celności, minimalnej liczby lotek, braku historii, przyszłych i pustych sesji, duplikatów i izolacji profili.
- QA przeglądarkowe NIE wykonane: curl: (7) Failed to connect to 127.0.0.1 port 4173. Nie potwierdzono wyglądu w wymaganych rozmiarach. Następny krok: uruchomić lokalny serwer i przetestować profil na tablecie, potem pełny backup/restore (nadal niewdrożony).
- Bez pusha, publikacji, migracji, zakupu osobnej bazy i zmian firmowych usług. Stan kont i kamer nadal projektowy. Kod kontynuowany na istniejącej gałęzi.

## 2026-10-17 — dźwięk treningu i JDC
- Przyczyna ciszy: oba moduły treningowe nie wywoływały istniejącej obsługi dźwięku. Podłączono lektora PL i sygnały, z zachowaniem globalnego wyciszenia i niezależnie od opt-in AI.
- Sektor20: cel na start/wznowienie, wynik każdej trójki, pauza/cofnięcie i końcowy wynik (także po timerze). JDC: aktualny cel na start/wznowienie, przyrost punktów z silnika wraz z bonusem, następny cel po rzucie, koniec próby i korekta lotki. Jeden komunikat łączy wynik z celem; render i wybór mnożnika nie odpalają mowy.
- Przycisk powtórzenia celu/sprawdzenia dźwięku w obu aktywnych treningach. Przy wyciszeniu wskazuje globalny przełącznik. Wyjście z treningu przerywa mowę. Oglądanie archiwalnego wyniku nie odtwarza celebracji.
- 83/83 testów PASS, build PASS, składnia modułów i diff-check PASS. Testy obejmują granice etapów, BULL 25/50, Shanghai, koniec bez nieistniejącego następnego celu i respektowanie wyciszenia.
- Użytkownik przesłał screen działającego JDC na 127.0.0.1:4174. Odsłuch rzeczywistego głosu na jego komputerze pozostaje do wspólnego testu; test mock speech nie dowodzi słyszalności. Bez pusha/publikacji i zmian zapisów.

## 2026-10-17 — prosty wpis Shanghai
- Zgodnie z porównaniem użytkownika do GoDartsPro: JDC ma bezpośrednie przyciski POJEDYNCZA/PODWÓJNA/POTRÓJNA aktualnego numeru. Każdy zapisuje jedną lotkę; nadal automatyczne przejście po trzech, bez zbiorczego zatwierdzania kolejki.
- W etapie double jeden przycisk właściwego celu, BULL 50 zapisuje D25. Pozostałe trafienia pod „Trafiłem inne pole”, poza tarczą osobno. Wybranie mnożnika zachowuje otwarty panel. Silnik punktacji i stare zapisy bez zmian.
- Opis Shanghai: S+D+T jednego numeru w trzech lotkach = +100; nie trzy potrójne. 83/83 testy i build PASS, składnia i diff-check PASS. Wygląd/słyszalność oczekują testu użytkownika w przeglądarce; bez publikacji.

## 2026-10-17 — kolejki JDC, historia trafień i czytelne wyniki
- Zatwierdzanie całych kolejek: Shanghai S/D/T z licznikami i trzema widocznymi lotkami; double w grupach D1/D2/D3 aż do D19/D20/BULL. Zaznaczenia zapisują się jako opcjonalny draft. Obsługa wznowienia starych prób w środku kolejki.
- Historia podczas gry i po zakończeniu: cel, rzeczywiste zapisane trafienia, punkty oraz bonus. Działa również dla dotychczasowych zapisów. Niezaznaczone nowe lotki mają unknownMiss=true: pole nieznane, a nie fikcyjne pudło poza tarczę. Opcjonalnie można wpisać dokładne pole. Statystyki lokalizacji pomijają nieznane pole, zachowując liczbę prób.
- Maksymalny możliwy wynik końcowy liczony od 3380 z uwzględnieniem utraconych szans i Shanghai. Kolorowe progi wyniku aktualizowane podczas gry. Tabela porównania sektorów z poprzednimi pełnymi próbami tego samego profilu; osobne oba sektory 15, brak dzielenia przez zero.
- Lektor uruchamiany po zatwierdzeniu, nie przy każdym zaznaczeniu. Shanghai dostaje wyróżnienie wizualne, fanfarę i bardziej energiczne ustawienia mowy systemowej. Brak nagrań profesjonalnego lektora; rzeczywista jakość odsłuchu do oceny użytkownika.
- Weryfikacja: 89/89 testów PASS, npm run build PASS, node --check modułów UI/rund PASS, git diff --check PASS. Nie wykonano wizualnego QA ani odsłuchu na urządzeniu użytkownika. Testy logiki nie potwierdzają tych dwóch obszarów.
- Następny krok: odświeżyć 127.0.0.1:4174, otworzyć zapisany wynik (np. 1906), sprawdzić historię; nowa próba do oceny wpisywania kolejki i celebracji. Konta/chmura/kamery nadal niewdrożone. Bez pusha/publikacji.

## 2026-10-17 — jawny zapis zerowej kolejki
- Dodano przycisk „Żadna nie trafiła celu — zapisz 0 pkt”. Zapisuje wszystkie pozostałe lotki kolejki jako nietrafione cele o nieznanym polu i przechodzi dalej. Działa także przy wznowieniu częściowej kolejki; nie usuwa wcześniejszych zapisanych lotek.
- Wspólna obsługa zatwierdzania zachowuje historię, cofnięcie, zapis i lektora. 89/89 testów PASS, build/składnia/diff-check PASS. Wizualny test urządzenia pozostaje do wykonania. Bez publikacji.

## 2026-10-17 — pojedyncze pudło Shanghai
- Przycisk „Pudło — jedna lotka” dodaje null do draftu, bez przechodzenia do kolejnego celu. Następne trafienie zapisuje się w kolejnym miejscu. Puste miejsca pokazują „Czeka na wpis”, wpisane pudło „Pudło — cel nietrafiony”. Zatwierdzanie i punktacja pozostają bez zmian.
- Składnia, build i diff-check PASS. Do sprawdzenia na urządzeniu: pudło/S10/D10 i zatwierdzenie 30 pkt.

## 2026-10-17 — pudło zaznaczane w miejscu lotki
- Zamiast trzech statycznych opisów są trzy przyciski Pudło z aria-pressed. Klik zaznacza, ponowny odznacza; zaznaczone pudło ma kontrastowe tło. Trafienie S/D/T uzupełnia pierwsze wolne miejsce, więc wybór pudła na trzeciej lotce nie blokuje pierwszych dwóch.
- Draft odróżnia jawne pudło (0/1 + unknownMiss) od wolnego null. Zatwierdzenie zachowuje semantykę nieznanego pola. Usunięto osobny przycisk pojedynczego pudła. 89 testów, build, składnia i diff-check PASS; wizualnie do testu użytkownika.

## 2026-10-17 — trzy graficzne lotki przy ostatniej kolejce
- Po prawej stronie rozwijanej historii dodano własne ikony SVG lotek z podpisami zapisanych trafień. Liczba ikon odpowiada zapisanym lotkom (3 dla pełnej kolejki). Responsywne zawijanie na wąskim ekranie.
- Składnia, build i diff-check PASS. Wygląd do potwierdzenia po odświeżeniu u użytkownika.

## 2026-10-17 — JDC dla dwóch graczy przy jednej tarczy
- W formularzu JDC wybór solo / we dwoje i drugie imię. Pojedynek tworzy dwie osobne próby profili powiązane matchId/seat, zapisywane początkowo jednym zapisem localStorage. Dotychczasowe próby solo zostają zachowane.
- Zmiana gracza po zatwierdzonej trójce; obaj rozgrywają 57 lotek (19 kolejek). Widoczne imię aktywnego gracza i dwa wyniki, lektor ogłasza zmianę. Wznowienie wybiera właściwego gracza na podstawie zapisanych lotek. Cofnięcie usuwa ostatnią zatwierdzoną kolejkę właściwego gracza.
- Wynik końcowy: zwycięzca lub remis oraz osobne szczegóły obu prób. Tryb wspólny nie jest oficjalnym regulaminem turniejowym JDC. Trwały ranking meczu nie został dodany.
- 91/91 testów PASS: pełne 38 kolejek, kolejność, JSON/wznowienie, remis/zwycięzca, wybór ostatniego gracza, izolacja solo i zapisów, odrzucenie niepełnej pary. Build, składnia i diff-check PASS.
- Próba QA Chrome przerwana przez zmianę okna użytkownika: narzędzie zwróciło „The user changed '/Applications/Google Chrome.app'”. Nie potwierdzono nowego formularza ani widoku pojedynku na urządzeniu. Nie wpisano testowych wyników do profili użytkownika. Następny krok: odświeżenie i uruchomienie Przemek kontra Mikołaj przez użytkownika. Bez pusha i publikacji.

## 2026-10-17 — zwarty ekran wpisywania JDC
- Po uwadze o przewijaniu: poziomy i historia pod Szczegóły na dole. Mniejszy nagłówek/komunikat oraz zwarta tablica dwóch graczy. Duże pola trafień i pudeł pozostają trzykolumnowe. Zatwierdzenie jako pierwszy duży przycisk pod lotkami, panel dokładnego pola poniżej działań.
- Wybrane trafienia nie przygasają po trzecim wpisie. Stałe miejsce na komunikat kolejki ogranicza przeskok przycisków po kliknięciu. Zmiany ograniczone klasą jdc-playing, usuwaną po wyjściu/wyniku.
- 91/91 testów PASS, build i składnia PASS. Nie potwierdzono jeszcze układu na wszystkich rozmiarach z wymaganej macierzy QA; użytkownik aktywnie testuje swoją grę, nie wpisywano mu wyników. Następny krok: odświeżenie i sprawdzenie widoczności zatwierdzenia bez przewijania.

## 2026-10-17 — pauza do wieczora
- Użytkownik potwierdził „jest ok” i poprosił o zapis. Checkpoint: docs/CHECKPOINT-JDC-2026-10-17.md. Kopia kodu i manifest SHA-256 w checkpoints/2026-10-17-jdc, odczyt archiwum zweryfikowany. Wyniki localStorage nie są częścią kopii kodu.
- Kolejny krok: rzeczywisty pojedynek Przemek/Mikołaj, przejście na podwójne i wynik końcowy. Bez pracy w tle i bez publikacji.

## 2026-10-17 — nowa gra Cyferki
- Polecenie użytkownika „buduj”. Gra 2–6 osób przy jednej tarczy, pola 20–1 i 25 w dowolnej deklarowanej kolejności. Zamknięcie przy 3 trafieniach (S1/D2/T3) usuwa pole dla wszystkich. Zamknięcie przed trzecią lotką pozostawia lotki i pozwala wybrać nowy cel dla siebie; po ostatniej lotce zamykający wybiera cel następnej osobie. Bez zamknięcia następny gracz rzuca w ten sam cel z własnym postępem. Koniec dopiero po wszystkich 21 polach, zwycięzca najwyższego wyniku lub remis.
- Dwie kwestie niepotwierdzone przez użytkownika: naliczanie wyniku oraz pamiętanie trafień po powrocie tego samego gracza. W formularzu wymagany jawny wybór (bez domyślnego): S1/D2/T3 za każde trafienie albo 1 za zamknięcie; pamiętanie własnego postępu albo reset co turę. Zadano pytania asynchroniczne, odpowiedzi jeszcze brak. BULL25/50=1/2, brak potrójnego BULL; pełna nadwyżka trafień przy zamknięciu punktuje w wariancie za trafienia, jawnie opisane w zasadach.
- Nowe src/cyferki.js: replay zdarzeń choose/throw, walidacja, undo, lokalna historia pod osobnym kluczem dart-party-cyferki-v1. src/cyferki-ui.js: formularz, wybór celu, duże przyciski, znikające grafiki pozostałych lotek, wyniki wszystkich graczy, lektor zmiany/zamknięcia, historia i wznowienie. Wejście „Graj w Cyferki” na ekranie głównym; górne Zapisane mecze w tym module wraca do jego zapisów.
- 99/99 testów PASS, build, składnia i diff-check PASS. Testy: przykład S7+D7/T9, trzy potrójne, osobny postęp, reset tury, BULL, pełny koniec/undo, remis trzech osób, sześciu graczy, JSON i ochrona uszkodzonego zapisu. Brak sztucznych wyników w przeglądarce użytkownika.
- QA urządzenia nie zakończone: Chrome pokazał trwający mecz 301 BEKO/MACIEK; próba osobnej karty zatrzymana komunikatem „The user changed '/Applications/Google Chrome.app'”. Nie ingerowano w rozgrywany mecz. Nie potwierdzono wymaganej macierzy viewportów. Brak Playwright w lokalnym środowisku.
- Następny krok: użytkownik uruchamia Cyferki po swojej bieżącej grze, wybiera zasady i testuje deklarowanie/zamykanie. Nowa gra nie podłączona do chmurowej synchronizacji ani profilu rozwoju. Bez pusha i publikacji. Checkpoints/ pozostaje lokalną kopią wcześniejszego JDC.

## 2026-10-17 — dźwięk w zawodach i statystyki Cyferek
- Na polecenie użytkownika odblokowano dźwięk w 501/301/201/Cricket także w zawodach. Przełącznik działa, zachowuje wybór wyciszenia; zawody nadal bez podpowiedzi checkoutu i bez nakładki zmiany gracza. Cyferki korzystają ze wspólnego dźwięku.
- Profil gracza zawiera Cyferki: własne lotki, trafienia zadeklarowanego celu, celność, punkty, zamknięcia, zwycięstwa/remisy i gry w toku. Agregaty tylko z zakończonych gier; zasady wyniku widoczne przy każdej grze. Eksport zawiera własne podsumowania, bez danych przeciwników. X01/Cricket już zapisują mecze i przypisanie do profilu.
- 100/100 testów PASS, build PASS, składnia i git diff --check PASS. Test Cyferek sprawdza izolację profilu, niepełne gry, pełne zakończenie i eksport bez danych przeciwnika. Odsłuch i pełna macierz urządzeń pozostają do sprawdzenia przez użytkownika; nie ingerowano w trwający mecz.
- Użytkownik upoważnił push i main. Fetch zablokowany: fatal: unable to access 'https://github.com/przemyslawkulik10-eng/dart-party.git/': Could not resolve host: github.com. Brak publikacji; nie obchodzono blokady. Przygotowana lokalna wersja do main, stan zdalny niepotwierdzony.
- Automatyczny zapis działa lokalnie w aplikacji podczas gry. Agent nie prowadzi stałego monitoringu w tle. Zalecenie zwykłego okna Chrome; incognito może utracić wyniki po zamknięciu prywatnych okien. Wieczorem: Gracze → Historia i statystyki, eksport JSON. Nie usuwać checkpoints/ ani danych przeglądarki.

## 2026-10-17 — komunikat FURA
- Na prośbę użytkownika „Przekroczony wynik” zastąpiono „FURA” na ekranie i w lektorze, także przy Shanghai z przekroczeniem. Zasady punktacji bez zmian. Zaktualizowano oczekiwanie istniejącego testu przeglądarkowego; build i diff-check PASS. Test przeglądarkowy nieuruchomiony. Publikacja nadal zablokowana wcześniejszym błędem DNS GitHub.

## 2026-10-17 — powrót z potrójnej na pojedynczą
- Po prawidłowym wpisaniu lotki ×3 klawiatura X01/Cricket automatycznie wybiera ×1 przed ponownym renderem. Zapisana lotka nadal ma mnożnik ×3. Nie zmieniono zachowania ×2. Build i diff-check PASS; kliknięcie na urządzeniu do sprawdzenia podczas gry.

## 2026-10-17 — 301: podpowiedzi od 170 także w zawodach
- Użytkownik zgłosił utrzymujące się ×3 i zażądał podpowiedzi. Test rzeczywistego handlera hit z silnikiem potwierdza reset przed renderem: T20/S3/S17 = 221 pozostałych w 301. Serwer 4174 działa z właściwego katalogu. Nie potwierdzono wersji kodu w otwartej karcie; zalecono pełne odświeżenie bez czyszczenia danych.
- Usunięto blokadę podpowiedzi checkoutu w zawodach, wizualną i głosową; próg 170 zachowany. Zmieniono nieaktualne napisy „bez podpowiedzi”. Zasady double-out i liczba pozostałych lotek nadal sterują trasą.
- 102/102 testów PASS, build i diff-check PASS. Nowe testy wykonują rzeczywiste funkcje aplikacji z izolowanymi zależnościami; nie zastępują kliknięcia i odsłuchu w przeglądarce użytkownika. Lokalny main, publikacja zdalna nadal zablokowana DNS.

## 2026-10-17 — podpowiedzi na kartach graczy
- Użytkownik wskazał kartę wyniku jako miejsce podpowiedzi. Dodano trasę obok wyniku każdego gracza od 170 do 1; oczekujący widzi trasę na 3 lotki, aktywny na faktycznie pozostałe. Po zakończeniu kolejki podgląd oznaczony „Na swoją kolejkę”. Po wygraniu lega i w Cricket ukryte.
- Respektowane zwykłe zakończenie ze zrzutu: 168 = T20 → T20 → T16. W double-out 168 pokazuje brak zejścia. Powyżej 170 brak panelu. Istniejąca większa podpowiedź aktywnego gracza pozostaje.
- 103/103 testów PASS, build i diff-check PASS. Test obejmuje kartę oczekującego, pozostałe lotki aktywnego i double-out. Układ na urządzeniu użytkownika do potwierdzenia po odświeżeniu. Zapis lokalny main, bez zdalnego pusha (wcześniejsza blokada DNS).

## 2026-10-17 — korekta zasad: kończymy podwójną
- Zrzut użytkownika pokazuje zwykłe zakończenie, użytkownik deklaruje Double Out. Nowe formularze domyślnie Double Out. Dla trwającego zwykłego meczu dodano przycisk „Kończymy podwójną — włącz” w nagłówku.
- Przełączenie zapisuje doubleOut i przelicza podpowiedzi, tylko jeżeli replay zachowuje cały dotychczasowy stan. Gdy wcześniejsze rzuty zmieniłyby punktację/wygrane, operacja odmawia bez nadpisania. Nie zmodyfikowano bezpośrednio localStorage użytkownika.
- 104/104 testów PASS, build i diff-check PASS. Test zachowania wyniku oraz odmowy przy pozostałym 1. Użytkownik musi odświeżyć i kliknąć przycisk w bieżącym meczu. Publikacja zdalna nadal zablokowana DNS.

## 2026-10-17 — automatyczna zmiana gracza
- X01/Cricket automatycznie przechodzą do następnego gracza po zakończonej kolejce/FURZE, po 3,5 s na odczyt wyniku. Lektor ogłasza kolejną osobę. Przycisk ręczny nadal pozwala przyspieszyć.
- Timer anulowany przy renderze/wyjściu/cofnięciu; sprawdzana tożsamość meczu i widok. Brak przejścia po zwycięstwie/wygraniu lega. Gotowa kolejka wznowiona z zapisu także przejdzie automatycznie.
- 105/105 testów PASS, build i diff-check PASS. Test rzeczywistego planowania: niepełna kolejka, pełna kolejka, powtórny stary callback, wygrany leg. Odsłuch podczas rzeczywistej gry do sprawdzenia. Lokalny main; push nadal zablokowany DNS.

## 2026-10-17 — nazwa podpowiedzi „Do końca”
- Zgodnie z poleceniem „Zejście” zmieniono na „Do końca” na kartach i w lektorze. Brak możliwej trasy: „Nie skończysz w …”. Bez zmiany liczenia tras. 105/105 testów PASS, build i diff-check PASS. Lokalny main; wcześniejsza blokada DNS publikacji pozostaje.

## 2026-10-17 — pomarańczowe PUDŁO
- Przycisk PUDŁO / 0 w X01 i Cricket ma pomarańczowe tło i ciemny napis, z jaśniejszym hover. Zachowano blokadę po skończonej kolejce. Build i diff-check PASS; zmiana wyłącznie CSS, bez zmian wyników. Lokalny main, bez publikacji zdalnej.

## 2026-10-17 — Cricket: 20 po dwóch zamkniętych polach
- Korekta użytkownika na przykładzie Maćka (zamknięte 15 i 17): blokada 20 sprawdza teraz dwa zamknięte pola 15–19, a nie dwie różne potrójne. Zmieniono warunek w silniku i UI oraz opisy zasad. Dotyczy każdego gracza osobno. Undo wylicza blokadę ponownie z marks.
- Zachowano zapisane cricketOpening='two-triples' jako klucz kompatybilności istniejącego meczu; nowe znaczenie zgodne z korektą. Dawne poprawne zdarzenia nadal są poprawne (złagodzenie warunku), zapisów nie kasowano ani nie zmieniano rzutów. openingTriples pozostaje historycznym licznikiem, nie steruje blokadą.
- 105/105 testów PASS, build i diff-check PASS; test zamknięcia pojedynczymi potwierdza odblokowanie 20. Po odświeżeniu bieżącego meczu 20 Maćka będzie dostępna przy dwóch zamkniętych polach i pozostałej lotce. Lokalny main; publikacja zdalna nadal zablokowana wcześniejszym DNS.

## 2026-10-17 — duży przycisk PUDŁO
- Po zrzucie użytkownika PUDŁO / 0 zajmuje osobny rząd na pełną szerokość klawiatury, minimum 76 px wysokości, napis 22–30 px. BULL 25 i 50 pozostają obok siebie w poprzednim rzędzie. Dotyczy Cricket i X01, pomarańczowy kolor zachowany.
- Build i diff-check PASS. Zmiana CSS, bez ingerencji w bieżące wyniki. Układ na urządzeniu do potwierdzenia po odświeżeniu. Lokalny main.

## 2026-10-17 — wyraźna kolumna aktywnego gracza
- Cała aktywna kolumna Cricket (nagłówek i wszystkie pola do BULL) otrzymała stonowane zielone tło, jasne napisy i pionowe krawędzie. Nagłówek nieco jaśniejszy; zamknięcia jasną zielenią. Bez migania i jaskrawego wypełnienia.
- Zmiana CSS; build i diff-check PASS. Czytelność z dystansu do oceny przez użytkownika na jego ekranie. Bieżący mecz bez zmian, lokalny main.

## 2026-10-17 — duży kursor i doping dla Maćka
- Kursor na urządzeniach z myszą: pomarańczowa strzałka SVG 48×60 z ciemnym obrysem i jasnym akcentem, hotspot na grocie. Pola tekstowe zachowują kursor tekstowy.
- Jednorazowy doping dla aktywnego Maćka po wczytaniu aktualizacji: „Maciek, daj czadu!” i 2,8 s kolorowych rozbłysków. Bez zmiany wyniku, pointer-events:none, bez migania; reduced-motion usuwa ruch. Znacznik sessionStorage ogranicza efekt do jednego razu w karcie.
- Składnia, build i diff-check PASS. Wizualna ocena na urządzeniu użytkownika pozostaje po odświeżeniu. Lokalny main; bez zdalnej publikacji.

## 2026-10-17 — V 01.01 i najczęściej wybierane pole
- Numer wersji wskazany przez użytkownika: V 01.01. W nagłówku przy logo widoczna data 17.10.2026 i godzina aktualizacji 20:47, pochodzące z modułu załadowanego kodu.
- Najczęściej zapisane pole meczu X01/Cricket wyróżnione pomarańczowo. Każda lotka to jeden wybór, niezależnie od mnożnika; przy remisie wygrywa ostatnio wybrane pole. BULL 25/50 osobno, pudło jako 0. Przeliczenie z historii uwzględnia cofanie. Pomarańczowe PUDŁO pozostaje stałe zgodnie z wcześniejszą prośbą.
- 106/106 testów PASS, build i diff-check PASS. Test liczenia, remisów, undo, pustego meczu, BULL i pudła. Wizualny układ wersji do potwierdzenia na urządzeniu. Lokalny main, bez pusha z powodu wcześniejszego błędu DNS.

## 2026-10-17 — V 01.02: imię do dotknięcia
- Po zgłoszeniu wchodzenia sobie w kolejkę ekran przekazania kolejki jest modalny i pozostaje aż do dotknięcia przycisku zajmującego cały ekran („Dotknij ekranu — zaczynam rzucać”). Usunięto jego automatyczne znikanie; działa także w zawodach. Escape nie pomija potwierdzenia.
- Automatyczna zmiana gracza po 3,5 s nadal działa, ale przed wpisywaniem następnych rzutów pokazuje duże imię nowego gracza. Same celebracje zachowują wcześniejsze czasowe zamknięcie. Wersja V 01.02, data/godzina w nagłówku.
- 106/106 testów PASS, build i diff-check PASS. Potwierdzenie dotykiem w przeglądarce do sprawdzenia przez użytkownika. Lokalny main, bez pusha (wcześniejszy błąd DNS).

## 2026-10-17 — V 01.03: bez ekranu przekazania kolejki
- Na wyraźne polecenie usunięto pełnoekranowe imię przy zwykłej zmianie gracza. Lektor i dźwięk wykonują się, funkcja wraca przed stworzeniem dialogu. Automatyczna zmiana po kolejce oraz podświetlenie gracza/kolumny pozostają. Celebracje zwycięstwa i specjalnych trafień bez zmian.
- 106/106 testów PASS, build i diff-check PASS. Otwarty stary dialog znika po odświeżeniu; kod nie zmienia punktów. Wersja V 01.03, aktualna godzina w nagłówku. Lokalny main, bez zdalnej publikacji.

## 2026-10-17 — V 01.04: zielone mnożniki
- Przyciski ×1/×2/×3 w grze mają zielone tło. Wybrany mnożnik jasnozielony, z ciemnym napisem i wyraźną ramką. Nie zmieniono obsługi kliknięć ani resetowania ×3. Build i diff-check PASS. Lokalny main, ocena wizualna po odświeżeniu.

## 2026-10-17 — V 01.05: jeden set do trzech wygranych legów
- Nowy formularz X01/Cricket domyślnie wybiera 3 wygrane legi, opisane jako jeden set. Nagłówek pokazuje SET 1 i numer lega. Zwycięstwo całego formatu nazwane wygraną seta. Silnik już kończy dopiero przy trzecim wygranym legu; nie dodano wielu setów.
- Dla rozpoczętego, niezakończonego meczu z innym limitem dodano „1 set do 3 legów — włącz”. Zachowuje rzuty i legi. Nie zmienia automatycznie starych ukończonych meczów. Starszy format jednego lega nadal prawidłowo nazwany legiem.
- 106/106 testów PASS (w tym koniec przy trzeciej wygranej, undo i JSON), build i składnia PASS. Lokalny main. Stałe kolory graczy i wybór najsłabszego na rewanż nadal nie wdrożone; nie traktować wcześniejszych ustaleń jako gotowej funkcji.
