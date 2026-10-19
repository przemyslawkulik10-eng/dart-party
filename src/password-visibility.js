const eye=`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path class="password-eye-slash" d="m3 3 18 18"/></svg>`;
export function addPasswordVisibility(root){
 root.querySelectorAll('input[type="password"]').forEach((input,index)=>{
  if(input.closest('.password-field'))return;
  if(!input.id)input.id=`password-field-${index}`;
  const wrapper=document.createElement('div');wrapper.className='password-field';
  input.before(wrapper);wrapper.append(input);
  const button=document.createElement('button');button.type='button';button.className='password-toggle';button.innerHTML=eye;
  button.setAttribute('aria-controls',input.id);button.setAttribute('aria-pressed','false');
  const label=root.querySelector(`label[for="${input.id}"]`)?.textContent?.trim()||(input.name==='confirm'?'Powtórz hasło':'Hasło');
  const update=()=>{const shown=input.type==='text';button.setAttribute('aria-pressed',String(shown));button.setAttribute('aria-label',`${shown?'Ukryj':'Pokaż'} hasło — ${label}`);button.title=shown?'Ukryj hasło':'Pokaż hasło';};
  button.onclick=()=>{input.type=input.type==='password'?'text':'password';update();};
  update();wrapper.append(button);
 });
}
