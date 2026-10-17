# DART PARTY — fundament danych i AI

## Granica projektu: HOBBY, nie system firmowy

Decyzja użytkownika 17.10.2026: pozostajemy na obecnych kontach i opłaconych planach. DART PARTY ma osobne repozytorium, projekt Vercel oraz osobny projekt/bazę Supabase. Nie łączymy danych ani kluczy z HALA, MÓZG KASIA, B2B i NERO. Nie zakładamy nowych kont ani dodatkowych subskrypcji usług bez konkretnej potrzeby.

Odczyt konektorów 17.10.2026:
- GitHub: istnieje publiczne repo przemyslawkulik10-eng/dart-party.
- Vercel: istnieje projekt dart-party (prj_rnhWM9JIVuxDURvdhmmAmenv8QSq) w zespole DostawaWarzyw. Zgodne z decyzją o wspólnym koncie i osobnym projekcie.
- Supabase: konektor udostępnia organizację DostawaWarzyw i tylko projekt Magazyn. Brak widocznego projektu DART PARTY; nie dowodzi to jego nieistnienia poza zakresem połączenia. Historyczna notatka o osobnej organizacji nie jest potwierdzona.
- Nie wykonano transferu, tworzenia projektu, migracji, zakupu ani zmiany planu. Nigdy nie podłączać gry do bazy Magazyn/NERO. Następny krok: ustalić dostępność dedykowanego projektu oraz jego koszt przed utworzeniem.
- AI: osobny klucz/projekt API dla gry; bez kluczy firmowych. Dane lokalne używają osobnych kluczy dart-party-*.

## Zaakceptowany kierunek produktu i subskrypcji

Hobby może docelowo zarabiać. Użytkownik zatwierdził kierunek: podstawowa gra bez reklam, opcjonalny płatny pakiet z trenerem AI, indywidualnymi planami i zaawansowaną analizą postępów. Cena i szczegółowy zakres po testach. Nie wdrożono płatności ani blokad premium. Trener pozostaje dobrowolny; trening przygotowuje do zawodów, a zawody nie podpowiadają.

## Co wdrożono lokalnie

- src/profiles.js: stały UUID profilu, niezależny od meczu; nazwa unikalna na urządzeniu bez rozróżniania wielkości liter. Uszkodzony magazyn nie jest automatycznie nadpisywany.
- Nowe treningi otrzymują profileId, nowe mecze profileIds w kolejności zawodników (także po walce o start). Stare dane nie są przypisywane po imieniu ani przeliczane automatycznie.
- src/coach-context.js: agregacja rzeczywistych trafień i zamierzonych celów treningowych; osobne podsumowanie zakończonych meczów. W meczach zamiar jest nieznany. Nie używać zer Cricket jako miary chybienia tarczy. Historia ograniczona do 30 treningów i 20 zakończonych meczów.
- server/coach.js: adapter OpenAI Responses API. Klucz i model z serwerowego środowiska, store:false, ustrukturyzowany wynik, ograniczony rozmiar odpowiedzi, timeout i obsługa odmów/błędów. Do modelu nie trafiają imiona, UUID ani dane kont; tylko statystyki i daty sesji.
- AI nie liczy punktów, nie modyfikuje gry i nie przyznaje awansów. Na obecnym etapie może zalecić tylko dostępne ćwiczenie sektora 20; nie udajemy gotowej biblioteki ani pełnej ścieżki poziomów.
- UI: dobrowolny trener, przycisk prośby o analizę, informacja o przesyłanych danych, osobne podstawowe wskazówki oraz wynik AI. Zmiana ekranu/wyłączenie trenera przerywa oczekiwanie; błędy nie zatrzymują gry. Analizy zapisują się lokalnie osobno.

## Uruchomienie lokalnego AI

1. Utwórz/użyj prywatnego projektu OpenAI API wyłącznie dla hobby. Rozliczenie i dostępny model muszą być aktywne. Nie przekazuj klucza w rozmowie.
2. Najpierw zatrzymaj dotychczasowy serwer przez Ctrl+C w jego terminalu. W folderze repo uruchom `python3 scripts/configure-ai.py`. Skrypt pyta o klucz bez wyświetlania i nazwę modelu, zapisuje .env.local z uprawnieniami 0600. Plik jest ignorowany przez Git.
3. Uruchom nowy serwer: `npm run dev`. Nie uruchamiać drugiego procesu na zajętym 4173.
4. Odśwież aplikację, rozpocznij NOWY trening na profilu, zaznacz trenera i wybierz analizę AI. Starsze sesje bez profilu nie są automatycznie łączone z tożsamością.
5. Brak klucza/modelu daje jawny błąd konfiguracji, nigdy atrapę odpowiedzi AI.

## Bezpieczeństwo i zakres wydania

Lokalny serwer słucha wyłącznie 127.0.0.1, weryfikuje Host i Origin, wymaga nagłówka aplikacji, ogranicza wielkość wejścia do 256 kB, jedną analizę naraz i co najmniej 30 sekund między żądaniami. Udostępnia wyłącznie publiczne pliki aplikacji, nigdy .env, .git, server ani database. Poprzedni serwer udostępniał cały katalog — dlatego konfigurację sekretów wolno uruchomić dopiero po jego zatrzymaniu i uruchomieniu nowego serwera.

To nie jest jeszcze publiczny backend dla sklepowej aplikacji. Build nadal daje frontend statyczny. Nie dodano otwartego płatnego endpointu Vercel. Przed publikacją: konta użytkowników, uwierzytelnienie API, autoryzacja profili, trwałe limity kosztów na użytkownika, polityka kopii danych i synchronizacja treningów. Lokalne profile nie są kontami i nie synchronizują się między urządzeniami. RLS i migracje nowej bazy dopiero jako osobny zatwierdzony etap.

## Sprawdzenie

57 testów jednostkowych/integracyjnych przeszło: profile, zachowanie starych zapisów, kontekst bez nazw, zakończone mecze, kontrakt Responses API z atrapą transportu, brak klucza, odmowa i niepełna odpowiedź, odrzucenie obcego Origin, limit kosztów, rozmiar danych i blokada plików prywatnych. Build i składnia JS przeszły. Nie wykonano żywego wywołania OpenAI ani odsłuchu; brak klucza/modelu. Nie wykonano migracji, deploy ani pusha.

## Dokumentacja źródłowa

- [OpenAI: Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses)
- [OpenAI: Responses API, store i format odpowiedzi](https://developers.openai.com/api/docs/guides/migrate-to-responses)

## Kolejne etapy

1. Konfiguracja prywatnego projektu API i rzeczywisty test trenera, następnie ocena jakości porad na znanych przykładach.
2. Osobny projekt chmury hobby, konta, przypisanie profili i kopie/synchronizacja; migracje przed wykonaniem do zatwierdzenia.
3. Ustalona z użytkownikiem ścieżka umiejętności i jawne kryteria awansu; AI nie odblokowuje gier samowolnie.
4. Weryfikacja efektów krótkich sesji na sparingach; docelowa aplikacja iOS/Android.
5. API Scolii po zweryfikowaniu dostępu i warunków, bez łączenia z firmową infrastrukturą.
