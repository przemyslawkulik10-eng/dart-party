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

## Ikony gier 501, 301 i 201 — 22.10.2026

Użytkownik przekazał trzy nowe grafiki. Przypisanie ustalono według numeru na obrazie: plik zaczynający się od `857371308` to 201, `858596274` to 301, `859509236` to 501. Oryginały zachowano jako `dart-party-201-source.webp`, `dart-party-301-source.webp` i `dart-party-501-source.webp`. Eksporty PNG 512×512 znajdują się w `public/game-icons/`; wykonano wyłącznie konwersję formatu i rozmiaru przez sips.

Ikony zastosowano na kartach strony głównej i biblioteki, w panelu gracza oraz w ustawieniach X01 (wybór wariantu i ilustracja wybranego trybu). `src/x01-icons.js` zapewnia wspólne przypisanie. Grafiki zachowują pełne proporcje i oryginalne kolory, bez filtrów wcześniejszych ikon. Nie zmieniono zasad ani zapisów rozgrywek.

Weryfikacja: 186/186 testów jednostkowych, build, diff check; Chrome na zbudowanej aplikacji z danymi syntetycznymi. Sprawdzono przypisanie/ładowanie obrazów i otwieranie właściwych trybów ze strony głównej, biblioteki oraz przełączanie w ustawieniach. Pięć rozmiarów: 1920×1080, 1180×820, 1024×768, 820×1180, 390×844; ustawienia dla 2 i 6 graczy z długim imieniem, panel pustego profilu. Brak poziomego overflow i błędów JS. Zrzuty: `evidence/x01-icons-20261022/`; obejrzano karty na 1180 i ustawienia na 390. Bez testu fizycznego dotyku.

Zmiana lokalna po `b29ebbe`, bez push, publikacji i migracji.

## Ikona Cricket — 22.10.2026

Użytkownik wskazał grafikę z tabelą 20–15/BULL i napisem CRICKET jako ikonę tej gry. Oryginał: `dart-party-cricket-source.webp`; eksport PNG 512×512: `public/game-icons/cricket.png`. Bez retuszu, przycinania ani zmiany kolorów.

Zastosowano na stronie głównej, w bibliotece, panelu gracza i wyborze trybu w ustawieniach Cricket. Wspólny moduł obrazów nazywa się teraz `src/game-artwork.js` (zastępuje `src/x01-icons.js`); zachowano grafiki 501/301/201. W mobilnych ustawieniach Cricket skorygowano minimalną szerokość paneli, kolumn kart i wielkość napisów, ponieważ widok wychodził poza ekran 390 px. Zasady i dane gry pozostają bez zmian.

Weryfikacja: 186/186 testów, build i diff check; Chrome na pięciu rozmiarach ekranu. Sprawdzono obrazy wszystkich czterech gier, wejście do Cricket ze strony głównej i biblioteki, ustawienia Cricket, profil oraz regresję wyboru X01 i ustawienia 2/6 osób. Po poprawce brak poziomego overflow i błędów JS. Obejrzano karty na 1180 oraz ustawienia Cricket na 390. Zrzuty syntetyczne: `evidence/cricket-icon-20261022/`. Bez fizycznego testu dotyku, push, publikacji i migracji.

## Logo Cyferek — 22.10.2026

Przesłany obraz z numerami 1–20/BULL i napisem CYFERKI jest nową grafiką tej gry. Oryginał zachowano jako `dart-party-cyferki-source.webp`; eksport PNG 512×512: `public/game-icons/cyferki.png`. Tylko konwersja formatu i rozmiaru przez sips, bez przycinania i zmiany kolorów.

Dodano do wspólnego przypisania w `src/game-artwork.js`, biblioteki i panelu gracza; strona główna korzysta automatycznie z tego przypisania. Nie zmieniono zasad, danych ani planszy gry.

Weryfikacja: 186/186 testów jednostkowych, build i diff check. Chrome na pięciu rozmiarach ekranu (1920×1080, 1180×820, 1024×768, 820×1180, 390×844), dane syntetyczne. Obraz ładuje się w pełnych proporcjach na stronie głównej, w bibliotece i panelu; każde z trzech wejść otwiera ustawienia Cyferek. Brak poziomego overflow i błędów JS. Obejrzano karty na 1180 i 390; zrzuty w `evidence/cyferki-icon-20261022/`. Bez fizycznego testu dotyku, push, publikacji i migracji.

## Logo Mnożnika — 22.10.2026

Kolejna grafika użytkownika, z lotką, ×1/×2/×3 i napisem MNOŻNIK, została przypisana do Mnożnika 7–12. Oryginał: `dart-party-mnoznik-source.webp`; PNG 512×512: `public/game-icons/mnoznik.png`. Konwersja przez sips, bez retuszu, przycinania i zmiany kolorów.

Zastosowano na stronie głównej, w bibliotece (karta i główna ilustracja promująca grę) oraz panelu gracza. Wszystkie sześć głównych kart ma teraz grafiki użytkownika. Zasady i dane pozostają bez zmian.

Weryfikacja: 186/186 testów, build i diff check; Chrome z danymi syntetycznymi. Pięć rozmiarów ekranu: 1920×1080, 1180×820, 1024×768, 820×1180, 390×844. Sprawdzono ładowanie/przypisanie obrazu, stronę główną, bibliotekę, jej główną ilustrację i panel gracza. Wszystkie cztery wejścia (łącznie z przyciskiem promocji) otwierają ustawienia Mnożnika. Brak poziomego overflow i błędów JS. Obejrzano komplet kart i promocję na 1180; zrzuty: `evidence/mnoznik-icon-20261022/`. Bez testu fizycznego dotyku, push, publikacji i migracji.

## JDC Challenge — 22.10.2026

Grafika użytkownika: `dart-party-jdc-source.webp`. Wersja 512 px: `public/game-icons/jdc.png`. Dodana do strony głównej, biblioteki i panelu gracza. Kafelek na stronie głównej otwiera istniejący ekran JDC z wybranym profilem.

## Nowe logo DART PARTY 180 — 22.10.2026

Wzór użytkownika: `dart-party-180-source.webp`. Użytkownik zatwierdził wyciętą wersję bez ramki. Przezroczysty PNG 1254×1254: `public/dart-party-logo.png`; pochodne 512/192/180/32 px służą jako ikony aplikacji, Apple i favicon. Wbudowany imagegen usunął ramkę i tło; sips utworzył pomniejszone pliki. Usunięto przycinanie CSS potrzebne poprzedniemu logo. Nazwa aplikacji pozostaje DART PARTY.

Prompt: Extract ONLY the existing central brand mark: the gold vertically stacked 1, 8, 0 at left, the existing right-hand semicircular dartboard, and the exact gold caption DART PARTY 180 below. Remove the entire enclosing rounded-square gold frame and the navy background outside the mark, including decorative background grid lines and sparks. Output a clean transparent PNG with actual alpha, no rectangle, no frame, no backing tile. Keep the dark navy sections WITHIN the half dartboard as part of the mark. Preserve the original shape, arrangement, numbers, lettering, metallic texture, gold highlights and relative proportions as closely as possible. This is a cutout, not a redesign; do not fix or reinterpret the small dartboard numerals. Do not add anything. Center the complete extracted mark and caption in a square canvas with a small safe transparent margin.
