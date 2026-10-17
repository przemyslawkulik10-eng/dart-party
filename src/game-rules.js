// Rules use the selected configuration; saved games keep their own variants.
export function gameRules({mode,doubleOut=false,cricketScoring='standard',cricketOpening='standard',legsToWin=1}){
 let title,items;
 if(mode==='jdc'){
  title='JDC Challenge';items=['57 lotek: Shanghai 10–15 (18), D1–D20 i BULL (21), Shanghai 15–20 (18).','Shanghai: trzy lotki na numer, punktuje tylko wskazane pole według wartości ×1/×2/×3. S + D + T tego numeru w jednej kolejce daje dodatkowe 100 pkt.','Double: jedna lotka na cel. Poprawne podwójne = 50 pkt; środek BULL = 100 pkt; zewnętrzny BULL 25 = 0 pkt. Po pudle też przechodzisz dalej.','Maksimum to 3380 pkt. Poziom wyniku dotyczy tej próby, nie oficjalnego awansu w akademii. Możesz przerwać i wznowić próbę.'];
 }else if(mode==='sector-20'){
  title='Celność — sektor 20';items=['Celuj w cały sektor 20. Pojedyncza, podwójna i potrójna dwudziestka to po jednym celnym rzucie.','Wpisuj faktycznie trafione pole. Trafienie innego sektora nie jest trafieniem celu, ale zapisuje się w historii.','Wybierz 5, 10 lub 15 minut. Pauza zatrzymuje czas. Możesz cofnąć rzut lub zakończyć wcześniej.'];
 }else if(mode==='cricket'){
  title=cricketScoring==='cutthroat'?'Cricket — punkty przeciwnikom':'Cricket — punkty dla siebie';
  items=['Gracie na polach 15–20 i BULL. Trzy trafienia zamykają pole: pojedyncza liczy się za jedno, podwójna za dwa, potrójna za trzy. BULL 25 to jedno trafienie, BULL 50 — dwa.',cricketScoring==='cutthroat'?'Nadmiarowe trafienia dopisują punkty każdemu rywalowi, który ma to pole otwarte. Wygrywa gracz z wszystkimi polami zamkniętymi i wynikiem nie wyższym od żadnego przeciwnika.':'Nadmiarowe trafienia dodają punkty Tobie, dopóki przynajmniej jeden rywal ma to pole otwarte. Wygrywa gracz z wszystkimi polami zamkniętymi i wynikiem nie niższym od żadnego przeciwnika.',cricketOpening==='two-triples'?'Włączona zasada domowa: odblokuj 20, zamykając dwa różne pola 15–19. Liczą się pojedyncze, podwójne i potrójne trafienia. Przed odblokowaniem 20 nie punktuje.':'Brak blokady 20 — możesz grać na wszystkich polach od początku.'];
 }else{
  title=String(mode);items=[`Każdy zaczyna od ${mode} punktów. Odejmujemy wartość trafionych pól. Masz do trzech lotek w kolejce. Celem jest dokładnie zero.`,doubleOut?'Double Out: kończysz podwójnym polem lub BULL 50. Przekroczenie zera, pozostawienie 1 lub zakończenie bez podwójnej anuluje punkty całej kolejki.':'Zakończenie dowolnym trafieniem. Przekroczenie zera anuluje punkty całej kolejki. Możesz pozostać z wynikiem 1.','Pojedyncza = wartość pola, podwójna = ×2, potrójna = ×3. BULL ma wartość 25 lub 50.'];
 }
 if(!['jdc','sector-20'].includes(mode))items.push(legsToWin>1?`Mecz do ${legsToWin} wygranych legów. Po legu wynik punktowy zaczyna się od nowa; wygrane legi zostają. Rozpoczynający zmienia się kolejno.`:'Gracie pojedynczy leg.', 'Przed meczem walka o start: po trzy lotki na BULL, najwyższa suma zaczyna. Remisujący liderzy powtarzają próbę. „Cofnij rzut” pozwala poprawić ostatni zapis.');
 return {title,items};
}
export function rulesPanel(options){
 const {title,items}=gameRules(options);
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 return `<details class="game-rules"><summary>Zasady gry · ${esc(title)}</summary><ol>${items.map(item=>`<li>${esc(item)}</li>`).join('')}</ol></details>`;
}
