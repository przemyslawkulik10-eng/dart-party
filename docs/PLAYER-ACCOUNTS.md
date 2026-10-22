# Konta graczy — stan roboczy

## 2026-10-22 — trwałe logowanie, poprawka lokalna

Gałąź `codex/persistent-login`, punkt wyjścia `eb5e784`. Ta sekcja zastępuje starszy opis przechowywania sesji poniżej. Pozostałe akapity są historyczne; nie wyznaczają obecnego stanu produkcji ani migracji.

- Sesja konta gracza jest zapisywana w `localStorage`, z automatycznym odświeżaniem tokenów przez SDK. Zamknięcie karty/przeglądarki nie kończy logowania. „Wyloguj się” usuwa sesję tego urządzenia; nie usuwa wyników ani profili.
- Obecna sesja z `sessionStorage` przechodzi jednorazowo do trwałej pamięci. Znacznik przejścia zapobiega przywróceniu wylogowanego konta przez starszą kartę. Istniejąca trwała sesja ma pierwszeństwo.
- Wylogowanie lub zmiana konta w drugiej karcie przeładowuje widok, żeby nie pozostawić interfejsu poprzedniego gracza. Odświeżenie tokenu tego samego konta nie przeładowuje gry.
- Weryfikacja: 186/186 testów jednostkowych, `npm run build`, `git diff --check`. `tests/persistent-login-browser.cjs` używa prawdziwego Chrome, tymczasowego profilu, lokalnego serwera i wyłącznie symulowanego Auth/API: logowanie formularzem, zamknięcie/otwarcie karty, pełny restart przeglądarki, odświeżenie wygasłego tokenu, wylogowanie obu kart, ponowny start bez logowania, zachowanie danych gościa i konta, przeniesienie starej sesji i blokada jej ponownego przywrócenia.
- Bez publikacji, push, migracji, prawdziwego konta, konfiguracji Supabase i płatnych wywołań. Nie testowano fizycznego tabletu ani zainstalowanej PWA. Usunięcie danych przeglądarki lub unieważnienie sesji przez usługę nadal może wymagać logowania. Obecna weryfikacja użytkownika przy starcie wymaga dostępności Auth; ta poprawka nie dodaje logowania offline.

Odtworzenie testu przeglądarkowego: `PLAYWRIGHT_MODULE=<ścieżka do playwright> node tests/persistent-login-browser.cjs`. Serwer wybiera wolny port i zamyka się po teście; profil zawiera wyłącznie dane syntetyczne i jest usuwany po teście.

## Historia prac

Gałąź: feature/player-accounts. Nie opublikowano na produkcji.

Zaimplementowano ekran /?page=konto, logowanie, rejestrację, odzyskiwanie hasła, oddzielną pamięć konta, tworzenie profilu, eksport kopii oraz ręczną synchronizację z kontrolą rewizji. Konto wymaga synchronizacji po grze i przed zmianą urządzenia. Dane gościa pozostają w oryginalnej pamięci. Import historii gościa do konta nie został dodany.

Sesja SDK jest przechowywana w sessionStorage. Dane konta są buforowane lokalnie pod ID użytkownika. Ponowne logowanie jest potrzebne w nowej sesji przeglądarki. Nie czyścić danych przeglądarki przed eksportem lub synchronizacją.

Przygotowano migrację 20261018220956_player_accounts.sql. Sprawdzono jej wykonanie w projekcie DART PARTY ytljwejzcihyxfewrpej w transakcji z ROLLBACK: nie utworzono trwałej tabeli. Projekt firmowy Magazyn pozostaje poza zakresem.

Sprawdzenia: 129 testów jednostkowych, build, diff check. Test Chrome login-browser.cjs: symulowane Auth/API, profil, upload, konflikt, pobranie chmury, logout, pięć rozmiarów ekranu. Istniejący player-account-browser.cjs także przeszedł. Nie jest to dowód działania rzeczywistej wysyłki e-maili ani pełny test RLS między prawdziwymi kontami.

Przed wydaniem:
1. Wybrać usługę pocztową i adres nadawcy; zakupiono domenę dartparty.app z Zimbra Starter w OVH, ale skrzynka i wysyłka SMTP wymagają konfiguracji i weryfikacji. Sekrety wpisać bezpośrednio w Supabase.
2. Skonfigurować URL aplikacji i dozwolone przekierowania potwierdzenia/resetu; zweryfikować włączone potwierdzanie e-maila.
3. Zastosować migrację wyłącznie do DART PARTY i sprawdzić RLS: konto A, konto B, użytkownik anonimowy oraz konflikty równoległego zapisu.
4. Sprawdzić prawdziwe potwierdzenie rejestracji i reset hasła, ponowne logowanie oraz synchronizację na dwóch urządzeniach.
5. Dopiero po tych kontrolach scalić i opublikować. Obecna produkcja pozostaje V01.11.

## 2026-10-19 — pierwsze wejście na drugim urządzeniu
- Ekran konta automatycznie synchronizuje dane przed pokazaniem formularza tworzenia profilu. Błąd pozostawia możliwość ponowienia synchronizacji, eksportu i wylogowania.
- Po pobraniu danych ekran odświeża profil; nie proponuje tworzenia kolejnego, jeżeli istniejący profil został odzyskany.
- Test Chrome obejmuje teraz usunięcie wyłącznie testowej lokalnej kopii konta i odzyskanie profilu z symulowanej chmury. Test przeszedł; nadal nie zastępuje testu prawdziwego Auth/SMTP/RLS.
- 129 testów jednostkowych, build i diff check zakończone poprawnie.
- Plan globalnej wersji Free/Premium zapisano w PLAN-PIERWSZEGO-WYDANIA.md. Następny krok: ustalić domenę/nadawcę poczty i zakończyć konta przed publikacją.

## 2026-10-19 — domena i izolacja kont
- dartparty.app dodano do projektu DART PARTY w Vercel; powiązanie zweryfikowane, DNS nadal wskazuje 213.186.33.5 (OVH). To nie jest jeszcze uruchomienie aplikacji na własnej domenie.
- Vercel get_domain_config zwrócił misconfigured:true; zalecane IPv4 rank 1: 216.150.1.1 i 216.150.16.1. Przed zmianą ponownie odczytać konfigurację. Zachować pocztowe MX/SPF oraz NS. www jeszcze nie dodano.
- Dostęp do treści panelu OVH przez Chrome niedostępny; poproszono użytkownika o otwarcie Strefy DNS. Nie zmieniono DNS ani poczty.
- Test SQL w rzeczywistym projekcie ytljwejzcihyxfewrpej: A/B izolacja odczytu, aktualizacji i wstawiania pod innym właścicielem, zakaz przeniesienia własności, blokada anonimowego użytkownika i anon, poprawny zapis oraz odrzucenie duplikatu i starej rewizji. Wszystko w BEGIN/ROLLBACK, bez trwałych użytkowników i tabeli.
- Test: supabase/tests/player-account-rls.sql. Uruchamiać po treści oczekującej migracji, w tej samej transakcji BEGIN/ROLLBACK; nigdy samodzielnie przeciw produkcji. Nie jest to test dwóch jednoczesnych połączeń ani rzeczywistego logowania.
- Migracja jawnie odbiera też domyślne uprawnienia authenticated przed nadaniem SELECT/INSERT/UPDATE, aby nie odziedziczyć np. TRUNCATE.
- Konta nadal nieopublikowane. Następne: DNS, konfiguracja nadawcy przez użytkownika, prawdziwe potwierdzenie/reset i test dwóch urządzeń.
