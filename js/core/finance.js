export async function api(type,id,method='GET',body){const r=await fetch('/api/finance/'+type+(id?'/'+encodeURIComponent(id):''),{method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});if(!r.ok)throw Error('Não foi possível concluir a operação.');return (await r.json()).data;}
export const put=(t,r)=>api(t,r.id,'PUT',r);
export const remove=(t,id)=>api(t,id,'DELETE');
export const today=()=>new Date().toLocaleDateString('sv-SE');
export const uid=()=>crypto.randomUUID();
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const $=id=>document.getElementById(id);
export const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n/100);
export const cents=n=>Math.round(Number(n)*100);
export function handle(fn){return async e=>{e?.preventDefault();try{await fn(e)}catch(err){alert(err.message)}}}
export const categories=['Alimentação','Moradia','Transporte','Saúde','Educação','Lazer','Outros'];
export const options=(a)=>a.map(x=>`<option>${esc(x)}</option>`).join('');
