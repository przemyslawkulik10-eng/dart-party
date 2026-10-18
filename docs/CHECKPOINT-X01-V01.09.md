# X01 — V 01.09
Ekran konfiguracji przed meczem w src/x01-setup.js, integracja w src/app.js i style w styles.css.
Wejście: strona główna → Sparing / zawody → 501/301/201 lub profil → wybrana gra.
Zakres: ustawienia, skład, reguły, dźwięk i podsumowanie. Punktacja i walka o start pozostają oparte na istniejącym silniku.
Testy: npm test 127/127, npm run build, git diff --check; tests/x01-setup-browser.cjs, cricket-teams-browser.cjs, player-account-browser.cjs.
Uruchomienie przeglądarkowych: PLAYWRIGHT_MODULE wskazuje zainstalowany Playwright, DART_TEST_URL wskazuje serwer.
Kopia przed wydaniem: backup/before-x01-v0109 (199e28f). Publikacja przez push main → automatyczny Vercel.
Pozostaje osobno: bot/online, konta i synchronizacja profili, nowe logo. Nie deklarować ich jako dostępnych.
