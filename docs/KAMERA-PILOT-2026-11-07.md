# DART PARTY — pilot kamery, etap A

## Wydanie 7.11.2026 — stan po poprawkach stabilności

Autoryzacja użytkownika: „BUDUJ APLIKACJE”, „WDRARZAMY”, „RÓB NA GOTOWO”. Poniższe wcześniejsze zapisy są historią prób. Bieżący zakres wydania: osobny ekran `/public/camera.html`, obraz kamery, obrót/powiększenie i ręczna kalibracja. Brak automatycznej punktacji i zapisów do meczu. Opublikowany ekran będzie dostępny wszystkim odwiedzającym domenę; strumień i kalibracja pozostają lokalnie w danej karcie.

Nowy `src/camera-health.js` rozdziela połączenie od świeżości obrazu. Chwilowe mute/unmute i ukrycie strony zachowują kalibrację, lecz blokują kalibrację zatrzymanej klatki i odczyt do czasu nadejścia świeżego obrazu. Rzeczywiste ended, zmiana źródła oraz zmiana rozdzielczości nadal unieważniają kalibrację. Powtórne zdarzenie resize o tej samej rozdzielczości nie kasuje jej. Żądanie obrazu ma limit 30 sekund, a spóźniony strumień jest zamykany. Po poruszeniu telefonu trzeba ponowić kalibrację; ruch nie jest wykrywany automatycznie. Odświeżenie strony nadal wymaga nowej kalibracji.

Aktualne sprawdzenie: `npm test` 213/213; `npm run build` i `node --check src/camera.js` poprawne. Brak konfiguracji typecheck. Przeglądarka po wczytaniu nowego buildu: cztery punkty na ilustracji, BULL50 i T20=60. Testy symulują mute/unmute/ended, nie zastępują testu fizycznego iPhone’a po tej konkretnej poprawce. Bieżąca dokładność automatycznego rozpoznawania nie została potwierdzona.

Osobny katalog `2026-11-07_DETEKTOR_LAB` nie jest częścią wydania: model InstaDarts oznaczony AGPL, wyniki z fizycznych rzutów niepewne. Tam poprawiono automatyczne wznowienie po powrocie, odrzucanie nieaktualnych klatek i lokalną historię diagnostyczną. Nie należy kopiować modelu, WASM ani bundla laboratorium do tego wydania podglądu.

7.11.2026, lokalnie, branch `codex/camera-pilot-20261107`, baza `93dfb44775e02fcda133bd8a55928a22d8522d1c`. Bez commitu, pushu i publikacji. Akceptacja użytkownika: „tak, buduj i testujemy”, po przedstawieniu makiet i propozycji etapu A.

## Co zbudowano

Osobny ekran `/public/camera.html` zgodny z kierunkiem zaakceptowanej makiety (granat/cyjan, duże przyciski, pełny ekran, źródło po lewej i obraz po prawej). Na telefonie podgląd jest nad ustawieniami. Dotychczasowy ekran gry, silnik i konta nie są modyfikowane.

- Wybór źródła, odświeżanie listy, uruchomienie i zatrzymanie strumienia bez mikrofonu.
- Ręczna kalibracja czterech punktów zewnętrznego obrysu podwójnego pierścienia: środek pola 20, 6, 3, 11. Transformacja perspektywy na płaszczyznę tarczy.
- Kliknięcie/dotknięcie wskazanego punktu daje sektor, mnożnik i liczbę punktów. Ostrzeżenie blisko drutu jest geometrycznym marginesem 1,5 mm, a nie pewnością modelu.
- Cofanie punktu, ponowna kalibracja oraz jawnie oznaczona ilustracja do testowania interfejsu bez kamery.
- Utrata/wyciszenie źródła, zmiana kamery, rozmiaru obrazu lub ukrycie strony unieważniają kalibrację. Brak postępu czasu wideo przez 4 s zatrzymuje strumień. Spóźniona odpowiedź na zgodę po anulowaniu nie pozostawia kamery włączonej.
- Obraz jest tylko lokalnie wyświetlany. Kod pilota nie wysyła go, nie zapisuje zdjęć, localStorage, profili ani meczów.

To nie jest jeszcze automatyczny detektor lotek. Ruch telefonu względem tarczy nie jest automatycznie rozpoznawany: po poruszeniu trzeba nacisnąć „Kalibruj ponownie”. Cztery błędnie wybrane, lecz poprawnie uporządkowane punkty mogą dać błędną punktację, dlatego po kalibracji sprawdza się BULL i znane pola. Bez fizycznego testu brak dowodu dokładności stanowiska.

## Uruchomienie i próba

