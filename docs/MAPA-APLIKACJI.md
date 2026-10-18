# DART PARTY — budowa aplikacji i mapa stron

Projekt do zatwierdzenia • 18.10.2026

## Cel
Jedna aplikacja pod https://dart-party-alpha.vercel.app, z dwiema głównymi drogami:
- telefon/komputer: własny profil, trening, historia i postępy zawodnika;
- wspólny tablet przy tarczy: wybór składu, mecz, wpisywanie lotek i wynik.

Poniższe adresy to proponowane docelowe strony. Obecna aplikacja przełącza widoki pod jednym adresem; nie ma jeszcze opisanej niżej nawigacji i kont online. Konta, uprawnienia, synchronizacja, ranking oraz administracja to kolejne etapy, nie funkcje już wdrożone.

## Nawigacja główna
Start | Gry | Trening | Zawodnicy | Moje konto
Na telefonie: Start | Gry | Trening | Mój profil. Zawodnicy i pozostałe sekcje w menu.
Podczas meczu: pozostaje ekran gry, cofanie, zapis i wyjście; ukrywamy nawigację rozpraszającą przy tarczy. Wyjście nie kasuje meczu.

## Mapa stron i podstron
| Strona | Proponowany adres | Zawartość i działanie |
|---|---|---|
| Start | / | Graj z ekipą, trenuj, otwórz mój panel, wznów ostatnią grę; informacja o stanie zapisu. |
| Katalog gier | /gry | Kafelki z ikonami, nazwa, opis, liczba graczy, solo/sparing. Pokazujemy tylko dostępne gry. |
| Szczegóły gry | /gry/:gra | Zasady, warianty, przyciski Trening/Graj z ekipą zgodnie z obsługą danego trybu. |
| Ustawienia nowego meczu | /gra/nowa | Wybór gry, zawodników/gości, drużyn, legów i zasad; podsumowanie przed rozpoczęciem. |
| Kolejność rzucania | /gra/:id/start | Walka o środek lub jej pominięcie; wyświetlenie i zatwierdzenie kolejności. |
| Ekran meczu | /gra/:id | Wyniki, aktywny gracz, pola, trzy lotki, cofanie, głos i stan zapisu. Układ do obsługi przy tarczy. |
| Wynik meczu | /gra/:id/wynik | Zwycięzca/remis, wynik legów, podsumowanie, rewanż i powrót do panelu. |
| Historia meczu | /gra/:id/historia | Kolejki i rzuty; widok wyniku bez automatycznej zmiany zapisów. |
| Treningi | /trening | JDC, sektor 20, Mnożnik solo; cel, zasady i czas/liczba lotek. |
| Aktywny trening | /trening/:id | Wpisywanie lotek, przerwanie/wznowienie, zakończenie. |
| Wynik treningu | /trening/:id/wynik | Wynik, trafienia, rekord w porównywalnym wariancie, ponowienie próby. |
| Zawodnicy | /zawodnicy | Wybór profilu lokalnego, a po wdrożeniu kont: lista członków własnej ekipy. |
| Mój panel | /ja | Karta gracza, ostatnia aktywność, gry w toku, wyniki i kafelki ulubionych/ostatnich gier. |
| Profil zawodnika | /zawodnicy/:id | Widok profilu zgodny z uprawnieniami; nie ujawniamy całej historii innym bez decyzji właściciela. |
| Gry gracza | /ja/gry | Gry z ikonami, liczba rozgrywek, rekord lub zwycięstwa właściwe dla danej gry. |
| Historia gracza | /ja/historia | Mecze i treningi; filtry gry, daty, trybu i zakończenia; przejście do szczegółów. |
| Statystyki gracza | /ja/statystyki | Sparingi i treningi oddzielnie; liczba lotek, wygrane, rekordy, średnie wyłącznie dla porównywalnych reguł. |
| Edycja profilu | /ja/profil | Pseudonim, opcjonalny avatar, preferencje; zmiana nazwy nie zmienia tożsamości zawodnika. |
| Dane i kopie | /ja/dane | Eksport, import, ręczne przypisanie starych zapisów, kopia przed zmianą; bez automatycznego łączenia po imieniu. |
| Logowanie | /logowanie | Docelowo dostęp do własnego konta online. Metoda logowania zostanie wybrana przed wdrożeniem. |
| Dołączenie do ekipy | /zaproszenie/:kod | Docelowo przyjęcie zaproszenia; przypisanie właściwego konta, bez odgadywania po pseudonimie. |
| Moja ekipa | /ekipa | Członkowie, ostatnie wspólne mecze, zaproszenia; po wdrożeniu kont i uprawnień. |
| Ranking ekipy | /ekipa/ranking | Dopiero po ustaleniu reguł; oddzielne zestawienia według gry i okresu, bez mieszania punktów różnych gier. |
| Ustawienia | /ustawienia | Dźwięk, głos, wygląd, wspólny tablet, preferencje zapisu. |
| Pomoc | /pomoc | Zasady, pierwsza gra, kopia danych i rozwiązywanie problemów. |

