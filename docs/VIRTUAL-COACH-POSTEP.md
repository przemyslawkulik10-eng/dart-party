# Virtual Coach — lokalna wersja 1, 20.10.2026

Wejście: Panel gracza → Virtual Coach. Źródło: release-accounts, gałąź codex/account-ui-release. To rozszerzenie obecnej aplikacji; publikacja, płatności i migracje nie należą do wykonanej pracy.

## Działa lokalnie
- Plan 10/20/30 minut (orientacyjnie 1/2/3 zadania po 10 kolejek/prób), kierunek treningu i deklarowane dni w tygodniu.
- Punktowanie na T20, pojedyncze pola (oba obszary S), podwójne i zejścia 24/32/40/48/60 Double Out. Wpisywanie faktycznych pól, BULL, pudła, bust, pauza, cofnięcie, zapis i wznowienie.
- Brak drugiego planu, dopóki poprzedni nie jest ukończony. Cel zadania zapisany przy jego tworzeniu, niezmienny po odświeżeniu lub zmianie preferencji.
- Dobór najpierw uzupełnia brakujące rodzaje prób, następnie równoważy liczbę sesji i wyniki względem celów. Po minimum 3 pełnych sesjach rodzaju w 30 dni: cel z mediany maks. 5 ostatnich. Podwójne mogą dostać dodatkowe obserwacje słabszego pola po min. 20 próbach. Progi są orientacyjnymi regułami produktu, nie oceną sportową.
- Historia wszystkich planów, wyników i lotek. Aktualne średnie (max. 3 ostatnie sesje) osobno od rekordu; porównanie do 3 wcześniejszych przy wystarczającej liczbie prób. Liczba dni z ukończonym zadaniem z ostatnich 7 dni.
- Własne zadania coacha w statystykach aktywności i historii Panelu gracza; nie liczą się jako wygrane mecze.
- Plan przechowywany w profilu virtualCoach, raporty w coachReports. To część istniejącego zsynchronizowanego dokumentu konta; bez nowej tabeli/klucza ACCOUNT_KEYS. Lokalna ochrona przed nadpisaniem z nieaktualnej karty i zmianą właściciela. Globalne konflikty dwóch urządzeń nadal obsługuje istniejąca synchronizacja konta.
- Starsze lokalne raporty AI odczytywane tylko dla właściwego profilu, niekasowane. Przy kolejnym zapisie raportu łączone z raportami profilu (maks. 100).
- Przywracanie blokady aktualizacji aplikacji dla rozpoczętych niezakończonych zadań, także po przeładowaniu.
- Opcjonalny adapter AI otrzymuje obliczone podsumowania i obsługuje nowe ćwiczenia. Brak konfiguracji/odmowa usługi nie blokuje podstawowego trenera. Poprawiono przypisanie rzutów i zwycięstw Cricket drużynowego w kontekście AI.

## Weryfikacja
- npm test: 155 testów. Nowe przypadki: plan i JSON, pause/resume/undo, kończenie na podwójnym, leave-one/overshoot/straight-zero bust, BULL, maks. 10 prób, brak podwójnego zaliczenia, niepełne sesje, dawne/przyszłe wyniki, adaptacja, izolacja profili i kont, kopia dokumentu konta, nieaktualna karta, uszkodzone dane, brak miejsca, legacy reports, Cricket drużynowy, dozwolone rekomendacje AI.
- npm run build, git diff --check.
- Prawdziwa lokalna przeglądarka: 20-minutowy plan, cel finishing, pełne 10 zejść (14 lotek), cofnięcie zejścia, pauza podwójnych, zachowanie wyniku po przeładowaniu, wejście i wyjście pełnego ekranu.
- Izolowana kopia QA na porcie 4192: 1920×1080, 1180×820, 1024×768, 820×1180 i 390×844, panel i ćwiczenie, 6 syntetycznych profili i długi pseudonim. Ramki 1:1, bez CSS zoom; innerWidth zgodny z rozmiarem, obszar treści węższy o 15px paska przewijania. Brak poziomego przepełnienia. Zrzuty w ../2026-10-20_COACH_LOKALNIE/. Przy szerokości 1920 zrzut pulpitu pokazuje fragment; pomiar obejmuje całą ramkę.
- Brak usługi AI: komunikat „Trener AI nie jest jeszcze skonfigurowany”, plan nadal dostępny. Provider testowany atrapą, nie wykonywano płatnych żądań OpenAI.

