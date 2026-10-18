# Konta graczy — stan roboczy

Gałąź: feature/player-accounts. Nie opublikowano na produkcji.

Zaimplementowano ekran /?page=konto, logowanie, rejestrację, odzyskiwanie hasła, oddzielną pamięć konta, tworzenie profilu, eksport kopii oraz ręczną synchronizację z kontrolą rewizji. Konto wymaga synchronizacji po grze i przed zmianą urządzenia. Dane gościa pozostają w oryginalnej pamięci. Import historii gościa do konta nie został dodany.

Sesja SDK jest przechowywana w sessionStorage. Dane konta są buforowane lokalnie pod ID użytkownika. Ponowne logowanie jest potrzebne w nowej sesji przeglądarki. Nie czyścić danych przeglądarki przed eksportem lub synchronizacją.

Przygotowano migrację 20261018220956_player_accounts.sql. Sprawdzono jej wykonanie w projekcie DART PARTY ytljwejzcihyxfewrpej w transakcji z ROLLBACK: nie utworzono trwałej tabeli. Projekt firmowy Magazyn pozostaje poza zakresem.

Sprawdzenia: 129 testów jednostkowych, build, diff check. Test Chrome login-browser.cjs: symulowane Auth/API, profil, upload, konflikt, pobranie chmury, logout, pięć rozmiarów ekranu. Istniejący player-account-browser.cjs także przeszedł. Nie jest to dowód działania rzeczywistej wysyłki e-maili ani pełny test RLS między prawdziwymi kontami.

Przed wydaniem:
1. Wybrać usługę pocztową i adres nadawcy; użytkownik nie ma jeszcze dostawcy SMTP. Sekrety wpisać bezpośrednio w Supabase.
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
