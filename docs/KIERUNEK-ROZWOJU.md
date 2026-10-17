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

## 17.10.2026 — swobodna gra i zasięg międzynarodowy

- Wejście „Graj bez logowania” pozostaje stałą, równorzędną ścieżką. Sparingi bez konta, e-maila, trenera AI i wymuszonego okresu próbnego. Imiona/pseudonimy służą obsłudze meczu; profil lokalny nie oznacza rejestracji konta.
- Gracz najpierw poznaje aplikację. Sam wybiera dalszą drogę: tylko sparingi, samodzielny trening albo dobrowolny trener AI. Bez przymusowej rejestracji po określonej liczbie meczów.
- Konto jest dodatkiem do przenoszenia historii między urządzeniami; nie jest warunkiem gry. Przyszły pakiet AI nie blokuje podstawowego licznika i sparingów.
- Gość zachowuje lokalne wyniki. Po rejestracji możliwe świadome dołączenie własnej historii; nie przypisywać kontu wszystkich profili wspólnego tabletu.
- Cel: wiele języków, docelowo jak najszersza dostępność na świecie. Wybór ręczny i zapamiętanie preferencji, z propozycją języka urządzenia. Brak bariery językowej przy wejściu bez konta.
- Tłumaczenie obejmuje cały interfejs, zasady, błędy, daty/liczby, dostępność, komunikaty głosowe i odpowiedzi trenera. Dla języków pisanych od prawej do lewej uwzględnić RTL. Nie tłumaczyć imion użytkowników ani zmieniać zasad/punktacji.
- Język dostępny w wyborze dopiero po uzupełnieniu i sprawdzeniu tłumaczenia całego przepływu. Nie udawać „każdego języka” listą flag lub częściowym tłumaczeniem ekranu głównego. Obecny interfejs pozostaje polski; pełna wielojęzyczność to kolejny etap implementacji.
- Docelowa architektura: katalogi komunikatów zamiast tekstów w rendererach, jawny język sesji UI, oddzielny język lektora/AI, bez sieci do podstawowych tłumaczeń. Najpierw pełne PL/EN, potem kolejne katalogi — propozycja kolejności technicznej, nie ograniczenie zasięgu.

## Powrót po przerwie i wzorce pokazane przez użytkownika

- Panel powrotu korzysta tylko z własnych zapisanych lotek treningowych. Nie utożsamia braku historii z brakiem gry poza aplikacją. Nie importowano wyników GoDartsPro ze zrzutów ekranu.
- Prosty plan jest dobrowolny i opisany jako reguły oparte na aktywności, nie jako odpowiedź AI. Po przerwie proponuje JDC jako punkt odniesienia, bez obowiązku pobicia rekordu. Dla świeżej pełnej próby proponuje krótkie ćwiczenie. Wznowienie JDC ma pierwszeństwo przed nową próbą.
- Ostatnie 30 dni pokazują pełne próby JDC, krótkie sesje z rzutami i średnią JDC. Próg 30 dni służy wyłącznie komunikatowi powrotu, nie diagnozie poziomu ani odblokowaniu gry.
- Użytkownik pokazał katalog GoDartsPro: kafelki, ulubione, ostatnio grane, grupowanie według umiejętności. Referencja do dalszego rozwoju katalogu, bez polecenia kopiowania wszystkich gier, grafik i nazw. Pozostaje wcześniejszy kierunek stopniowego odblokowywania ćwiczeń.