## Układ panelu gracza
1. Karta gracza: pseudonim, avatar, data dołączenia i informacja, czy profil jest lokalny czy online.
2. Podsumowanie: zapisane rozgrywki, rzeczywista liczba lotek, ukończone sparingi, zwycięstwa.
3. Kontynuuj: rozpoczęte mecze i treningi; jasna informacja, na którym urządzeniu zapis jest dostępny.
4. Twoje gry: ikona, nazwa, liczba rozgrywek, odpowiedni wynik/rekord i przycisk uruchomienia.
5. Ostatnie wyniki: skrócona historia z przejściem do szczegółów.
6. Postępy: filtry okresu i gry; komunikat Brak danych, jeśli nie ma podstaw do obliczenia.
7. Pełna historia, ustawienia profilu i eksport danych.

Zrzuty GoDartsPro służą jako odniesienie organizacji ekranu: karta gracza, podsumowania, katalog gier z ikonami. DART PARTY zachowuje własny styl, nazwy i własne dane. Wskaźniki GoDartsPro, jego wyniki, odznaki oraz gry nie stają się automatycznie częścią DART PARTY.

## Jak zawodnicy uzyskają dostęp
Obecnie: publiczny link, bez konta; profil i wyniki lokalne w danej przeglądarce.
Docelowo:
1. Organizator tworzy ekipę i wysyła zaproszenie zawodnikowi.
2. Zawodnik zakłada konto/loguje się i wybiera pseudonim.
3. Na telefonie otwiera własny panel. Tablet gospodarza wybiera członków ekipy do gry bez logowania każdego po kolei na wspólnym urządzeniu.
4. Uprawniony tablet zapisuje mecz dla wybranego składu; zawodnicy widzą swoje wyniki po synchronizacji.
5. Gość może zagrać bez konta; późniejsze przypisanie wyniku wymaga jawnego potwierdzenia. Ten sam pseudonim nie dowodzi tej samej tożsamości.

Widoczność domyślna do zatwierdzenia: pełny profil prywatny; w ekipie widoczne wspólne wyniki; brak publicznego katalogu prywatnych danych. Organizator zarządza składem i zaproszeniami, a nie hasłami zawodników.

## Zapis i synchronizacja — wymagania
- Każda lotka jest zapisywana lokalnie; brak internetu nie blokuje rozpoczętego meczu.
- Po wdrożeniu synchronizacji: widoczny stan Zapis lokalny / Synchronizacja / Zapis w chmurze / Błąd.
- Jeden tablet prowadzi dany mecz; drugi ekran nie może bez kontroli nadpisywać jego wyniku.
- Konto i profil posiadają stałe identyfikatory. Imię jest etykietą, nie kluczem łączenia zapisów.
- Przenoszenie dotychczasowych danych: kopia, jawny wybór właścicieli, walidacja, dopiero zapis.
- Wykresy i rankingi tylko z zapisanych zdarzeń i jawnych reguł obliczeń.

## Kolejność budowy i warunki zakończenia
1. **Mapa i nawigacja:** zatwierdzić ten układ; ustalić stronę startową i podział własny telefon/wspólny tablet.
2. **Panel lokalny i katalog gier:** karta zawodnika, ikony, Mnożnik w statystykach, czytelne braki danych, ręczne przypisywanie starych meczów z kopią. Test: zapis gry pojawia się przy właściwej osobie; cofanie nie zawyża statystyk.
3. **Strony i adresy:** nadać widokom docelowe trasy. Test: Wstecz/Dalej, odświeżenie podstrony i wznowienie działają, zapis meczu pozostaje nienaruszony.
4. **Konta i ekipa:** wybrać logowanie, zaproszenia, role i widoczność. Przygotować podgląd/testy przed zmianami bazy i produkcji.
5. **Synchronizacja:** tablet → chmura → telefon. Test: ten sam wynik na dwóch urządzeniach, brak duplikatów, obsługa offline i konfliktów.
6. **Rankingi i osiągnięcia:** dopiero na sprawdzonych danych, z opisanymi regułami i porównywalnymi wariantami gry.

## Stan na 18.10.2026
Produkcja: commit 0c5d1e7 — gra i lokalne profile/statystyki.
Rozpoczęta lokalnie gałąź codex/player-dashboard: nowy układ profilu, ikony oraz odczyt wyników Mnożnika. 122 istniejące testy i build przeszły, ale brakuje nowych testów panelu, testu przeglądarkowego i dopracowania. Zmiany nie są opublikowane.
Plan nie oznacza wdrożenia kont, synchronizacji, nowych adresów ani rankingów.
