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
