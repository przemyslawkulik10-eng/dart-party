# GRAJ V 01.11
Moduł: src/game-library.js. Katalog: 501,301,201,Cricket,Cyferki,Mnożnik,JDC,Sektor20.
Adres: /?page=graj. Integracja w app.js; home-ui.js prowadzi do podstrony. Lokalny zapis ulubionych i ostatnio wybieranych, bez zmian historii wyników.
UI: własny baner Mnożnika, filtry wszystkie/znajomi/solo/ulubione, szukanie nazw i opisów, pusty stan, wznowienie meczu.
Testy: 127 testów Node, build, diff check oraz library-browser, home-browser, x01-setup-browser, cricket-teams-browser, player-account-browser. Wznowienie z biblioteki sprawdzone osobno.
Rollback: backup/before-library-v0111. Publikacja przez main → Vercel. Brak zmian bazy i silnika gry.
