export function byId(id){ return document.getElementById(id); }
export function safeJsonParse(str, fallback){ try { return JSON.parse(str); } catch { return fallback; } }
export function uniq(arr){ return [...new Set(arr.filter(Boolean))]; }
export function todayISO(){ const d=new Date(); const yyyy=d.getFullYear(); const mm=String(d.getMonth()+1).padStart(2,"0"); const dd=String(d.getDate()).padStart(2,"0"); return `${yyyy}-${mm}-${dd}`; }
export function dayIndexToKey(i){ return ["mon","tue","wed","thu","fri","sat","sun"][i] || `d${i}`; }
export function normalizeDayName(name){
  const n=(name||"").toLowerCase();
  if(n.startsWith("lun"))return"mon"; if(n.startsWith("mar"))return"tue"; if(n.startsWith("mer"))return"wed";
  if(n.startsWith("gio"))return"thu"; if(n.startsWith("ven"))return"fri"; if(n.startsWith("sab"))return"sat"; if(n.startsWith("dom"))return"sun";
  return n.replace(/\s+/g,"_");
}
export function downloadText(filename, content){
  const blob=new Blob([content],{type:"application/json;charset=utf-8"});
  const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}
export function fileToText(file){
  return new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(String(r.result||"")); r.onerror=reject; r.readAsText(file); });
}
export function escapeHtml(s){ return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
