const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function validateTeamAssignments(assignments){
  if(!Array.isArray(assignments)||assignments.length!==5||assignments.some(team=>!Number.isInteger(team)||team<0||team>2))throw new Error('Wybierz drużynę dla każdej z pięciu osób.');
  const counts=[0,1,2].map(team=>assignments.filter(value=>value===team).length).sort();
  if(counts.join(',')!=='1,2,2')throw new Error('Utwórz dwie pary i jednego gracza solo: 2 + 2 + 1.');
  return [...assignments];
}

export function teamSetupMarkup(names){
  if(!Array.isArray(names)||names.length!==5)throw new Error('Ten wariant Cricket wymaga pięciu graczy.');
  return `<form data-team-form><div class="modal-heading"><h2 id="team-setup-title">Cricket · dwie pary i solo</h2><button type="button" data-team-cancel aria-label="Zamknij wybór drużyn">×</button></div>
    <p id="team-setup-help">Przypisz każdą osobę. Dwie drużyny mają po dwóch graczy, trzecia jednego. Para współdzieli punkty i zamknięte pola.</p>
    <div class="training-form">${names.map((name,index)=>`<label for="team-player-${index}">${escapeHtml(name)}<select id="team-player-${index}" data-team-player="${index}" required><option value="">Wybierz drużynę</option><option value="0">Drużyna A</option><option value="1">Drużyna B</option><option value="2">Drużyna C</option></select></label>`).join('')}</div>
    <p data-team-preview aria-live="polite">Nie wybrano drużyn.</p><p data-team-error class="error" role="alert"></p>
    <div class="dialog-actions"><button type="submit" class="primary">Zatwierdź drużyny</button><button type="button" data-team-cancel>Anuluj</button></div></form>`;
}

/** Opens an independent dialog; onConfirm receives one team index per original player. */
export function mountTeamSetup(container,names,onConfirm,onCancel=()=>{}){
  const dialog=document.createElement('dialog');
  dialog.setAttribute('aria-labelledby','team-setup-title');
  dialog.setAttribute('aria-describedby','team-setup-help');
  dialog.innerHTML=teamSetupMarkup(names);
  const previousFocus=document.activeElement;
  container.append(dialog);
  const form=dialog.querySelector('[data-team-form]');
  const selects=[...dialog.querySelectorAll('[data-team-player]')];
  const error=dialog.querySelector('[data-team-error]');
  let disposed=false;
  function dispose(){if(disposed)return;disposed=true;dialog.close();dialog.remove();if(previousFocus?.isConnected)previousFocus.focus();}
  function cancel(){dispose();onCancel();}
  dialog.querySelectorAll('[data-team-cancel]').forEach(button=>button.addEventListener('click',cancel));
  dialog.addEventListener('cancel',event=>{event.preventDefault();cancel();});
  form.addEventListener('change',()=>{
    error.textContent='';
    const preview=dialog.querySelector('[data-team-preview]');
    preview.textContent=[0,1,2].map(team=>`${['A','B','C'][team]}: ${names.filter((_,index)=>selects[index].value===String(team)).join(' + ')||'—'}`).join(' · ');
  });
  form.addEventListener('submit',event=>{
    event.preventDefault();
    try{
      const teams=validateTeamAssignments(selects.map(select=>select.value===''?null:Number(select.value)));
      onConfirm(teams);
      dispose();
    }catch(cause){error.textContent=cause.message||'Nie udało się zapisać drużyn.';}
  });
  dialog.showModal();
  selects[0].focus();
  return dispose;
}
