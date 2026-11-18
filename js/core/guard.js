import {currentUser,logout} from './auth.js';
const loginUrl=new URL('../../pages/login.html',import.meta.url);
try {
 const user=await currentUser();
 if(!user){window.location.replace(loginUrl.href)}
 else {
   sessionStorage.setItem('passaporte12:activeUser',user.id);
   document.documentElement.classList.add('auth-ready');
   const nav=document.querySelector('.site-header,.top');
   if(nav){const btn=document.createElement('button');btn.textContent='Sair';btn.className='auth-logout';btn.type='button';btn.addEventListener('click',async()=>{btn.disabled=true;try{await logout()}catch(e){alert('Não foi possível sair: '+e.message);btn.disabled=false}});nav.append(btn)}
 }
} catch(e){document.documentElement.classList.add('auth-ready');document.body.innerHTML='<main style="max-width:600px;margin:15vh auto;padding:25px;font:16px system-ui"><h1>Configuração de autenticação necessária</h1><p id="auth-error"></p><a href="'+loginUrl.href+'">Ir para login</a></main>';document.getElementById('auth-error').textContent=e.message}
