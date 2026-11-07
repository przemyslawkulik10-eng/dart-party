# Kamera we wszystkich grach — wydanie z zatwierdzaniem

## Zakres zaakceptowany

Użytkownik zlecił wdrożenie odczytu kamery w każdej grze, zaakceptował makietę wspólnego panelu i wymagał zachowania klawiatury. Potwierdził, że próby fizyczną kamerą wykonamy później w praktyce. Panel i silniki korzystają z dotychczasowych zasad gry; klawiatura i cofanie pozostają dostępne.

Odczyt jest eksperymentalną propozycją pojedynczej nowej lotki. Nie jest bezobsługowym ani zweryfikowanym na sprzęcie automatycznym licznikiem. Nowy własny detektor porównuje obrazy; to heurystyka, a nie wytrenowany model. Nie publikuje się modeli ani kodu runtime InstaDarts z prywatnego LAB.

## Obsługa

1. Otwórz lub wznów grę. Naciśnij **Kamera · odczytaj rzut**.
2. Uruchom źródło obrazu; na Macu wybierz zwykłą kamerę iPhone'a, nie Widok blatu. Udziel zgody na kamerę.
3. Ustaw stabilny kadr i wskaż kolejno zewnętrzne brzegi D20, D6, D3 i D11. Obrót oraz powiększenie zmieniają widok, nie surowy obraz do analizy.
4. Przy pustej tarczy naciśnij **Pusta tarcza — zapamiętaj tło**, następnie **Rozpoznaj lotkę**.
5. Rzuć jedną lotkę. Sprawdź proponowane pole i zaznaczony grot. Użyj **Popraw** lub **Zatwierdź lotkę**. Bez zatwierdzenia punkty nie są dopisywane.
6. Po wyjęciu lotek zapamiętaj nowe puste tło. Po ręcznym wpisie, cofnięciu lub zmianie kolejki też wymagane jest nowe tło, aby nie dodać ponownie istniejącej lotki.

Każda lotka, która wypadła, daje 0. Sam brak wykrycia przez kamerę nie dowodzi wypadnięcia. Przy zniknięciu obiektu program wstrzymuje odczyt, nie kasuje sam wyników. Wcześniej zapisane trafienie należy skorygować przez istniejące cofanie w grze. Dwie lotki po 25, które obie wypadły, nie dają 50 punktów.

## Gry i zapis

- 501, 301, 201 oraz Cricket: istniejący `recordDart`, również mecze z trenerem.
- Cyferki: trafienie aktualnego celu, pozostałe potwierdzone pola jako brak trafienia celu.
- Mnożnik: osobne mapowanie fazy trafień i punktów; solo oraz sparing.
- JDC: pierwsze wolne miejsce draftu, zachowanie istniejących pól i dotychczasowy zapis rundy; także pojedynek.
- Sektor 20 / BULL: rzeczywiste pole, z blokadami pauzy i końca czasu.
- Walka o rozpoczęcie: BULL 25/50, pozostałe potwierdzone pola za 0.

Rewizja kontekstu, właściciel konta i właściciel widoku chronią przed zapisem starego odczytu do innej gry, kolejki lub konta. Nieaktualne, puste i niepoprawne odczyty nie są zamieniane na pudła. Przed zatwierdzeniem wykonywana jest ponowna kontrola świeżego nieruchomego obrazu. Wyciszenie źródła i ukrycie strony wstrzymują analizę. Kamera znajduje się poza przebudowywaną planszą `#app`.

Obraz jest analizowany w przeglądarce. Nie jest wysyłany do serwera ani zapisywany w koncie. Zatwierdzone wyniki korzystają z istniejącego zapisu i synchronizacji gry.

## Weryfikacja przed publikacją

- `npm test`: **249/249 PASS**.
- `npm run build`: **PASS**. Projekt nie ma osobnego typechecka TypeScript; zmienione moduły sprawdzono przez `node --check` i testy.
- Test przeglądarkowy syntetycznej kamery: kalibracja → puste tło → nowy T20 → propozycja T20/60 → zatwierdzenie → 301 zmienia się na 241. Ręczne S19 daje 222; cofnięcie przywraca 241. To test przepływu programu, nie dokładności na fizycznej tarczy.
- Dostęp do panelu i ręcznych kontrolek potwierdzony w 8 pozycjach biblioteki oraz wariantach: trener X01/Cricket, Mnożnik sparing (obie fazy), JDC pojedynek/double, trening BULL.
- Otwarty panel z Cricket, 6 graczami i długimi nazwami: 1920×1080, 1180×820, 1024×768, 820×1180 i 390×844; bez poziomego przepełnienia kontrolek, klawiatura pozostaje dostępna.
- Testy obejmują powtarzające się pola, nieaktualne rewizje, puste sloty, zmianę konta, błędy zapisu, ruch/wyjmowanie obiektów, pauzę i wznowienie świeżych klatek.

Nie sprawdzono jeszcze: trafności na iPhonie użytkownika, lotek zasłaniających się, różnych cieni/oświetlenia i dokładności przy drucie, fizycznego dotyku ani długotrwałej sesji Safari. Wybór grotu bliższego środkowi jest heurystyką. Korekta użytkownika pozostaje konieczna.

## Ograniczenia i dalszy etap

Rozpoznawanie wymaga jednej nowej lotki naraz. Obiekt podobny do lotki może być fałszywą propozycją. Jednoczesne zmiany, wyjęcie lotek i poruszenie aparatu wstrzymują odczyt. Każdy render ręcznej klawiatury, nawet zmiana mnożnika, może obecnie wymagać nowego tła — konserwatywne zabezpieczenie przed powtórzeniem wyniku.

Następny etap: krótki test na fizycznej tarczy i zapis porównania pola rzeczywistego z proponowanym, przed rozważaniem automatycznego zatwierdzania.
