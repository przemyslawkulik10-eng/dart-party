# DART PARTY — plan pierwszego wydania

Uzgodniony kierunek, 19 października 2026.

## Cel
Globalna aplikacja do darta z subskrypcją: przeglądarka, iPhone i Android. Jedno konto gracza, profil i wyniki na różnych urządzeniach. Polska i angielska wersja interfejsu. Własna identyfikacja DART PARTY.

Pierwsi testerzy: Maciek, Jarek, Maniek, Dawid, Przemek, Beko. Przemek: właściciel, administrator, twórca i projektant. Lista jest planem wdrożenia, nie potwierdzeniem utworzenia kont. Adresów e-mail i telefonów nie umieszczamy w publicznym repozytorium.

## Free i Premium
| Free | Premium |
| --- | --- |
| Konto i profil | Wszystkie funkcje Free |
| 201, 301 i 501 | Rozbudowane treningi i dodatkowe tryby |
| Lokalny mecz ze znajomymi | Plany treningowe i cele |
| Podstawowe statystyki i historia | Szczegółowe analizy i trendy |
| Synchronizacja własnych wyników | Wyzwania i dodatkowa rywalizacja |

Premium: plan miesięczny i roczny. Ceny, okres próbny i dokładna lista płatnych treningów pozostają do decyzji. Istniejących gier nie blokujemy automatycznie przed wdrożeniem i zatwierdzeniem dostępu Premium.

## Strony i przepływ
- Start: czym jest DART PARTY, rozpoczęcie gry, wejście do konta.
- Graj: katalog gier, wyszukiwanie, ulubione, dostęp według planu.
- Ustawienia meczu → tarcza/punktacja → wynik meczu.
- Mój profil: dane gracza, rekordy, historia, statystyki.
- Trening: wybór ćwiczenia, sesja, podsumowanie.
- Konto: rejestracja, logowanie, odzyskanie dostępu, język, zarządzanie kontem.
- Premium: porównanie planów, zakup, stan subskrypcji, zarządzanie zakupem.
- Pomoc i prywatność: kontakt, zasady, eksport i usunięcie konta.
- Administracja: osobny dostęp dla uprawnionych operatorów.

## Etap 1 — konto i własne dane
Domknąć rejestrację i reset hasła z działającą pocztą. Przetestować prywatność danych między kontami A/B oraz użytkownikiem anonimowym. Pobierać istniejący profil przed utworzeniem nowego na drugim urządzeniu. Wykrywać konflikt synchronizacji i zachować kopię danych przed zastąpieniem.

Gotowość: zawodnik rejestruje konto, potwierdza e-mail, tworzy profil, zapisuje wynik, loguje się na innym urządzeniu i widzi te same dane. Drugi zawodnik nie ma dostępu do jego prywatnych zapisów.

## Etap 2 — wspólny mecz, właściwy zawodnik
Wspólny tablet to urządzenie prowadzącego mecz, a nie wspólne konto wszystkich graczy. Uczestnik meczu ma stabilny identyfikator. Konto łączymy z uczestnikiem po potwierdzeniu przez zawodnika, nie po zgodności pseudonimu lub adresu e-mail wpisanego przez prowadzącego.

Docelowy model: mecz, uczestnicy, rzuty, wynik oraz potwierdzone powiązania uczestników z kontami. Gracz gościnny może grać bez rejestracji. Wielokrotna synchronizacja nie powinna naliczać meczu ponownie. Zmiana pseudonimu nie może zmieniać właściciela historii. Publiczne rankingi oddzielamy od prywatnych danych kontaktowych.

Obecny zapis całej przestrzeni konta jest etapem przejściowym. Sam w sobie nie rozdziela meczu prowadzonego na wspólnym tablecie na konta wszystkich uczestników.

## Etap 3 — języki
Wspólny słownik PL/EN dla nawigacji, gier, komunikatów i konta. Daty i liczby zgodne z wybranym językiem. Zmiana języka nie zmienia reguł ani zapisanych wyników.

## Etap 4 — Premium
Serwer jest źródłem uprawnień Free/Premium i roli administratora. Informacja w przeglądarce nie nadaje praw. Uprawnienia wynikają ze zweryfikowanego zakupu, z obsługą odnowienia, wygaśnięcia, anulowania i zwrotu. Powtarzane zdarzenie płatności nie może naliczyć uprawnienia wielokrotnie.

Przed wdrożeniem zakupu sprawdzić aktualne wymagania Apple i Google oraz dostępność metod płatności na planowanych rynkach. Nie wybieramy jeszcze dostawcy płatności ani cen. Nie sprzedajemy Premium przed testem pełnej ścieżki zakupu i odzyskania uprawnień.

## Etap 5 — aplikacje mobilne i beta
Wybrać technologię po krótkim sprawdzeniu obecnej aplikacji na prawdziwym iPhonie i Androidzie: czytelność punktacji, dotyk, dźwięk, zapis offline, powrót do gry, logowanie i zakup. Zachować wspólne zasady punktowania i konto w trzech wersjach.

Następnie beta dla sześciu testerów, poprawki i przygotowanie publikacji. Konta deweloperskie, materiały sklepowe i przegląd aplikacji pozostają przed nami. Wersje sklepowe jeszcze nie istnieją.

## Stan i najbliższa zależność
Konta są na gałęzi roboczej; nie zostały opublikowane. Testy interfejsu używają symulowanego API. Migracja kont została sprawdzona z ROLLBACK, ale nie zastosowana trwale. Nie potwierdzono rzeczywistej wysyłki e-maili ani pełnej izolacji kont w bazie.

Następna decyzja właściciela: czy DART PARTY ma własną domenę. To pozwoli przygotować adres nadawcy i uruchomić pocztę do potwierdzeń i resetów. Nie kupować domeny ani usługi bez wskazania konkretnego wariantu i zgody na koszt.
