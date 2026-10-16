# DART PARTY — stan pracy

Autorska aplikacja dla 2–6 osób przy jednej tarczy. Polski interfejs; 501/301/201 i Cricket. Domyślne imiona zgodne ze zleceniem. Supabase i Vercel mają być oddzielone od DostawaWarzyw pod nazwą DART PARTY.

## Gotowe
- Logika rzutów i replay historii; poprawny bust per gracz; cofanie także po wygranej.
- Zapis lokalny, eksport/import, lista meczów; adapter Supabase REST z anonimową sesją i RLS.
- 24 testy logiki: PASS.
- Test Chrome: sześciu graczy, punktacja, zmiana gracza, cofanie, odświeżenie/wznowienie, Cricket, historia; bez błędów JS. Widoki 1180×820, 820×1180, 390×844 bez poziomego przewijania.
- Konfiguracja publikacji Vercel i schemat bazy do osobnego projektu.

## Trwa
- Organizacja Supabase DART PARTY utworzona w planie Free; projekt i baza w przygotowaniu.
- Publikacja GitHub/Vercel i test rzeczywistego zapisu chmurowego.
