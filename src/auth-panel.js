import {addPasswordVisibility} from './password-visibility.js';
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Keep form state local: passwords are never retained when switching screens.
export function mountAuthPanel(root,{login,signup,resetPassword,onLogin}){
 let mode='login',email='',pending=false;
 function render(focus=false){
  const sent=mode==='sent'||mode==='reset-sent',register=mode==='signup',reset=mode==='reset';
  const title=sent?'Sprawdź pocztę':register?'Utwórz konto gracza':reset?'Odzyskaj dostęp':'Zaloguj się do gry';
  root.innerHTML=`<section class="account-panel auth-panel"><a class="auth-back" href="/">← Strona główna</a><p class="eyebrow">DART PARTY · TWOJE KONTO</p>
   ${!sent&&!reset?`<div class="auth-switch" aria-label="Wybierz logowanie lub rejestrację"><button type="button" data-mode="login" aria-pressed="${!register}">Logowanie</button><button type="button" data-mode="signup" aria-pressed="${register}">Rejestracja</button></div>`:''}
   <h1 tabindex="-1">${title}</h1>
   <p class="auth-description">${sent?'Otwórz wiadomość i kliknij znajdujący się w niej link.':register?'Załóż własne konto, aby zapisywać wyniki i przenosić je między urządzeniami.':reset?'Podaj adres swojego konta. Wyślemy na niego link do zmiany hasła.':'Wróć do swojego profilu, wyników i historii gry.'}</p>
   ${sent?`<div class="auth-notice"><p>${mode==='sent'?'Jeśli adres może zostać zarejestrowany, otrzymasz wiadomość potwierdzającą na:':'Jeśli konto istnieje, wyślemy link na:'}</p><strong>${escapeHtml(email)}</strong><p>Sprawdź też folder Spam. Wiadomość może dotrzeć po kilku minutach.</p></div><button class="primary auth-submit" data-mode="login">Przejdź do logowania</button><button class="auth-text-button" data-mode="${mode==='sent'?'signup':'reset'}">Popraw adres e-mail</button>`:
   `<form id="auth-form"><label for="auth-email">Adres e-mail</label><input id="auth-email" name="email" type="email" autocomplete="email" autocapitalize="none" spellcheck="false" value="${escapeHtml(email)}" placeholder="np. gracz@example.com" required>
   ${!reset?`<label for="auth-password">${register?'Utwórz hasło':'Hasło'}</label><input id="auth-password" name="password" type="password" autocomplete="${register?'new-password':'current-password'}" ${register?'minlength="10" aria-describedby="auth-password-hint"':''} required>${register?'<p id="auth-password-hint" class="auth-hint">Minimum 10 znaków. Użyj hasła do aplikacji, nie hasła swojej poczty.</p><label for="auth-confirm">Powtórz hasło</label><input id="auth-confirm" name="confirm" type="password" autocomplete="new-password" minlength="10" required>':''}`:''}
   <p id="auth-status" role="status" aria-live="polite"></p><button type="submit" class="primary auth-submit">${register?'Utwórz konto':reset?'Wyślij link do zmiany hasła':'Zaloguj się'}</button>
   ${register?'<p class="auth-hint">Po rejestracji potwierdź adres e-mail, a następnie zaloguj się.</p>':''}</form>
   <button class="auth-text-button" data-mode="${reset?'login':'reset'}">${reset?'← Wróć do logowania':'Nie pamiętam hasła'}</button>`}
   <div class="auth-guest"><span>Chcesz tylko zagrać?</span><a href="/">Graj jako gość →</a></div></section>`;
  addPasswordVisibility(root);
  if(focus)root.querySelector('h1').focus();
  root.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{
   if(pending)return;
   email=root.querySelector('[name=email]')?.value.trim()??email;
   mode=button.dataset.mode;render(true);
  });
  const form=root.querySelector('form');
  if(!form)return;
  const confirm=form.elements.confirm;
  if(confirm)for(const input of [confirm,form.elements.password])input.oninput=()=>confirm.setCustomValidity('');
  form.onsubmit=async event=>{
   event.preventDefault();if(pending)return;
   email=form.elements.email.value.trim();
   if(confirm&&confirm.value!==form.elements.password.value){confirm.setCustomValidity('Hasła muszą być takie same.');confirm.reportValidity();return;}
   if(!form.reportValidity())return;
   pending=true;form.setAttribute('aria-busy','true');
   const buttons=[...root.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);
   const status=root.querySelector('#auth-status');status.textContent=register?'Tworzenie konta…':reset?'Wysyłanie linku…':'Logowanie…';
   try{
    if(register){await signup(email,form.elements.password.value);mode='sent';render(true);}
    else if(reset){await resetPassword(email);mode='reset-sent';render(true);}
    else{await login(email,form.elements.password.value);await onLogin();}
   }catch(error){status.setAttribute('role','alert');status.textContent=error.message;}
   finally{pending=false;form.removeAttribute('aria-busy');buttons.forEach(b=>b.disabled=false);}
  };
 }
 render();
}