## Granice i następny krok
- Nie potwierdzono jeszcze rzeczywistej synchronizacji na dwóch urządzeniach ani fizycznego dotyku/odsłuchu. Test kopii dokumentu konta nie zastępuje testu produkcyjnego.
- Publiczna domena i produkcyjny backend AI nie zostały zmienione. Brak subskrypcji; konfiguracja API, kontrola dostępu i limitów konta potrzebna przed udostępnieniem płatnej usługi.
- Plan opiera się obecnie na nowych ćwiczeniach coacha. JDC i mecze mogą zasilać dodatkową analizę AI, ale nie są automatycznie przeliczane na ukończenie zadania coacha.
- Zachowano limit dokumentu konta (4 MB po stronie aplikacji). Nie obiecywać nieograniczonego archiwum.
- Przed wydaniem: wspólny test na sprzęcie, reset hasła/synchronizacja z wcześniejszego checkpointu i wyraźna zgoda na push/main. Następnie pilotaż planów z realnymi graczami.

Odtworzenie QA: node tests/coach-layout-fixture.mjs, następnie SERVE_DIR=/tmp/dart-coach-layout PORT=4192 npm run dev. Otwórz /public/coach-qa.html?w=1180&h=820&scene=game. Dane generowane są wyłącznie na oddzielnym lokalnym origin. Dostępne sceny: home/game/empty/completed.

## Zmiana kierunku — luźna gra, 20.10.2026
Pierwszy ekran proponuje 201/301/501 jeden na jeden z wirtualnym przeciwnikiem. Jeden leg; zwykłe zakończenie lub Double Out do wyboru. Trzy ręcznie wybierane poziomy bota (prosty model losowy, bez udawania automatycznej diagnozy). Po meczu rewanż, dobrowolne ćwiczenia albo koniec. Ćwiczenia schowane w rozwijanej sekcji; brak deklaracji dni i możliwość odłożenia planu bez utraty lotek.
Mecze zapisywane w profilu jako coachMatches, z kontrolą właściciela i konfliktu innej karty. Nie są meczami z ludźmi ani wynikami bota w statystykach gracza. Wznowienie na stronie coacha. Cofnięcie usuwa odpowiedź bota i ostatnią ludzką lotkę. Średnia wyłącznie z lotek gracza, z ostatnich 30 dni; brak procentu checkoutów bez informacji o zamierzonym celu. Dwie–trzy gry to wstępna próbka, nie pełna diagnoza. coachMatches jest częścią istniejącego dokumentu profilu; rzeczywista synchronizacja dwóch urządzeń pozostaje niezweryfikowana. Bez migracji i publikacji.
Walidacja: 158 testów, build; izolowany test w przeglądarce 201 aż do wygranej, kolejka bota, ekran wyboru po meczu; pięć szerokości bez poziomego przepełnienia. Nie testowano fizycznego dotyku.

## Rozmowa przed grą i po legu — 20.10.2026
Dodano opcjonalne pytania o doświadczenie (od zera / powrót / regularna gra / pominięcie), dzisiejszy czas (15/30 minut lub bez limitu) i początek (swobodne rzuty albo mecz). Trener odpowiada na deklarację; nie ustawia ukrytej oceny gracza. Swobodne rzuty bez zapisywania wyniku i bez zegara wymuszającego koniec. Doświadczenie jest pamiętane w profilu, dzisiejszy czas nie jest narzucany w kolejnym dniu.
Po pierwszym legu pytanie „Jak Ci się rzuca?”: łapię rytm / swobodnie / zmęczenie / bez oceny. Gracz wybiera dalszą rozgrzewkę, grę, ćwiczenia lub zakończenie. Odpowiedź i decyzja są zapisywane przy meczu; następny leg zachowuje identyfikator sesji, jej numer i wybraną fazę. Po kolejnych legach również można zmienić zdanie. Cofnięcie rzutu usuwa nieaktualną ocenę zakończonego lega. Niedokończona rozmowa dostępna po ponownym wejściu. Zapis chroniony przed zmianą konta i konfliktem drugiej karty. To rozmowa z przygotowanymi opcjami, nie otwarty czat AI ani automatyczna diagnoza formy.
Weryfikacja: 162 testy, build, diff check; przeglądarka na izolowanym profilu: odpowiedzi, swobodne rzuty, pełny leg 201, pytanie i reakcja, kontynuacja rozgrzewki; 5 szerokości ekranu, pełny ekran wejście/wyjście. Fizyczny dotyk i synchronizacja dwóch urządzeń nie były testowane. Wszystko lokalnie, bez migracji i publikacji.

