# DART PARTY — konta, historia i dane rozwoju

## Stan 17.10.2026

Działa lokalnie: tworzenie profilu po imieniu/pseudonimie, stały UUID, panel gracza z historią treningów, JDC i meczów; zapis lotek i eksport własnych danych JSON. Wejście: ekran główny → Profile i statystyki.

To nie są jeszcze konta z uwierzytelnieniem. Profile na wspólnym tablecie są widoczne jego użytkownikom. Brak synchronizacji profili, JDC i treningów między urządzeniami. Istniejąca synchronizacja anonimowej sesji tabletu w cloud.js nie nadaje się do zastąpienia kont graczy bez przebudowy.

## Zakres kont zatwierdzony kierunkowo

- Użytkownik poprosił o konta graczy, historię, statystyki i zbieranie danych do rozwoju; zaakceptowano rekomendację logowania jednorazowym linkiem na e-mail.
- Konto potwierdzane przez Supabase Auth. Nie tworzyć cudzych kont z domyślnego składu meczu ani zgadywać adresów e-mail.
- Profil lokalny na tablecie i konto online są odrębnymi tożsamościami. Po logowaniu świadome powiązanie własnego profilu; nie przypisywać wszystkich profili tabletu do osoby logującej się.
- Wspólny tablet zapisuje mecz dla wielu osób. Docelowo osobne uprawnienia gospodarza i uczestników oraz zatwierdzane powiązanie uczestnika z kontem. Nie pozwalać na przejęcie historii wyłącznie po wpisaniu imienia.
- Dostęp do danych online ograniczony właścicielem po stronie bazy (RLS i auth.uid), nie tylko filtrem interfejsu. Konto nie musi udostępniać swojej historii innym graczom.

## Konkretny następny zasób — oczekuje na zgodę kosztową

- Nazwa: DART PARTY.
- Organizacja istniejąca: DostawaWarzyw (abowhigsnflfxokiyhax), obecne konto i plan.
- Region: eu-central-1 (Frankfurt).
- Wycena narzędzia Supabase get_cost: 10 USD miesięcznie za nowy projekt. Nie jest to obietnica stałego rachunku przy ponadlimitowym zużyciu.
- Zapytanie o akceptację tej kwoty wysłano w rozmowie. Bez odpowiedzi nie tworzyć płatnego zasobu.
- Nie podłączać gry do Magazyn (jvbwcknvztfxjocxqwmv). Nowy projekt = osobna baza, Auth i klucze. Nie kupować nowego planu Pro ani konta.
- Przed tworzeniem ponownie sprawdzić listę projektów, aby uniknąć duplikatu. Po utworzeniu odczytać ID/status i zapisać tutaj. Obecnie ID DART PARTY: NIE USTALONO.

## Dane potrzebne do rozwoju

- Profil: UUID, pseudonim, data utworzenia; e-mail wyłącznie w warstwie konta, nie w danych wysyłanych trenerowi.
- Sesja: rodzaj ćwiczenia/gry, wersja zasad, profil uczestnika, data, stan ukończenia.
- Lotka: numer sektora, mnożnik, kolejność; czas zapisu w treningach. Cel treningu: jawny dla sektora 20, wyliczalny z pozycji w 57-lotkowej rutynie JDC. W meczach zamiar nie jest rejestrowany — nie wymyślać go.
- Wyniki JDC: punkty i trafienia każdego etapu, liczba Shanghai, całkowity wynik i poziom pojedynczej próby. Nie utożsamiać poziomu wyniku z oficjalnym stopniem akademii.
- Rozwój: poprzedni wynik, rekord, średnia pełnych prób oraz skuteczność konkretnego D1–D20/BULL wraz z liczbą prób; sektor 20 liczony jako suma trafień / suma lotek, a nie średnia procentów sesji.
- Mecze: zakończenie, zwycięstwa, legi i liczba własnych lotek; nie nazywać surowych punktów z bustów średnią meczową. Zera Cricket nie oznaczają automatycznie chybienia tarczy.
- Nie zbieramy adresu, daty urodzenia, lokalizacji ani innych danych niepotrzebnych do treningu. Brak automatycznej analityki marketingowej. Analiza AI uruchamiana dobrowolnie.

## Dalsze wdrożenie po zgodzie na zasób

1. Utworzenie i potwierdzenie osobnego projektu. Odczyt schematu nowego projektu przed przygotowaniem migracji.
2. Przygotowanie migracji profili, sesji, uczestników i lotek z RLS do akceptacji; testy izolacji dwóch kont i gościa przed publikacją.
3. Logowanie linkiem, obsługa callbacku i wylogowania, konfiguracja dozwolonych przekierowań i wysyłki poczty. Żadnych testowych wiadomości do prawdziwych graczy bez polecenia.
4. Jednoznaczne powiązanie profili lokalnych, kopia przed synchronizacją, obsługa konfliktów i pracy offline. Brak cichego nadpisywania historii z drugiego urządzenia.
5. QA na dwóch kontach i dwóch urządzeniach, eksport i obsługa usuwania własnego konta/danych. Publikacja osobno za zgodą.

Źródła: https://supabase.com/docs/guides/auth/auth-email-passwordless oraz https://supabase.com/docs/guides/platform/billing-on-supabase . Wycena konkretnego projektu pochodzi z konektora, nie z ogólnego cennika.

## Uzupełnienie: logowanie nigdy nie blokuje gry

Decyzja użytkownika: stale dostępne sparingi bez logowania; gracz sam wybiera korzystanie z trenera AI lub tylko z licznika do gry. Konto/synchronizacja opcjonalne. Nie wprowadzać obowiązkowego e-maila ani automatycznej rejestracji wszystkich uczestników meczu. Przejście gość → konto ma zachować własną historię, z jawnym wyborem profilu. Wielojęzyczność obejmuje też rejestrację i informację o danych. Szczegóły w KIERUNEK-ROZWOJU.md.
