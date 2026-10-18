# Strona główna V 01.10
Nowy moduł src/home-ui.js, integracja renderHome w src/app.js, style .dp-home i .home-* w styles.css.
Logo użytkownika public/dart-party-logo.png pozostaje niezmodyfikowane; prezentacja w banerze używa CSS clip-path. Lokalny server/http.js obsługuje teraz PNG.
Testy: 127/127, build, diff check, home-browser.cjs, x01-setup-browser.cjs, cricket-teams-browser.cjs, player-account-browser.cjs. Testy przeglądarkowe używają PLAYWRIGHT_MODULE i DART_TEST_URL. Zweryfikowano 1920/1180/1024/820/390px, długie nazwy i 2/6 zawodników w X01.
Publikacja: standardowy push main uruchamia Vercel. Backup przed zmianą: backup/before-home-v0110.
Brak zmian silnika, autoryzacji i bazy. Konta/synchronizacja profili i nowe tryby to kolejne osobne etapy.
