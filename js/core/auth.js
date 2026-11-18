async function request(path,options={}){const res=await fetch('/api'+path,{credentials:'same-origin',headers:{'Content-Type':'application/json'},...options});const body=await res.json().catch(()=>({}));if(!res.ok)throw Error(body.error||'Falha de comunicação com servidor.');return body}
export async function currentUser(){try{return (await request('/auth/me')).user}catch{return null}}
export async function login(email,password){return (await request('/auth/login',{method:'POST',body:JSON.stringify({email,password})})).user}
export async function signup(name,email,password){return (await request('/auth/register',{method:'POST',body:JSON.stringify({name,email,password})})).user}
export async function logout(){await request('/auth/logout',{method:'POST'});location.replace('/pages/login.html')}
export async function loadData(type){return (await request('/data/'+type)).data}
export async function saveData(type,data){return request('/data/'+type,{method:'PUT',body:JSON.stringify({data})})}
