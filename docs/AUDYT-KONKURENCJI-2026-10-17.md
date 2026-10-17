# Audyt konkurencji DART PARTY — 17.10.2026

Wniosek: nie potwierdzono tezy „nie ma polskiej mądrej aplikacji do darta”. Znaleziono polski produkt AstroDarts, polski interfejs DartsOn oraz zagraniczne produkty oferujące trening dopasowany do danych. Nie znaleziono w badanej próbie potwierdzenia całego połączenia: trener mówiący po polsku, plany z historii sparingów konkretnej grupy, wyraźny tryb zawodów bez porad, integracja Scolia. To hipoteza przewagi do sprawdzenia, nie dowód braku konkurencji.

## Zakres i wiarygodność

Audyt źródeł publicznych: strony producentów, dokumentacja, historie wydań, karty App Store i Google Play. Wcześniej oglądano profil GoDartsPro użytkownika w Chrome. Nie instalowano konkurencyjnych aplikacji ani nie kupowano planów. Nie oceniono faktycznej skuteczności trenerów, jakości polskiego głosu ani dokładności kamer. Opis producenta jest dowodem deklarowanej funkcji, nie dowodem jakości. Polski opis sklepu nie jest dowodem polskiego interfejsu. Brak wzmianki o funkcji oznacza „niepotwierdzone”, nie „nie istnieje”. Nie szacowano udziałów rynkowych ani popytu.

## Porównanie

