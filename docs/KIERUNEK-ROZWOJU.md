# DART PARTY — ustalenia produktu 17.10.2026

## Decyzje użytkownika

- Dwa tryby: TRENING i ZAWODY / SPARING.
- Wirtualny trener jest dobrowolny: domyślnie wyłączony, możliwy trening samodzielny i zmiana wyboru w trakcie sesji.
- TRENING: stopniowy rozwój, pomoc i objaśnienia, docelowo osobisty trener AI oparty na własnych wynikach.
- Gracz nie dostaje od razu wielkiej biblioteki gier. Opanowanie umiejętności i awans odblokowują następne gry treningowe.
- Krótkie sesje z końcem, nie trening do wyczerpania. 4 × 15 minut tygodniowo to przykład do testów, nie sztywna ustalona reguła.
- W tygodniu każdy trenuje indywidualnie; w weekendy grupa gra sparingi.
- ZAWODY: bez podpowiedzi i komentarzy; wyniki i rzuty zapisują się. Analiza po meczu zasila dalszy trening.
- Poziom rozwoju nie blokuje wspólnego sparingu ze znajomymi.
- Osobne profile, historia rzutów, statystyki i postępy. Treningi i mecze muszą być odróżnialne w danych.
- Docelowo iOS/Android oraz opcjonalna integracja systemu kamer, w pierwszej kolejności zbadanie API Scolii.

## Nieustalone — nie przedstawiać jako gotowe

- Progi awansu i dokładna kolejność gier: potrzebne testy z graczami i walidacja treningowa.
- Częstotliwość i czas treningów: propozycja 4 × 15 minut.
- Model AI, koszty, konta i synchronizacja, licencja API Scolii, model płatności.
- Nie nazywać prostych reguł lub stałych komunikatów działającym trenerem AI.

## Stan implementacji przed kolejnym etapem

Istniejący lokalny licznik X01/Cricket, zapis meczów, podpowiedzi X01 i celebracje. Dodano pierwszy trening solo sektora 20 (5/10/15 minut, pauza, historia lokalna), wybór Trening/Zawody oraz wyciszenie i brak podpowiedzi w nowych zawodach. Poziomy, automatyczne odblokowanie gier, pełne profile i AI nie są jeszcze wdrożone. Audyt konkurencji znajduje się w AUDYT-KONKURENCJI-2026-10-17.md. Nie rozpoczynać od zera i nie usuwać obecnych zapisów.