## Żywszy partner przy tarczy — 21.10.2026, wyłącznie lokalnie
Zastąpiono ankietę wejściową zaproszeniem i jednym głównym „Gramy!” (301). Rozwijane ustawienia zachowują 201/301/501, poziom przeciwnika i Double Out. Swobodne rzuty, ćwiczenia, wznowienie i zakończenie są dobrowolne. Zachowano wcześniejsze dane doświadczenia; nowa sesja nie wymaga czasu ani ankiety.
Trener podchodzi do tarczy automatycznie po kolejce człowieka, rzuca co około sekundę, pokazuje każdą lotkę i krótko komentuje aktualną kolejkę. Każdy krok zapisuje się dotychczasowym mechanizmem, z ochroną konta i nieaktualnej karty. Wyjście usuwa timer; wznowienie kontynuuje częściową kolejkę. Cofnięcie usuwa odpowiedź bota i ostatnią lotkę człowieka. Można przyspieszać prezentację. Po legu pytanie o samopoczucie ma przyciski; odpowiedź nie jest warunkiem dalszej gry ani zakończenia.
To nadal lokalne reguły i ręcznie wybierany poziom przeciwnika, bez automatycznej diagnozy czy rozmowy głosowej. Statystyki gracza są obserwacją punktowania, nie oceną skuteczności podwójnych.

Sprawdzone: 162/162 testów jednostkowych; build i git diff --check. Chrome headless: pięć viewportów (1920×1080, 1180×820, 1024×768, 820×1180, 390×844), długie imię i sześć syntetycznych profili, powitanie i mecz bez poziomego przepełnienia; pełny leg 301, tempo bota, pauza bez dalszych zapisów timera, wznowienie, cofnięcie, samopoczucie, kolejny leg rozgrzewki, wejście/wyjście fullscreen. Brak błędów strony. Zrzuty: evidence/coach-alive/. Obejrzano powitanie na 1180 i planszę na telefonie. Nie testowano fizycznego dotyku ani odsłuchu.

Odtworzenie: node tests/coach-layout-fixture.mjs /tmp/dart-coach-alive; SERVE_DIR=/tmp/dart-coach-alive PORT=4193 npm run dev. W innym terminalu: PLAYWRIGHT_MODULE=<ścieżka do modułu playwright> node tests/coach-alive-browser.cjs (zainstalowany Chrome). Port 4193 służy tylko danym syntetycznym; aplikacja źródłowa działa lokalnie na 4191. Nie uruchamiać fixture na origin z danymi użytkownika.
Bez push, publikacji, migracji i płatnych wywołań. Zmiany pozostają niezacommitowane na codex/account-ui-release. Następna ocena: czy tempo i zaproszenie są przyjemne w rzeczywistej grze przy tarczy.

## Czytelny trening celności — 21.10.2026, lokalnie
Po uwagach z rzeczywistej sesji: wybór celu 20, 19, 18, 17, 16, 15 lub BULL 25/50; tylko przyciski 1×/2×/3× wybranego sektora albo 25/50 oraz „Poza celem”. Ten ostatni zapis nie udaje znajomości trafionego pola. Trzy widoczne lotki i miejsca wyników, cofanie oraz wspólny wskaźnik pozostałych lotek w pozostałych grach. Mnożnik wraca do ×1 po każdym wpisie. Usunięto automatyczne powtarzanie komentarza o ostatnich trzech lotkach w treningu celności.
Podsumowanie: celność każdej pozycji 1–3 z własnym mianownikiem, seria trafień, porównanie równych części sesji, rozkład zapisanych pól i ostrożna obserwacja słabszej pozycji przy odpowiedniej próbce. Podział wynika z kolejności wpisów; pominięte rzuty mogą go zniekształcić. Ostatni trening dostępny u góry profilu. Stare zapisy zachowano; cele inne niż 20 nie trafiają do historycznej statystyki sektora 20.
Weryfikacja: 168/168 testów, build i diff check. Izolowany origin 4194, wyłącznie dane syntetyczne: trening 19, BULL, cofanie, zakończenie, podsumowanie 31 lotek, widoczność w profilu, reset ×2/×3 w 501 i wejście/wyjście fullscreen. Wspólny wskaźnik sprawdzony także w coach, JDC, Cyferkach i obu Mnożnikach. Pięć viewportów bez poziomego przepełnienia. Zrzuty evidence/training-clarity/. Fixture: node tests/training-clarity-fixture.mjs, wynik /tmp/dart-training-clarity. Brak testu fizycznego dotyku i odsłuchu. Rzeczywiste 145 lotek użytkownika nie zostało pobrane ani zdiagnozowane; znane są tylko dane ze zrzutów. Bez push, publikacji, migracji i modyfikacji danych produkcyjnych.