| Produkt | Polski język / pochodzenie | Trening i rozwój | Automatyzacja / AI | Model i ograniczenia |
|---|---|---|---|---|
| AstroDarts | Polski interfejs web; deweloper w Polsce potwierdzony w Google Play | 121, Around the Clock, doubles, podsumowania treningów, historia i statystyki; online i turnieje | AutoScore AI. „Trening AI” w instrukcji oznacza uczenie rozpoznawania trafień korektami gracza, nie osobistego trenera | Darmowe gry online deklarowane; istnieje Premium. Nie potwierdzono adaptacyjnego planu tygodniowego. [Strona](https://astrodarts.pl/), [przewodnik](https://astrodarts.pl/przewodnik.html), [Google Play](https://play.google.com/store/apps/details?hl=pl&id=astrodarts.pl) |
| DartsOn | Polski interfejs potwierdzony w historii wersji 2.4, 20.08.2026; nie ustalono polskiego pochodzenia | Treningi, historia, heatmapy, statystyki, boty i Cricket | Rozpoznawanie z kamery telefonu; AI w tym kontekście dotyczy obrazu | Darmowy start i Premium. Nie potwierdzono osobistego trenera z planem tygodniowym. [Strona](https://dartson.app/pl/), [historia wydań](https://dartson.app/changelog/) |
| GoDartsPro | Badany profil i materiały po angielsku; pełnego polskiego interfejsu nie potwierdzono | Ponad 120 gier, Virtual Coach dobierający zadania z wyników, historia i centrum postępów | Potwierdzona integracja Scolia; personalizacja treningu istnieje, nie ustalono rodzaju modelu AI | Premium: według strony 6,95 EUR/mies. lub 69,95 EUR/rok. Bardzo bliski konkurent w treningu. [Producent](https://www.godartspro.com/) |
| All-Round | App Store wymienia angielski | Coach Tom, rozmowa o wynikach, analiza sesji i tygodniowe plany treningowe; gra lokalna/online według producenta | Deklarowany trener AI oparty na danych gracza | Trener i plany w Pro; landing podaje 3,99 GBP/mies. lub 24,99 GBP/rok bez Apple Watch. Nie potwierdzono integracji Scolia. [Producent](https://landing.all-round.pro/), [App Store](https://apps.apple.com/us/app/all-round-darts-coach-scorer/id6739191378) |
| Dartsmind | iOS: lista pięciu języków nie zawiera polskiego; polski opis Google Play tego nie zmienia | Gry treningowe i imprezowe, statystyki, bot, Cricket Cut-Throat | AI rozpoznaje trafienia z kamery urządzenia | Abonament Pro i monety. Nie potwierdzono adaptacyjnego osobistego trenera. [App Store](https://apps.apple.com/pl/app/dartsmind/id1018594473) |
| My Dart Training | Nie potwierdzono polskiego interfejsu z autorytatywnego źródła w tym audycie | Bogata lista ćwiczeń, zapis postępów, profile treningowe i gry wieloosobowe | Nie potwierdzono trenera AI ani integracji kamery | Reklamy i zakupy w aplikacji. [Google Play](https://play.google.com/store/apps/details?hl=en-US&id=at.steirersoft.mydarttraining) |
| Target DartCounter | Karta iOS wskazuje angielski; nie rozstrzygnięto wszystkich wersji/platform | Gry i ćwiczenia, szczegółowe statystyki w Ultimate, online | Omni automatyzuje zapis trafień | Abonament Ultimate; nie potwierdzono osobistego trenera z planem tygodnia. [Statystyki](https://dartcounter.net/darts-manual/dartcounter-statistics), [Omni/Ranked](https://dartcounter.net/features/dartcounter-ranked), [App Store](https://apps.apple.com/pl/app/dartcounter/id999533915) |
| Datsu | Polska strona; pochodzenia firmy nie ustalono | Deklarowane statystyki, historia, trening, online i turnieje | Kamery DartKit i automatyczny zapis | Strona oznaczona „Już wkrótce”; nie traktować jej jako dowodu dostępnej, sprawdzonej aplikacji. [Producent](https://datsu.app/pl/) |

Dalszy konkurent do obserwacji: [MyDarts](https://mydarts.co.uk/) deklaruje osobistego trenera AI, plany wielodniowe, statystyki i wpisywanie wyniku głosem. Nie zweryfikowano jakości działania ani obsługi polskiego. Samo hasło „AI coach” nie jest wolną niszą.

## Scolia — potwierdzona ścieżka techniczna

[Oficjalna strona API Scolii](https://scoliadarts.com/api/) oferuje tworzenie własnych aplikacji punktujących i analitycznych. Wymienia zdarzenia rzutu z punktami, współrzędnymi X-Y i kątami 3D, stan jednostki oraz początek/koniec wyjmowania lotek. Strona kieruje do kontaktu. Nie zweryfikowano ceny, licencji, sposobu uwierzytelnienia, limitów ani dostępu dla DART PARTY. Niczego nie wysłano do producenta.

To korekta wcześniejszego ograniczonego rozpoznania FAQ: API istnieje. Integracja z systemem nie oznacza bezpośredniego przejęcia strumieni jego kamer. W pierwszej kolejności warto odbierać gotowe zdarzenia trafień. Współrzędne pomagają mierzyć rozrzut, ale nie ujawniają zamierzonego celu ani ruchu ręki. Trener nie powinien diagnozować techniki łokcia wyłącznie z punktów na tarczy.

## Rekomendacja dla DART PARTY

Pozycjonowanie: polski trener dla grupy znajomych, który zamienia weekendowe sparingi w osobiste zadania na tydzień i pokazuje, czy trening pomaga w kolejnym meczu.

1. Zbudować trwałe profile oraz zapis każdej lotki. Osobno trening i zawody, reguły, rywal, zamierzony cel jeśli znany, wynik, korekty i źródło ręczne/kamera.
2. TRENING: krótkie polskie objaśnienie celu, konkretne ćwiczenie, ocena po serii. ZAWODY: bez rad i komentarza; analiza dopiero po meczu. To wymagania użytkownika, jeszcze nie potwierdzone wdrożenie.
3. Plan na tydzień ma pokazywać powód na danych: liczba prób, okres, skuteczność i mierzalny cel. Przykładowych liczb nie prezentować jako prawdziwych wyników Przemka.
4. Porównywać trening z zawodami, a nie mieszać ich w jedną średnią. Dla Cricket i X01 zachować właściwe oddzielne metryki. Nie wnioskować o stresie wyłącznie z niższej średniej.
5. Rdzeń liczenia i statystyk deterministyczny. AI objaśnia sprawdzone metryki i dobiera ćwiczenia z kontrolowanej biblioteki; jakość programu oceniać również z trenerem darta.
6. Brak reklam przerywających grę i czytelne koszty jako proponowana zasada produktu. Nie obiecywać bezpłatnego, nieograniczonego AI bez policzenia kosztów.
7. Scolia jako pierwszy kandydat integracji, po potwierdzeniu warunków. Ręczne wprowadzanie pozostaje pełnoprawną ścieżką.

## Następna walidacja

Test użytkowy AstroDarts, DartsOn i All-Round tym samym scenariuszem: profil, trening, zapis, ponowne otwarcie, mecz dwóch graczy, historia, plan na kolejny trening; ocenić liczbę kliknięć, jakość polskiego, utratę danych i bariery płatnicze. Osobno uzyskać warunki API Scolii. Dla własnego prototypu przeprowadzić kilkutygodniowy pilotaż trening/sparing i sprawdzić powroty użytkowników oraz wykonanie ćwiczeń. Tego etapu jeszcze nie wykonano.

Nie rekomenduję reklamy „pierwsza polska inteligentna aplikacja do darta”. Dowody uzasadniają dalszą pracę nad konkretną przewagą użytkową, nie twierdzenie o pustym rynku.