W katalogu projektu: `npm run build`, następnie `SERVE_DIR=dist PORT=4197 npm run dev`. Otwórz na Macu `http://127.0.0.1:4197/public/camera.html` w Safari/Chrome. Serwer nasłuchuje tylko na 127.0.0.1; ten adres nie otworzy aplikacji na innym urządzeniu. Na czas przekazania próby uruchomiony jest jeden serwer na porcie 4197; kamera jest zatrzymana.

1. Podłącz iPhone’a 17 przez USB do Maca i ustaw na stabilnym uchwycie tak, by widzieć całą tarczę. Kamera Continuity wymaga zgodnej konfiguracji Apple; instrukcja: https://support.apple.com/en-us/102546 .
2. Naciśnij „Sprawdź kamerę”, udziel zgody, odśwież listę. Wybierz iPhone’a, ponownie naciśnij „Sprawdź kamerę”. Potwierdź etykietę urządzenia i rzeczywisty obraz tarczy.
3. Wskaż cztery punkty wg instrukcji. Sprawdź środek BULL, T20, D20, sektor 6 i 11. Nie wybieraj cyfr jako punktów kalibracji.
4. Sprawdź odłączenie przewodu, zatrzymanie oraz ponowne uruchomienie. Po każdej zmianie pozycji ponów kalibrację.

iPad użytkownika: A16, iPadOS 27.0.1, 128 GB. Uwzględniono rozmiary ekranów, ale telefon → iPad nie jest zaimplementowany. Numerów seryjnych i adresów urządzeń nie zapisano.

## Aktualne dowody

- `npm test`: 209/209, 0 błędów (201 dotychczasowych i 8 nowych).
- Nowe testy: wszystkie 20 sektorów/S/D/T/BULL, znana perspektywa z niezależnymi punktami, błędne kalibracje, okolice drutów, anulowanie/wyścigi żądań, wyłączenie starego źródła, utrata źródła, odmowa zgody. Źródła w tych testach są symulowane, nie sprzętowe.
- `npm run build`: sukces; powtórzony po zmianie CSS.
- `node --check src/camera.js`, `git diff --check`: sukces. Projekt nie ma skryptu typecheck; nie przedstawiamy kontroli składni jako kontroli typów.
- Przeglądarka: cztery kliknięcia kalibracji na ilustracji; BULL 50, T20 = 60; cofnięcie pierwszego punktu do stanu 1/4; zatrzymanie usuwa kalibrację; wejście i wyjście z pełnego ekranu.
- Obejrzane rozmiary: 390×844, 820×1180, 1024×768, 1180×820, 1920×1080. W pomierzonych rozmiarach 390/820/1024/1920 brak poziomego przepełnienia i przycisków mniejszych niż 44 px. Pionowe przewijanie jest zamierzone; desktopowy podgląd pozostaje przy kalibracji. To emulacja rozmiarów, nie fizyczny test iPada.
- Próba prawdziwego getUserMedia w przeglądarce wewnątrz czatu pozostała na komunikacie „Czekam na zgodę i obraz kamery…”, bez rozstrzygniętego błędu API i bez obrazu. Żądanie anulowano przyciskiem „Zatrzymaj”. Nie potwierdzono kamery iPhone ani transmisji. Otwieranie Safari przez narzędzie UI zakończyło się timeoutem, więc nie potwierdzono testu w Safari.

## Następny etap

### Aktualizacja po próbie użytkownika, 7.11.2026 około 19:05

Zrzut użytkownika z 19:03:33 potwierdza rzeczywisty obraz tarczy w Safari na Macu: etykieta „Kamera (Warzywko)”, 1920×1080. To dowód podglądu z telefonu, nie dokładności kalibracji ani detekcji. Kolejny zrzut pokazuje ponownie „Domyślna kamera” i „Kamera aplikacji Widok blatu”; nie ustalono przyczyny powrotu do domyślnego wyboru.

Poprawiono `src/camera.js`, `src/camera-source.js` oraz `tests/camera.test.mjs`: wybór przechowywany w sessionStorage tej karty (wyłącznie identyfikator i etykieta kamery, bez obrazu), odtworzenie po przeładowaniu, zachowanie wyboru przy chwilowo pustej liście, zablokowanie pozycji Widok blatu/Desk View i zatrzymanie takiego strumienia również wtedy, gdy zwróci go domyślne źródło. Brak zastępowania niedostępnej wybranej kamery domyślną. Po udanym otwarciu lista wskazuje faktycznie używane urządzenie.

