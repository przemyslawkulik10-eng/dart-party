# Logo i ikona DART PARTY — 22.10.2026

Użytkownik wskazał dołączoną grafikę jako nowe logo i ikonę aplikacji. Oryginał zachowano bez zmian w `dart-party-logo-source.webp` (1600×1600, SHA-256: `711142127aea38be781874c1be7b597294d09cfad75c13af80bfd8a6714a33fa`).

Lokalne zastosowanie:
- `public/dart-party-logo.png`: pełna grafika 1600×1600 na stronie głównej; usunięto dawne okrągłe przycięcie i powiększenie.
- `public/dart-party-icon-192.png` i `public/dart-party-icon-512.png`: ikony PWA; wariant 192 również w nagłówku w dotychczasowym miejscu symbolu.
- `public/dart-party-apple-touch-icon.png`: 180×180 dla ekranu początkowego Apple.
- `public/dart-party-favicon-32.png`: 32×32 dla karty przeglądarki.

Wykonano jedynie konwersję formatu i eksport rozmiarów przez macOS sips; bez generowania nowego projektu, retuszu lub zmiany kolorów. Adresy obrazów mają wersję `?v=20261022`, aby odróżnić je od poprzednio zapamiętanych plików. Zachowano układ aplikacji, reguły gry i dane.

Weryfikacja: build i diff check poprawne; lokalny Chrome na zbudowanej aplikacji, 1920×1080, 1180×820, 1024×768, 820×1180 i 390×844. Sprawdzono ładowanie logo, wymiary ikon manifestu, favicon/Apple, wejście i wyjście z pełnego ekranu, dialog historii oraz nagłówek przy grze 2 i 6 osób z długim imieniem. Brak poziomego overflow i błędów JS. Zrzuty z danymi syntetycznymi: `evidence/logo-20261022/`. Obejrzano stronę główną na 1180/390 oraz plansze 6 osób na 1180 i 2 osób na 390.

Zmiana lokalna po `a19b0c9`, bez push, publikacji i migracji. Nie potwierdzano aktualizacji ikon na fizycznie zainstalowanej PWA; na urządzeniach pojawią się dopiero po osobno autoryzowanym wydaniu i aktualizacji przez przeglądarkę/system.
