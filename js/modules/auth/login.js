import {currentUser,login,signup} from '../../core/auth.js';
const $=id=>document.getElementById(id);let mode='login';
function message(t,ok=false){$('feedback').textContent=t;$('feedback').className=ok?'feedback ok':'feedback'}
function setMode(next){mode=next;const sign=next==='signup';$('form-title').textContent=sign?'Comece sua jornada':'Boas-vindas de volta!';$('form-subtitle').textContent=sign?'Crie sua conta para salvar sua evolução.':'Entre para continuar sua jornada financeira.';$('submit').textContent=sign?'Criar conta':'Entrar na minha conta';$('name-row').hidden=!sign;$('switch-mode').textContent=sign?'Já tem uma conta? Entrar':'Não tem uma conta? Cadastre-se';$('password').autocomplete=sign?'new-password':'current-password';$('password').minLength=sign?10:1;$('form').reset();message('')}
$('switch-mode').addEventListener('click',()=>setMode(mode==='login'?'signup':'login'));
$('toggle-password').addEventListener('click',()=>{$('password').type=$('password').type==='password'?'text':'password'});
$('form').addEventListener('submit',async e=>{e.preventDefault();$('submit').disabled=true;message('');try{const email=$('email').value.trim(),password=$('password').value;if(mode==='signup')await signup($('name').value.trim(),email,password);else await login(email,password);location.replace('/pages/inicio.html')}catch(err){message(err.message)}finally{$('submit').disabled=false}});
currentUser().then(u=>{if(u)location.replace('/pages/inicio.html')});setMode('login');