Po poprawce: `npm test` 211/211, build i kontrola składni poprawne; HTTP potwierdza podawanie nowych modułów przez lokalny serwer. Zabezpieczenie Desk View i przywracanie wyboru przetestowano automatycznie na symulowanych urządzeniach; fizyczny test poprawki w Safari pozostaje do wykonania. Użytkownik musi jednokrotnie przeładować stronę i wybrać zwykłą kamerę, ponieważ poprzednia wersja nie zapisywała wyboru.

Rzeczywista próba iPhone 17 → Mac przy tarczy. Użytkownik musi fizycznie podłączyć i ustawić telefon. Po weryfikacji obrazu i geometrii: etap B, wybór dostępnego i odpowiednio licencjonowanego detektora oraz pomiary na rzeczywistych rzutach. Dopiero potem integracja propozycji rzutów z istniejącym silnikiem. Żaden bieżący wynik meczu nie pochodzi z kamery.

## Pliki

### Obrót i powiększenie — aktualizacja po próbie około 19:21

Użytkownik potwierdził BULL, T20, D20 i S6, ale zgłosił 0 dla D4/D18. Zrzut 19:20:59 pokazuje punkty 2/3 w obrębie pasa podwójnego zamiast dokładnie na jego zewnętrznej krawędzi. Przybliżone odtworzenie współrzędnych znaczników ze zrzutu daje dla wskazanego D18 promień około 175,6 mm, czyli ponad granicę 170 mm; to rekonstrukcja obrazu, nie surowe dane kliknięcia. Duże znaczniki przesłaniały drut. Nie uznajemy dokładności całej kalibracji za potwierdzoną.

Zastąpiono wypełnione znaczniki małymi, otwartymi celownikami z numerem obok. Na jawne polecenie użytkownika dodano obrót o 90° (ostatnia korekta zastępuje prośbę o 180°), przyciski +/− od 100 do 400%, Dopasuj oraz przeciąganie powiększonego widoku. Obraz i nakładka obracają się razem; kliknięcie jest przeliczane do współrzędnych oryginalnego obrazu. Sam obrót, zoom i przesunięcie widoku zachowują kalibrację. Instrukcja punktów podaje D20/D6/D3/D11 bez zależnych od obrotu kierunków ekranu. Przeładowanie strony nadal wymaga kalibracji od nowa.

Zmiany: `public/camera.html`, `src/camera.css`, `src/camera.js`, nowy `src/camera-view.js`, `tests/camera.test.mjs` i dokument. Świeże `npm test`: 212/212, build poprawny. Nowy test weryfikuje wszystkie cztery obroty i skale 1/1,25/2/4 na obrazie 640×360, z przesunięciem, oraz zachowanie wyników pól. Przeglądarka: + daje125%, − wraca100%, Dopasuj przywraca100%; kalibracja na ilustracji obróconej90°, T20=60; po zoom125% i przeciągnięciu BULL=50 i T20=60. Fizyczna próba nowych kontrolek w Safari oraz ponowne D4/D18 pozostają otwarte. Niczego nie opublikowano.

`public/camera.html`, `src/camera.css`, `src/camera.js`, `src/camera-source.js`, `src/camera-geometry.js`, `tests/camera.test.mjs`, ten dokument. Bez nowych zależności.

### Bezpośrednia próba w Safari po zrzucie 19:33:49

Udało się przejąć istniejące okno Safari przez CUA. Agent kliknął „Kalibruj ponownie” i na rzeczywistym, aktywnym obrazie „Kamera (Warzywko)” przy powiększeniu 125% ustawił zewnętrzne brzegi D20, D6, D3, D11. UI potwierdził „Kalibracja gotowa”. Następnie rzeczywistymi kliknięciami w podglądzie uzyskano: BULL50, zewnętrzny BULL25, D18=36, D4=8, T19=57, D8=16, T20=60, D20=40. Stan końcowy: D18=36, kamera i kalibracja pozostawione do dalszej próby użytkownika.

Granice dowodu: sprawdzono środki wybranych pól, nie wszystkie sektory/druty ani fizyczne rzuty. Pierwsze wskazanie przy wewnętrznym brzegu D8 zwróciło S8; wskazanie środka pasa D8 dało16. Dwa kliknięcia w pobliżu granicy D18/S18 dawały odpowiednio36 oraz18 z ostrzeżeniem blisko drutu; wskazanie środka D18 dało36 bez ostrzeżenia. To nie jest dowód dokładności na drutach. W źródłowym komunikacie statusu pozostał stary błąd kolejności punktów mimo poprawnego nowego stanu kalibracji — do uporządkowania bez przerywania bieżącej próby. Nie zmieniano w tym kroku kodu i nie powtarzano testów jednostkowych/builda; dopisano tylko wynik fizycznego podglądu do tego dokumentu. Automatycznej detekcji lotek nadal nie ma.
